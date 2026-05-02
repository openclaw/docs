---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter uitvoeren in OpenClaw
    - Je wilt OpenRouter gebruiken voor beeldgeneratie
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T11:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die aanvragen naar veel modellen achter één
eindpunt en API-sleutel routeert. Deze is OpenAI-compatibel, dus de meeste OpenAI SDK's werken door de basis-URL te wijzigen.

## Aan de slag

<Steps>
  <Step title="Get your API key">
    Maak een API-sleutel aan op [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
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
Modelverwijzingen volgen het patroon `openrouter/<provider>/<model>`. Zie [/concepts/model-providers](/nl/concepts/model-providers) voor de volledige lijst met
beschikbare providers en modellen.
</Note>

Meegeleverde fallbackvoorbeelden:

| Modelverwijzing                  | Opmerkingen                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische OpenRouter-routering |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |

## Afbeeldingen genereren

OpenRouter kan ook de tool `image_generate` ondersteunen. Gebruik een OpenRouter-afbeeldingsmodel onder `agents.defaults.imageGenerationModel`:

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

OpenClaw stuurt afbeeldingsaanvragen naar OpenRouters chat-completions-afbeeldings-API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouters `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de parameter `timeoutMs` per aanroep van de tool `image_generate` heeft nog steeds voorrang.

## Video genereren

OpenRouter kan ook de tool `video_generate` ondersteunen via de asynchrone `/videos`-API. Gebruik een OpenRouter-videomodel onder `agents.defaults.videoGenerationModel`:

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

OpenClaw dient tekst-naar-video- en afbeelding-naar-video-taken in bij OpenRouter, polt
de geretourneerde `polling_url` en downloadt de voltooide video vanaf
OpenRouters `unsigned_urls` of het gedocumenteerde inhoudseindpunt van de taak.
Referentieafbeeldingen worden standaard verzonden als afbeeldingen voor het eerste/laatste frame; afbeeldingen
met de tag `reference_image` worden verzonden als OpenRouter-invoerreferenties. De
meegeleverde standaard `google/veo-3.1-fast` vermeldt de momenteel ondersteunde duur van 4/6/8
seconden, resoluties `720P`/`1080P` en beeldverhoudingen `16:9`/`9:16`.
Video-naar-video is niet geregistreerd voor OpenRouter omdat de upstream-API
voor videogeneratie momenteel tekst- en afbeeldingsreferenties accepteert.

## Tekst-naar-spraak

OpenRouter kan ook worden gebruikt als TTS-provider via het OpenAI-compatibele
eindpunt `/audio/speech`.

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

OpenRouter gebruikt onder water een Bearer-token met je API-sleutel.

Bij echte OpenRouter-aanvragen (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouters gedocumenteerde app-attributieheaders toe:

| Header                    | Waarde                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Als je de OpenRouter-provider naar een andere proxy of basis-URL laat verwijzen, injecteert OpenClaw
die OpenRouter-specifieke headers of Anthropic-cachemarkeringen **niet**.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de
    OpenRouter-specifieke Anthropic-`cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van de promptcache op systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    Op geverifieerde OpenRouter-routes verwijderen Anthropic-modelverwijzingen met ingeschakelde reasoning
    afsluitende assistant-prefill-beurten voordat de aanvraag OpenRouter bereikt,
    in overeenstemming met Anthropics vereiste dat reasoning-gesprekken eindigen met een
    gebruikersbeurt.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde denkniveau aan
    OpenRouter-proxy-reasoning-payloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die reasoning-injectie over. Hunter Alpha slaat ook
    proxy-reasoning over voor verouderde geconfigureerde modelverwijzingen omdat OpenRouter
    definitieve antwoordtekst kon retourneren in reasoning-velden voor die uitgefaseerde route.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` aan op
    opnieuw afgespeelde assistant-beurten, zodat denk-/toolgesprekken de door DeepSeek V4
    vereiste opvolgvorm behouden.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native aanvraagvorming die alleen voor OpenAI geldt, zoals `serviceTier`, Responses `store`,
    OpenAI-reasoning-compat-payloads en promptcache-hints, wordt niet doorgestuurd.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Door Gemini ondersteunde OpenRouter-verwijzingen blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini-thought-signature-opschoning, maar schakelt geen native Gemini-
    replayvalidatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Als je OpenRouter-providerroutering doorgeeft onder modelparameters, stuurt OpenClaw
    die door als OpenRouter-routeringsmetadata voordat de gedeelde stream-wrappers worden uitgevoerd.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
