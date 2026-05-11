---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter uitvoeren in OpenClaw
    - Je wilt OpenRouter gebruiken voor beeldgeneratie
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-11T20:47:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die verzoeken naar veel modellen achter één
eindpunt en één API-sleutel routeert. De API is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

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

Meegeleverde fallbackvoorbeelden:

| Modelreferentie                 | Opmerkingen                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische routering van OpenRouter |
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

OpenClaw stuurt afbeeldingsverzoeken naar OpenRouter's chat-completions-afbeeldings-API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouter's `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de per-call-parameter `timeoutMs` van de `image_generate`-tool heeft nog steeds voorrang.

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
de geretourneerde `polling_url` en downloadt de voltooide video van
OpenRouter's `unsigned_urls` of het gedocumenteerde eindpunt voor taakinhoud.
Referentieafbeeldingen worden standaard als eerste/laatste-frame-afbeeldingen verzonden; afbeeldingen
met de tag `reference_image` worden als OpenRouter-invoerreferenties verzonden. De
meegeleverde standaard `google/veo-3.1-fast` adverteert de momenteel ondersteunde duurwaarden van 4/6/8
seconden, resoluties `720P`/`1080P` en beeldverhoudingen `16:9`/`9:16`.
Video-naar-video is niet geregistreerd voor OpenRouter, omdat de upstream
videogeneratie-API momenteel tekst- en afbeeldingsreferenties accepteert.

## Tekst-naar-spraak

OpenRouter kan ook als TTS-provider worden gebruikt via zijn OpenAI-compatibele
`/audio/speech`-eindpunt.

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

Als `messages.tts.providers.openrouter.apiKey` wordt weggelaten, gebruikt TTS opnieuw
`models.providers.openrouter.apiKey` en daarna `OPENROUTER_API_KEY`.

## Authenticatie en headers

OpenRouter gebruikt onder de motorkap een Bearer-token met je API-sleutel.

Bij echte OpenRouter-verzoeken (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouter's gedocumenteerde headers voor app-attributie toe:

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

    OpenClaw stuurt `X-OpenRouter-Cache: true` en, indien geconfigureerd,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` forceert een vernieuwing voor
    het huidige verzoek en slaat het vervangende antwoord op. Snake_case-aliassen
    (`response_cache`, `response_cache_ttl_seconds` en
    `response_cache_clear`) worden ook geaccepteerd.

    Dit staat los van promptcaching van de provider en van OpenRouter's
    Anthropic-`cache_control`-markeringen. Het wordt alleen toegepast op geverifieerde
    `openrouter.ai`-routes, niet op aangepaste proxy-basis-URL's.

  </Accordion>

  <Accordion title="Anthropic-cachemarkeringen">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelreferenties de
    OpenRouter-specifieke Anthropic-`cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van promptcaches op systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic-redeneerprefill">
    Op geverifieerde OpenRouter-routes laten Anthropic-modelreferenties met ingeschakeld redeneren
    afsluitende assistant-prefill-beurten weg voordat het verzoek OpenRouter bereikt,
    conform Anthropic's vereiste dat redeneergesprekken eindigen met een gebruikersbeurt.
  </Accordion>

  <Accordion title="Injectie van denken/redeneren">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde denkniveau aan
    OpenRouter-proxyredeneerpayloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die redeneerinjectie over. Hunter Alpha slaat ook
    proxyredeneren over voor verouderde geconfigureerde modelreferenties, omdat OpenRouter
    uiteindelijke antwoordtekst in redeneervelden kon retourneren voor die uitgefaseerde route.
  </Accordion>

  <Accordion title="DeepSeek V4-redeneerreplay">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` aan op
    opnieuw afgespeelde assistant-beurten, zodat denk-/toolgesprekken de door DeepSeek V4
    vereiste vervolgvorm behouden. OpenClaw stuurt door OpenRouter ondersteunde
    `reasoning_effort`-waarden voor deze routes; `xhigh` is het hoogst geadverteerde
    niveau, en verouderde `max`-overrides worden naar `xhigh` gemapt.
  </Accordion>

  <Accordion title="Alleen-OpenAI-aanvraagvorming">
    OpenRouter loopt nog steeds via het proxyachtige OpenAI-compatibele pad, dus
    native alleen-OpenAI-aanvraagvorming zoals `serviceTier`, Responses `store`,
    OpenAI-redeneercompatibele payloads en promptcachehints worden niet doorgestuurd.
  </Accordion>

  <Accordion title="Door Gemini ondersteunde routes">
    Door Gemini ondersteunde OpenRouter-referenties blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini-thought-signature-opschoning, maar schakelt geen native Gemini
    replayvalidatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Metadata voor providerrouting">
    Als je OpenRouter-providerrouting onder modelparameters doorgeeft, stuurt OpenClaw
    die door als OpenRouter-routeringsmetadata voordat de gedeelde streamwrappers worden uitgevoerd.
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
