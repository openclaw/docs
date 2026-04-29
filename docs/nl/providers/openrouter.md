---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter in OpenClaw uitvoeren
    - Je wilt OpenRouter gebruiken voor beeldgeneratie
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-29T23:12:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die verzoeken naar veel modellen routeert achter één
eindpunt en API-sleutel. Het is OpenAI-compatibel, waardoor de meeste OpenAI SDK's werken door de basis-URL te wijzigen.

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

Meegeleverde fallback-voorbeelden:

| Modelverwijzing                  | Opmerkingen                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische routing van OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |

## Afbeeldingen genereren

OpenRouter kan ook het hulpprogramma `image_generate` ondersteunen. Gebruik een OpenRouter-afbeeldingsmodel onder `agents.defaults.imageGenerationModel`:

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

OpenClaw stuurt afbeeldingsverzoeken naar OpenRouter's chat-completions-afbeeldings-API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouter's `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de parameter `timeoutMs` per aanroep van het hulpprogramma `image_generate` heeft nog steeds voorrang.

## Video genereren

OpenRouter kan ook het hulpprogramma `video_generate` ondersteunen via zijn asynchrone `/videos`-API. Gebruik een OpenRouter-videomodel onder `agents.defaults.videoGenerationModel`:

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
OpenRouter's `unsigned_urls` of het gedocumenteerde inhoudseindpunt voor taken.
Referentieafbeeldingen worden standaard als eerste/laatste frame-afbeeldingen verzonden; afbeeldingen
met de tag `reference_image` worden verzonden als OpenRouter-invoerreferenties. De
meegeleverde standaard `google/veo-3.1-fast` adverteert de momenteel ondersteunde duren van 4/6/8
seconden, `720P`/`1080P`-resoluties en `16:9`/`9:16`-beeldverhoudingen. Video-naar-video is niet geregistreerd voor OpenRouter omdat de upstream
API voor videogeneratie momenteel tekst- en afbeeldingsreferenties accepteert.

## Tekst-naar-spraak

OpenRouter kan ook worden gebruikt als TTS-provider via zijn OpenAI-compatibele
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

Als `messages.tts.providers.openrouter.apiKey` wordt weggelaten, hergebruikt TTS
`models.providers.openrouter.apiKey`, en daarna `OPENROUTER_API_KEY`.

## Authenticatie en headers

OpenRouter gebruikt onder de motorkap een Bearer-token met je API-sleutel.

Bij echte OpenRouter-verzoeken (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouter's gedocumenteerde app-toeschrijvingsheaders toe:

| Header                    | Waarde                |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Als je de OpenRouter-provider naar een andere proxy of basis-URL verwijst, injecteert OpenClaw
deze OpenRouter-specifieke headers of Anthropic-cachemarkeringen **niet**.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de
    OpenRouter-specifieke Anthropic `cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van de prompt-cache op systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde denkniveau aan
    reasoning-payloads van de OpenRouter-proxy. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die reasoning-injectie over. Hunter Alpha slaat ook
    proxy-reasoning over voor verouderde geconfigureerde modelverwijzingen, omdat OpenRouter
    definitieve antwoordtekst in reasoning-velden kon retourneren voor die ingetrokken route.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native OpenAI-only verzoekvormgeving zoals `serviceTier`, Responses `store`,
    OpenAI reasoning-compat-payloads en prompt-cachehints worden niet doorgestuurd.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Door Gemini ondersteunde OpenRouter-verwijzingen blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini thought-signature-sanering, maar schakelt geen native Gemini
    replay-validatie of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Als je OpenRouter-provider-routing doorgeeft onder modelparameters, stuurt OpenClaw
    dit door als OpenRouter-routingmetadata voordat de gedeelde stream-wrappers worden uitgevoerd.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failover-gedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
