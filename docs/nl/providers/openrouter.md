---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter uitvoeren in OpenClaw
    - Je wilt OpenRouter gebruiken voor het genereren van afbeeldingen
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T07:08:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die verzoeken naar veel modellen routeert achter één
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

## Modelverwijzingen

<Note>
Modelverwijzingen volgen het patroon `openrouter/<provider>/<model>`. Zie [/concepts/model-providers](/nl/concepts/model-providers) voor de volledige lijst met
beschikbare providers en modellen.
</Note>

Gebundelde fallback-voorbeelden:

| Modelverwijzing                 | Opmerkingen                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische routering van OpenRouter |
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

OpenClaw stuurt afbeeldingsverzoeken naar OpenRouter's chat completions image API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouter's `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de parameter `timeoutMs` per aanroep van de tool `image_generate` heeft nog steeds voorrang.

## Video genereren

OpenRouter kan ook de tool `video_generate` ondersteunen via zijn asynchrone `/videos`-API. Gebruik een OpenRouter-videomodel onder `agents.defaults.videoGenerationModel`:

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
OpenRouter's `unsigned_urls` of het gedocumenteerde endpoint voor taakinhoud.
Referentieafbeeldingen worden standaard verzonden als eerste-/laatste-frame-afbeeldingen; afbeeldingen
die zijn getagd met `reference_image` worden verzonden als OpenRouter-invoerreferenties. De
gebundelde standaard `google/veo-3.1-fast` adverteert de momenteel ondersteunde duurwaarden van 4/6/8
seconden, `720P`/`1080P`-resoluties en `16:9`/`9:16`-beeldverhoudingen. Video-naar-video is niet geregistreerd voor OpenRouter, omdat de upstream
API voor videogeneratie momenteel tekst- en afbeeldingsreferenties accepteert.

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

## Authenticatie en headers

OpenRouter gebruikt onder de motorkap een Bearer-token met je API-sleutel.

Bij echte OpenRouter-verzoeken (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouter's gedocumenteerde app-attributieheaders toe:

| Header                    | Waarde                                                                                                 |
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
  <Accordion title="Respons-caching">
    OpenRouter-respons-caching is opt-in. Schakel dit per OpenRouter-model in met
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
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` forceert een vernieuwing voor
    het huidige verzoek en slaat de vervangende respons op. Snake_case-aliassen
    (`response_cache`, `response_cache_ttl_seconds` en
    `response_cache_clear`) worden ook geaccepteerd.

    Dit staat los van prompt-caching van providers en van OpenRouter's
    Anthropic-`cache_control`-markeringen. Het wordt alleen toegepast op geverifieerde
    `openrouter.ai`-routes, niet op aangepaste proxy-basis-URL's.

  </Accordion>

  <Accordion title="Anthropic-cachemarkeringen">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de
    OpenRouter-specifieke Anthropic-`cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van prompt-caches op systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic-redeneervoorinvulling">
    Op geverifieerde OpenRouter-routes verwijderen Anthropic-modelverwijzingen met redeneren ingeschakeld
    afsluitende assistant-prefill-beurten voordat het verzoek OpenRouter bereikt,
    in overeenstemming met Anthropic's vereiste dat redeneergesprekken eindigen met een gebruikersbeurt.
  </Accordion>

  <Accordion title="Denk-/redeneerinjectie">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde denkniveau aan
    OpenRouter-proxyredeneerpayloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die redeneerinjectie over. Hunter Alpha slaat ook
    proxyredeneren over voor verouderde geconfigureerde modelverwijzingen, omdat OpenRouter
    definitieve antwoordtekst in redeneervelden kon retourneren voor die uitgefaseerde route.
  </Accordion>

  <Accordion title="DeepSeek V4-redeneerreplay">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` in op
    opnieuw afgespeelde assistant-beurten, zodat denk-/toolgesprekken DeepSeek V4's
    vereiste opvolgvorm behouden.
  </Accordion>

  <Accordion title="OpenAI-only verzoekvorming">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native OpenAI-only verzoekvorming zoals `serviceTier`, Responses `store`,
    OpenAI-redeneercompatibiliteitspayloads en prompt-cachehints worden niet doorgestuurd.
  </Accordion>

  <Accordion title="Door Gemini ondersteunde routes">
    Door Gemini ondersteunde OpenRouter-verwijzingen blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini-thought-signature-sanitatie, maar schakelt geen native Gemini
    replayvalidatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Routeringsmetadata van providers">
    Als je OpenRouter-providerroutering onder modelparameters doorgeeft, stuurt OpenClaw
    die door als OpenRouter-routeringsmetadata voordat de gedeelde streamwrappers worden uitgevoerd.
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
