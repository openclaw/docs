---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter in OpenClaw uitvoeren
    - Je wilt OpenRouter gebruiken voor beeldgeneratie
    - Je wilt OpenRouter gebruiken voor muziekgeneratie
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:14:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die verzoeken naar veel modellen achter één
endpoint en API-sleutel routeert. Deze is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

## Aan de slag

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run OAuth onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw opent de browseraanmeldflow van OpenRouter, wisselt de PKCE-
        code in voor een OpenRouter-API-sleutel en slaat die sleutel op in het standaard
        OpenRouter-authprofiel. Op externe/headless hosts drukt OpenClaw de
        aanmeld-URL af en vraagt het je de omleidings-URL te plakken na het aanmelden.
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Onboarding gebruikt standaard `openrouter/auto`. Kies later een concreet model:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get your API key">
        Maak een API-sleutel aan op [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Run API-key onboarding">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optional) Switch to a specific model">
        Onboarding gebruikt standaard `openrouter/auto`. Kies later een concreet model:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configuratievoorbeeld

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Modelverwijzingen

<Note>
Modelverwijzingen volgen het patroon `openrouter/<provider>/<model>`. Zie voor de volledige lijst met
beschikbare providers en modellen [/concepts/model-providers](/nl/concepts/model-providers).
</Note>

Meegeleverde fallbackvoorbeelden:

| Modelverwijzing                  | Opmerkingen                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische routering van OpenRouter |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion-router     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

## Afbeeldingen genereren

OpenRouter kan ook de `image_generate`-tool ondersteunen. Gebruik een OpenRouter-afbeeldingsmodel onder `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw stuurt afbeeldingsverzoeken naar de image-API voor chat completions van OpenRouter met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouters `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de parameter `timeoutMs` per aanroep van de `image_generate`-tool heeft nog steeds voorrang.

## Video genereren

OpenRouter kan ook de `video_generate`-tool ondersteunen via zijn asynchrone `/videos`-API. Gebruik een OpenRouter-videomodel onder `agents.defaults.videoGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw dient tekst-naar-video- en afbeelding-naar-video-taken in bij OpenRouter, pollt
de geretourneerde `polling_url` en downloadt de voltooide video via
OpenRouters `unsigned_urls` of het gedocumenteerde endpoint voor taakinhoud.
Referentieafbeeldingen worden standaard verzonden als eerste-/laatste-frameafbeeldingen; afbeeldingen
met de tag `reference_image` worden verzonden als invoerreferenties voor OpenRouter. De
meegeleverde standaard `google/veo-3.1-fast` adverteert de momenteel ondersteunde duur van 4/6/8
seconden, resoluties `720P`/`1080P` en beeldverhoudingen `16:9`/`9:16`.
Video-naar-video is niet geregistreerd voor OpenRouter, omdat de upstream
API voor videogeneratie momenteel tekst- en afbeeldingsreferenties accepteert.

## Muziek genereren

OpenRouter kan ook de `music_generate`-tool ondersteunen via audio-uitvoer van chat completions.
Gebruik een OpenRouter-audiomodel onder
`agents.defaults.musicGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

De meegeleverde OpenRouter-muziekprovider gebruikt standaard
`google/lyria-3-pro-preview` en biedt ook
`google/lyria-3-clip-preview` aan. OpenClaw stuurt `modalities: ["text",
"audio"]`, schakelt streaming in, verzamelt de gestreamde audiochunks en slaat
het resultaat op als gegenereerde media voor kanaalbezorging. Referentieafbeeldingen worden
geaccepteerd voor Lyria-modellen via de gedeelde parameter `music_generate image=...`.

## Tekst-naar-spraak

OpenRouter kan ook worden gebruikt als TTS-provider via zijn OpenAI-compatibele
`/audio/speech`-endpoint.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Als `messages.tts.providers.openrouter.apiKey` wordt weggelaten, hergebruikt TTS
`models.providers.openrouter.apiKey`, en daarna `OPENROUTER_API_KEY`.

## Spraak-naar-tekst (inkomende audio)

OpenRouter kan inkomende spraak-/audiobijlagen transcriberen via het gedeelde
pad `tools.media.audio` met zijn STT-endpoint (`/audio/transcriptions`).
Dit geldt voor elke kanaal-Plugin die inkomende spraak/audio doorstuurt naar
de preflight voor mediabegrip.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw stuurt OpenRouter STT-verzoeken als JSON met base64-audio onder
`input_audio` (OpenRouter STT-contract), niet als multipart OpenAI-formulieruploads.

## Fusion-router

Gebruik OpenRouter Fusion wanneer je wilt dat één OpenClaw-modelverwijzing meerdere
OpenRouter-modellen parallel bevraagt, OpenRouter hun antwoorden laat beoordelen en een
enkele uiteindelijke reactie via het normale endpoint van de OpenRouter-provider retourneert. Omdat
de upstream model-slug `openrouter/fusion` is, bevat de OpenClaw-modelverwijzing
zowel het OpenClaw-providerprefix als de upstream OpenRouter-namespace:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configureer het paneel en de beoordelaar van Fusion via `params.extraBody` van het model. Die
velden worden doorgestuurd naar de requestbody voor OpenRouter chat completions. Fusion
werkt met OpenRouter OAuth-onboarding of onboarding met API-sleutel; als je
OAuth gebruikt, laat dan de regel `env.OPENROUTER_API_KEY` weg uit het voorbeeld hieronder.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

De lijst `analysis_models` is het parallelle paneel, en `model` binnen de Fusion
plugin-configuratie is het beoordelingsmodel. Stel `tool_choice` op het hoogste niveau niet in op
`"required"` in normale OpenClaw-agent-/chatbeurten om Fusion te forceren;
OpenClaw-beurten kunnen OpenClaw-tooldefinities bevatten, en een verplichte
toolkeuze op het hoogste niveau kan een van die tools vereisen in plaats van de Fusion-router. Wanneer
deze Fusion plugin-configuratie aanwezig is, voegt OpenClaw ook een opgeschoonde
systeempromptnotitie toe met de geconfigureerde analysemodellen en het beoordelingsmodel, zodat de
agent vragen kan beantwoorden over zijn huidige Fusion-paneel. Andere `extraBody`-
velden worden niet naar de prompt gekopieerd.

Fusion is opzettelijk trager. OpenRouter kan dezelfde OpenClaw-prompt naar
meerdere analysemodellen sturen en daarna een laatste beoordelings-/synthesestap uitvoeren, waardoor de latentie
meestal hoger is dan bij een direct verzoek aan één model. Gebruik Fusion voor weloverwogen,
hoogwaardige antwoorden of escalatiepaden, niet als standaard voor
latentiegevoelige chat. Houd het paneel klein en kies snellere analyse- en beoordelingsmodellen voor snellere reacties.

Test de geconfigureerde verwijzing met een eenmalige lokale modelaanroep:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authenticatie en headers

OpenRouter gebruikt onderliggend een Bearer-token met je API-sleutel. OpenRouter
OAuth is een PKCE-loginflow die een OpenRouter-API-sleutel uitgeeft, dus OpenClaw slaat
het resultaat op als hetzelfde `openrouter:default` API-sleutel-authprofiel dat wordt gebruikt door het
handmatige installatiepad met API-sleutel.

Meld je voor een bestaande installatie aan of roteer de opgeslagen OpenRouter-sleutel zonder
de volledige onboarding opnieuw uit te voeren:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Gebruik `openclaw models auth login --provider openrouter --method api-key` wanneer
je een sleutel wilt plakken die je handmatig bij OpenRouter hebt aangemaakt.

Bij echte OpenRouter-verzoeken (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouters gedocumenteerde app-attributieheaders toe:

| Header                    | Waarde                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Als je de OpenRouter-provider naar een andere proxy of basis-URL laat wijzen, injecteert OpenClaw
die OpenRouter-specifieke headers of Anthropic-cachemarkeringen **niet**.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Response caching">
    OpenRouter-responscaching is opt-in. Schakel dit per OpenRouter-model in met
    modelparameters:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw stuurt `X-OpenRouter-Cache: true` en, wanneer geconfigureerd,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` forceert een refresh voor
    het huidige verzoek en slaat de vervangende reactie op. Snake_case-aliassen
    (`response_cache`, `response_cache_ttl_seconds` en
    `response_cache_clear`) worden ook geaccepteerd.

    Dit staat los van promptcaching van de provider en van OpenRouters
    Anthropic `cache_control`-markeringen. Het wordt alleen toegepast op geverifieerde
    `openrouter.ai`-routes, niet op aangepaste proxy-basis-URL's.

  </Accordion>

  <Accordion title="Anthropic cache markers">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de
    OpenRouter-specifieke Anthropic `cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van de promptcache op systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Op geverifieerde OpenRouter-routes laten Anthropic-modelreferenties met reasoning ingeschakeld
    afsluitende assistant-prefill-beurten vallen voordat de aanvraag OpenRouter bereikt,
    in overeenstemming met Anthropic's vereiste dat reasoning-gesprekken eindigen met een
    gebruikersbeurt.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde thinking-niveau aan
    OpenRouter-proxyreasoning-payloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die reasoning-injectie over. Hunter Alpha slaat ook
    proxyreasoning over voor verouderde geconfigureerde modelreferenties, omdat OpenRouter
    definitieve antwoordtekst in reasoning-velden kon retourneren voor die uitgefaseerde route.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` aan bij
    opnieuw afgespeelde assistant-beurten, zodat denk-/hulpmiddelgesprekken de vereiste
    vervolgstructuur van DeepSeek V4 behouden. OpenClaw stuurt door OpenRouter ondersteunde
    `reasoning_effort`-waarden voor deze routes; `xhigh` is het hoogst geadverteerde
    niveau, en verouderde `max`-overrides worden aan `xhigh` gekoppeld.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native aanvraagstructurering die alleen voor OpenAI geldt, zoals `serviceTier`, Responses `store`,
    OpenAI-reasoning-compat-payloads en prompt-cache-hints, wordt niet doorgestuurd.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Door Gemini ondersteunde OpenRouter-referenties blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar de opschoning van Gemini-denkhandtekeningen, maar schakelt geen native Gemini-
    replayvalidatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Provider routing metadata">
    OpenRouter ondersteunt een `provider`-aanvraagobject voor routering naar de onderliggende provider.
    Configureer een standaardbeleid voor alle OpenRouter-tekstmodelaanvragen
    met `models.providers.openrouter.params.provider`:

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw stuurt dat object door naar OpenRouter als de aanvraag-`provider`-
    payload. Gebruik de door OpenRouter gedocumenteerde snake_case-velden, waaronder `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` en `enforce_distillable_text`.

    Parameters per model overschrijven nog steeds het providerbrede routeringsobject:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Dit geldt alleen voor OpenRouter-chat-completions-routes. Directe Anthropic-,
    Google-, OpenAI- of aangepaste providerroutes negeren OpenRouter-routeringsparameters.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
