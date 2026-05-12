---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter in OpenClaw uitvoeren
    - Je wilt OpenRouter gebruiken voor het genereren van afbeeldingen
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die aanvragen naar veel modellen achter één
eindpunt en API-sleutel routeert. Deze is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

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

## Modelverwijzingen

<Note>
Modelverwijzingen volgen het patroon `openrouter/<provider>/<model>`. Zie voor de volledige lijst met
beschikbare providers en modellen [/concepts/model-providers](/nl/concepts/model-providers).
</Note>

Meegeleverde fallback-voorbeelden:

| Modelverwijzing                  | Opmerkingen                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische routering van OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

## Afbeeldingsgeneratie

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

OpenClaw stuurt afbeeldingsaanvragen naar OpenRouter's chat-completions-afbeeldings-API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde `aspectRatio`- en `resolution`-hints via OpenRouter's `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de per-call-parameter `timeoutMs` van de `image_generate`-tool heeft nog steeds voorrang.

## Videogeneratie

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
de geretourneerde `polling_url` en downloadt de voltooide video uit
OpenRouter's `unsigned_urls` of het gedocumenteerde eindpunt voor taakinhoud.
Referentieafbeeldingen worden standaard als eerste-/laatste-frame-afbeeldingen verzonden; afbeeldingen
met de tag `reference_image` worden als OpenRouter-invoerreferenties verzonden. De
meegeleverde standaard `google/veo-3.1-fast` adverteert de momenteel ondersteunde duurwaarden van 4/6/8
seconden, `720P`/`1080P`-resoluties en `16:9`/`9:16`-beeldverhoudingen.
Video-naar-video is niet geregistreerd voor OpenRouter omdat de upstream
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

Als `messages.tts.providers.openrouter.apiKey` is weggelaten, hergebruikt TTS
`models.providers.openrouter.apiKey` en daarna `OPENROUTER_API_KEY`.

## Spraak-naar-tekst (inkomende audio)

OpenRouter kan inkomende spraak-/audiobijlagen transcriberen via het gedeelde
`tools.media.audio`-pad met zijn STT-eindpunt (`/audio/transcriptions`).
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

OpenClaw verstuurt OpenRouter-STT-aanvragen als JSON met base64-audio onder
`input_audio` (OpenRouter-STT-contract), niet als multipart OpenAI-formulieruploads.

## Authenticatie en headers

OpenRouter gebruikt onder water een Bearer-token met je API-sleutel.

Bij echte OpenRouter-aanvragen (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouter's gedocumenteerde app-attributieheaders toe:

| Header                    | Waarde                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Als je de OpenRouter-provider naar een andere proxy of basis-URL laat verwijzen, injecteert OpenClaw
die OpenRouter-specifieke headers of Anthropic-cachemarkeringen **niet**.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Response-caching">
    OpenRouter-response-caching is opt-in. Schakel dit per OpenRouter-model in met
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

    OpenClaw verstuurt `X-OpenRouter-Cache: true` en, wanneer geconfigureerd,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` forceert een vernieuwing voor
    de huidige aanvraag en slaat de vervangende response op. Snake_case-aliassen
    (`response_cache`, `response_cache_ttl_seconds` en
    `response_cache_clear`) worden ook geaccepteerd.

    Dit staat los van provider-prompt-caching en van OpenRouter's
    Anthropic `cache_control`-markeringen. Het wordt alleen toegepast op geverifieerde
    `openrouter.ai`-routes, niet op aangepaste proxy-basis-URL's.

  </Accordion>

  <Accordion title="Anthropic-cachemarkeringen">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de
    OpenRouter-specifieke Anthropic `cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van prompt-cache voor systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic reasoning-prefill">
    Op geverifieerde OpenRouter-routes verwijderen Anthropic-modelverwijzingen met reasoning ingeschakeld
    afsluitende assistant-prefill-beurten voordat de aanvraag OpenRouter bereikt,
    conform Anthropic's vereiste dat reasoning-gesprekken eindigen met een
    gebruikersbeurt.
  </Accordion>

  <Accordion title="Thinking-/reasoning-injectie">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde thinking-niveau aan
    OpenRouter-proxy-reasoning-payloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die reasoning-injectie over. Hunter Alpha slaat ook
    proxy-reasoning over voor verouderde geconfigureerde modelverwijzingen omdat OpenRouter
    voor die uitgefaseerde route definitieve antwoordtekst in reasoning-velden kon retourneren.
  </Accordion>

  <Accordion title="DeepSeek V4-reasoning-replay">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` in op
    opnieuw afgespeelde assistant-beurten, zodat thinking-/toolgesprekken de
    vereiste opvolgingsvorm van DeepSeek V4 behouden. OpenClaw verstuurt door OpenRouter ondersteunde
    `reasoning_effort`-waarden voor deze routes; `xhigh` is het hoogst geadverteerde
    niveau en verouderde `max`-overrides worden naar `xhigh` gemapt.
  </Accordion>

  <Accordion title="Request shaping alleen voor OpenAI">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native OpenAI-only request shaping zoals `serviceTier`, Responses `store`,
    OpenAI-reasoning-compat-payloads en prompt-cache-hints wordt niet doorgestuurd.
  </Accordion>

  <Accordion title="Gemini-ondersteunde routes">
    Door Gemini ondersteunde OpenRouter-verwijzingen blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini-thought-signature-opschoning, maar schakelt geen native Gemini
    replay-validatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Provider-routeringsmetadata">
    Als je OpenRouter-provider-routering doorgeeft onder modelparameters, stuurt OpenClaw
    die door als OpenRouter-routeringsmetadata voordat de gedeelde stream-wrappers draaien.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
