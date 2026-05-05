---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter uitvoeren in OpenClaw
    - Je wilt OpenRouter gebruiken voor het genereren van afbeeldingen
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die aanvragen routeert naar veel modellen achter één
endpoint en API-sleutel. Deze is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

## Aan de slag

<Steps>
  <Step title="Haal je API-sleutel op">
    Maak een API-sleutel aan op [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optioneel) Schakel over naar een specifiek model">
    Onboarding gebruikt standaard `openrouter/auto`. Kies later een concreet model:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

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

## Modelreferenties

<Note>
Modelreferenties volgen het patroon `openrouter/<provider>/<model>`. Zie [/concepts/model-providers](/nl/concepts/model-providers) voor de volledige lijst met
beschikbare providers en modellen.
</Note>

Voorbeelden van meegeleverde fallbacks:

| Modelreferentie                 | Opmerkingen                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische OpenRouter-routering |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |

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

OpenClaw stuurt afbeeldingsaanvragen naar OpenRouters chat-completions-afbeeldings-API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouters `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de parameter `timeoutMs` per aanroep van de `image_generate`-tool heeft nog steeds voorrang.

## Video's genereren

OpenRouter kan ook de `video_generate`-tool ondersteunen via de asynchrone `/videos`-API. Gebruik een OpenRouter-videomodel onder `agents.defaults.videoGenerationModel`:

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
Referentieafbeeldingen worden standaard verzonden als afbeeldingen voor het eerste/laatste frame; afbeeldingen
met de tag `reference_image` worden verzonden als OpenRouter-invoerreferenties. De
meegeleverde standaard `google/veo-3.1-fast` vermeldt de momenteel ondersteunde duur van 4/6/8
seconden, resoluties `720P`/`1080P` en beeldverhoudingen `16:9`/`9:16`.
Video-naar-video is niet geregistreerd voor OpenRouter, omdat de upstream
API voor videogeneratie momenteel tekst- en afbeeldingsreferenties accepteert.

## Tekst-naar-spraak

OpenRouter kan ook worden gebruikt als TTS-provider via het OpenAI-compatibele
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
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Als `messages.tts.providers.openrouter.apiKey` wordt weggelaten, hergebruikt TTS
`models.providers.openrouter.apiKey` en daarna `OPENROUTER_API_KEY`.

## Authenticatie en headers

OpenRouter gebruikt onder de motorkap een Bearer-token met je API-sleutel.

Bij echte OpenRouter-aanvragen (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouters gedocumenteerde app-toewijzingsheaders toe:

| Header                    | Waarde                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Als je de OpenRouter-provider naar een andere proxy of basis-URL verwijst, injecteert OpenClaw
die OpenRouter-specifieke headers of Anthropic-cachemarkeringen **niet**.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Responscaching">
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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` dwingt een vernieuwing af voor
    de huidige aanvraag en slaat de vervangende respons op. Snake_case-aliassen
    (`response_cache`, `response_cache_ttl_seconds` en
    `response_cache_clear`) worden ook geaccepteerd.

    Dit staat los van promptcaching van providers en van OpenRouters
    Anthropic-`cache_control`-markeringen. Het wordt alleen toegepast op geverifieerde
    `openrouter.ai`-routes, niet op aangepaste proxy-basis-URL's.

  </Accordion>

  <Accordion title="Anthropic-cachemarkeringen">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelreferenties de
    OpenRouter-specifieke Anthropic-`cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van de promptcache op promptblokken voor systeem/ontwikkelaar.
  </Accordion>

  <Accordion title="Anthropic-redeneerprefill">
    Op geverifieerde OpenRouter-routes verwijderen Anthropic-modelreferenties waarvoor redeneren is ingeschakeld
    afsluitende assistant-prefill-beurten voordat de aanvraag OpenRouter bereikt,
    in overeenstemming met Anthropics vereiste dat redeneergesprekken eindigen met een gebruikersbeurt.
  </Accordion>

  <Accordion title="Injectie van denken / redeneren">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde denkniveau aan
    OpenRouter-proxy-redeneerpayloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die redeneerinjectie over. Hunter Alpha slaat ook
    proxyredeneren over voor verouderde geconfigureerde modelreferenties, omdat OpenRouter
    definitieve antwoordtekst in redeneervelden kon retourneren voor die ingetrokken route.
  </Accordion>

  <Accordion title="DeepSeek V4-redeneerreplay">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` in op
    opnieuw afgespeelde assistant-beurten, zodat denk-/toolgesprekken de vereiste
    vervolgvorm van DeepSeek V4 behouden. OpenClaw stuurt door OpenRouter ondersteunde
    `reasoning_effort`-waarden voor deze routes; `xhigh` is het hoogst geadverteerde
    niveau en verouderde `max`-overrides worden toegewezen aan `xhigh`.
  </Accordion>

  <Accordion title="Alleen-OpenAI-aanvraagvorming">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native alleen-OpenAI-aanvraagvorming zoals `serviceTier`, Responses `store`,
    OpenAI-redeneercompatibele payloads en promptcachehints worden niet doorgestuurd.
  </Accordion>

  <Accordion title="Door Gemini ondersteunde routes">
    Door Gemini ondersteunde OpenRouter-referenties blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini-gedachtesignatuur-opschoning, maar schakelt geen native Gemini
    replayvalidatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Routeringsmetadata van providers">
    Als je OpenRouter-providerroutering doorgeeft onder modelparameters, stuurt OpenClaw
    deze door als OpenRouter-routeringsmetadata voordat de gedeelde streamwrappers worden uitgevoerd.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
