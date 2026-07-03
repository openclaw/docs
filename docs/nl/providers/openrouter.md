---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter in OpenClaw uitvoeren
    - Je wilt OpenRouter gebruiken voor beeldgeneratie
    - Je wilt OpenRouter gebruiken voor het genereren van muziek
    - Je wilt OpenRouter gebruiken voor videogeneratie
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:46:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter biedt een **uniforme API** die verzoeken naar veel modellen achter één
eindpunt en API-sleutel routeert. Het is OpenAI-compatibel, zodat de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

## Aan de slag

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Voer OAuth-aanmelding uit">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw opent OpenRouter's browseraanmeldingsstroom, wisselt de PKCE-
        code in voor een OpenRouter API-sleutel en slaat die sleutel op in het standaard
        OpenRouter-auth-profiel. Op externe/headless hosts drukt OpenClaw de
        aanmeldings-URL af en vraagt het je de omleidings-URL te plakken na het aanmelden.
      </Step>
      <Step title="(Optioneel) Schakel over naar een specifiek model">
        De aanmelding gebruikt standaard `openrouter/auto`. Kies later een concreet model:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API-sleutel">
    <Steps>
      <Step title="Haal je API-sleutel op">
        Maak een API-sleutel aan op [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Voer aanmelding met API-sleutel uit">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optioneel) Schakel over naar een specifiek model">
        De aanmelding gebruikt standaard `openrouter/auto`. Kies later een concreet model:

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

Meegeleverde terugvalvoorbeelden:

| Modelverwijzing                 | Opmerkingen                  |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatische routering van OpenRouter |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion-router     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI     |

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

OpenClaw stuurt afbeeldingsverzoeken naar OpenRouter's chat-completions-afbeeldings-API met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen ondersteunde hints voor `aspectRatio` en `resolution` via OpenRouter's `image_config`. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere OpenRouter-afbeeldingsmodellen; de parameter `timeoutMs` per aanroep van de tool `image_generate` heeft nog steeds voorrang.

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
de geretourneerde `polling_url` en downloadt de voltooide video uit
OpenRouter's `unsigned_urls` of het gedocumenteerde eindpunt voor taakinhoud.
Referentieafbeeldingen worden standaard als eerste/laatste frame-afbeeldingen verzonden; afbeeldingen
met de tag `reference_image` worden als OpenRouter-invoerreferenties verzonden. De
meegeleverde standaard `google/veo-3.1-fast` vermeldt de momenteel ondersteunde duur van 4/6/8
seconden, `720P`/`1080P`-resoluties en `16:9`/`9:16`-beeldverhoudingen.
Video-naar-video is niet geregistreerd voor OpenRouter omdat de upstream
API voor videogeneratie momenteel tekst- en afbeeldingsreferenties accepteert.

## Muziek genereren

OpenRouter kan ook de tool `music_generate` ondersteunen via chat-completions
audio-uitvoer. Gebruik een OpenRouter-audiomodel onder
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
`google/lyria-3-clip-preview`. OpenClaw stuurt `modalities: ["text",
"audio"]`, schakelt streaming in, verzamelt de gestreamde audiofragmenten en slaat
het resultaat op als gegenereerde media voor kanaallevering. Referentieafbeeldingen worden
geaccepteerd voor Lyria-modellen via de gedeelde parameter `music_generate image=...`.

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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Als `messages.tts.providers.openrouter.apiKey` is weggelaten, hergebruikt TTS
`models.providers.openrouter.apiKey`, daarna `OPENROUTER_API_KEY`.

## Spraak-naar-tekst (inkomende audio)

OpenRouter kan inkomende spraak-/audiobijlagen transcriberen via het gedeelde
pad `tools.media.audio` met zijn STT-eindpunt (`/audio/transcriptions`).
Dit geldt voor elke kanaalplugin die inkomende spraak/audio doorstuurt naar
media-understanding-preflight.

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

Gebruik OpenRouter Fusion wanneer je één OpenClaw-modelverwijzing meerdere
OpenRouter-modellen parallel wilt laten bevragen, OpenRouter hun antwoorden wilt laten beoordelen en een
enkele definitieve respons wilt laten teruggeven via het normale OpenRouter-providereindpunt. Omdat
de upstream model-slug `openrouter/fusion` is, bevat de OpenClaw-modelverwijzing
zowel het OpenClaw-providerprefix als de upstream OpenRouter-namespace:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configureer het panel en de beoordelaar van Fusion via de `params.extraBody` van het model. Die
velden worden doorgestuurd naar de requestbody voor OpenRouter chat completions. Fusion
werkt met zowel OpenRouter OAuth-aanmelding als API-sleutelaanmelding; als je
OAuth gebruikt, laat dan de regel `env.OPENROUTER_API_KEY` uit het onderstaande voorbeeld weg.

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

De lijst `analysis_models` is het parallelle panel, en `model` binnen de Fusion
pluginconfiguratie is het beoordelingsmodel. Stel `tool_choice` op topniveau niet in op
`"required"` in normale OpenClaw-agent-/chatbeurten om Fusion te proberen af te dwingen;
OpenClaw-beurten kunnen OpenClaw-tooldefinities bevatten, en een vereiste
toolkeuze op topniveau kan een van die tools vereisen in plaats van de Fusion-router. Wanneer
deze Fusion-pluginconfiguratie aanwezig is, voegt OpenClaw ook een opgeschoonde
systeempromptnotitie toe met de geconfigureerde analysemodellen en het beoordelingsmodel, zodat de
agent vragen kan beantwoorden over zijn huidige Fusion-panel. Andere `extraBody`-
velden worden niet naar de prompt gekopieerd.

Fusion is bewust trager. OpenRouter kan dezelfde OpenClaw-prompt naar
meerdere analysemodellen sturen en daarna een laatste beoordelings-/synthesestap uitvoeren, waardoor de latentie
meestal hoger is dan bij een directe aanvraag aan één model. Gebruik Fusion voor weloverwogen,
hoogwaardige antwoorden of escalatiepaden, niet als standaard voor
latentiegevoelige chat. Houd het panel klein en kies snellere analyse- en beoordelingsmodellen voor snellere reacties.

Test de geconfigureerde verwijzing met een eenmalige lokale modelaanroep:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Authenticatie en headers

OpenRouter gebruikt onder de motorkap een Bearer-token met je API-sleutel. OpenRouter
OAuth is een PKCE-aanmeldingsstroom die een OpenRouter API-sleutel uitgeeft, zodat OpenClaw
het resultaat opslaat als hetzelfde `openrouter:default` API-sleutel-auth-profiel dat wordt gebruikt door het
pad voor handmatige API-sleutelconfiguratie.

Voor een bestaande installatie kun je je aanmelden of de opgeslagen OpenRouter-sleutel roteren zonder
de volledige onboarding opnieuw uit te voeren:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Gebruik `openclaw models auth login --provider openrouter --method api-key` wanneer
je een sleutel wilt plakken die je handmatig bij OpenRouter hebt aangemaakt.

Bij echte OpenRouter-verzoeken (`https://openrouter.ai/api/v1`) voegt OpenClaw ook
OpenRouter's gedocumenteerde app-attribution-headers toe:

| Header                    | Waarde                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Als je de OpenRouter-provider naar een andere proxy of basis-URL omleidt, injecteert OpenClaw
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
    het huidige verzoek en slaat de vervangende respons op. Snake_case-aliassen
    (`response_cache`, `response_cache_ttl_seconds` en
    `response_cache_clear`) worden ook geaccepteerd.

    Dit staat los van provider-promptcaching en van OpenRouter's
    Anthropic `cache_control`-markeringen. Het wordt alleen toegepast op geverifieerde
    `openrouter.ai`-routes, niet op basis-URL's van aangepaste proxy's.

  </Accordion>

  <Accordion title="Anthropic-cachemarkeringen">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de
    OpenRouter-specifieke Anthropic `cache_control`-markeringen die OpenClaw gebruikt voor
    beter hergebruik van promptcaches op systeem-/ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic-voorinvulling voor redeneren">
    Op geverifieerde OpenRouter-routes verwijderen Anthropic-modelrefs waarvoor redeneren is ingeschakeld
    afsluitende assistant-voorinvulbeurten voordat de aanvraag OpenRouter bereikt,
    overeenkomstig Anthropic's vereiste dat redeneergesprekken eindigen met een
    gebruikersbeurt.
  </Accordion>

  <Accordion title="Injectie van denken / redeneren">
    Op ondersteunde niet-`auto`-routes koppelt OpenClaw het geselecteerde denkniveau aan
    OpenRouter-proxy-redeneerpayloads. Niet-ondersteunde modelhints en
    `openrouter/auto` slaan die redeneerinjectie over. Hunter Alpha slaat ook
    proxy-redeneren over voor verouderde geconfigureerde modelrefs, omdat OpenRouter
    definitieve antwoordtekst in redeneervelden kon teruggeven voor die gepensioneerde route.
  </Accordion>

  <Accordion title="DeepSeek V4-redeneerherhaling">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` in op
    opnieuw afgespeelde assistant-beurten, zodat denk-/toolgesprekken de vereiste
    vervolgstructuur van DeepSeek V4 behouden. OpenClaw verzendt door OpenRouter ondersteunde
    `reasoning.effort`-waarden voor deze routes; lagere niet-uit-niveaus worden toegewezen aan
    `high`, en verouderde `max`-overschrijvingen worden toegewezen aan `xhigh`.
  </Accordion>

  <Accordion title="Alleen-OpenAI-aanvraagvorming">
    OpenRouter loopt nog steeds via het proxy-achtige OpenAI-compatibele pad, dus
    native aanvraagvorming die alleen voor OpenAI geldt, zoals `serviceTier`, Responses `store`,
    OpenAI-redeneercompatibele payloads en promptcache-hints, wordt niet doorgestuurd.
  </Accordion>

  <Accordion title="Door Gemini ondersteunde routes">
    Door Gemini ondersteunde OpenRouter-refs blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar Gemini-gedachtesignatuur-opschoning, maar schakelt native Gemini
    herhalingsvalidatie of bootstrap-herschrijvingen niet in.
  </Accordion>

  <Accordion title="Routeringsmetadata voor providers">
    OpenRouter ondersteunt een `provider`-aanvraagobject voor onderliggende providerroutering.
    Configureer een standaardbeleid voor alle OpenRouter-aanvragen voor tekstmodellen
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
    payload. Gebruik OpenRouter's gedocumenteerde snake_case-velden, waaronder `sort`,
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

    Dit is alleen van toepassing op OpenRouter-chat-completions-routes. Directe Anthropic-,
    Google-, OpenAI- of aangepaste providerroutes negeren OpenRouter-routeringsparameters.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor agents, modellen en providers.
  </Card>
</CardGroup>
