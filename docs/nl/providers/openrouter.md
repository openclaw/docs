---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je wilt modellen via OpenRouter uitvoeren in OpenClaw
    - Je wilt OpenRouter gebruiken voor het genereren van afbeeldingen
    - Je wilt OpenRouter gebruiken voor het genereren van muziek
    - Je wilt OpenRouter gebruiken voor het genereren van video's
summary: Gebruik de uniforme API van OpenRouter om toegang te krijgen tot veel modellen in OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T09:20:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter stuurt aanvragen naar veel modellen achter één API en één sleutel. Het is compatibel met OpenAI, zodat OpenClaw ermee communiceert via hetzelfde transport in `openai-completions`-stijl dat voor andere proxyproviders wordt gebruikt.

## Aan de slag

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Voer het OAuth-instelproces uit">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw opent de aanmeldingsprocedure van OpenRouter in de browser (PKCE), wisselt de code in voor een OpenRouter-API-sleutel en slaat deze op in het standaardverificatieprofiel van OpenRouter. Op externe hosts of hosts zonder grafische interface toont OpenClaw de aanmeldings-URL en vraagt het u na het aanmelden de omleidings-URL te plakken.
      </Step>
      <Step title="(Optioneel) Schakel over naar een specifiek model">
        Het instelproces gebruikt standaard `openrouter/auto`. Kies later een concreet model:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API-sleutel">
    <Steps>
      <Step title="Verkrijg uw API-sleutel">
        Maak een API-sleutel aan op [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Voer het instelproces met API-sleutel uit">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Optioneel) Schakel over naar een specifiek model">
        Het instelproces gebruikt standaard `openrouter/auto`. Kies later een concreet model:

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
Modelverwijzingen volgen het patroon `openrouter/<provider>/<model>`. Zie [/concepts/model-providers](/nl/concepts/model-providers) voor de volledige lijst met beschikbare providers en modellen.
</Note>

Meegeleverde terugvalmodellen die worden gebruikt wanneer live catalogusdetectie niet beschikbaar is:

| Modelverwijzing                   | Opmerkingen                       |
| --------------------------------- | --------------------------------- |
| `openrouter/auto`                 | Automatische routering van OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 via MoonshotAI          |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 via MoonshotAI          |

Elke andere verwijzing met `openrouter/<provider>/<model>`, waaronder `openrouter/openrouter/fusion` (zie [Fusion-router](#fusion-router)), wordt dynamisch omgezet aan de hand van de live modelcatalogus van OpenRouter.

## Afbeeldingen genereren

OpenRouter kan als backend dienen voor de tool `image_generate`. Stel een OpenRouter-afbeeldingsmodel in onder `agents.defaults.imageGenerationModel`:

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

OpenClaw verzendt afbeeldingsaanvragen naar de chat-completions-afbeeldings-API van OpenRouter met `modalities: ["image", "text"]`. Gemini-afbeeldingsmodellen ontvangen daarnaast via `image_config` van OpenRouter aanwijzingen voor `aspectRatio` en `resolution`; andere afbeeldingsmodellen niet. Gebruik `agents.defaults.imageGenerationModel.timeoutMs` voor tragere modellen; de `timeoutMs` per aanroep van de tool `image_generate` heeft nog steeds voorrang.

## Video's genereren

OpenRouter kan via zijn asynchrone `/videos`-API als backend dienen voor de tool `video_generate`. Stel een OpenRouter-videomodel in onder `agents.defaults.videoGenerationModel`:

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

OpenClaw dient tekst-naar-video- en afbeelding-naar-video-taken in, controleert periodiek de geretourneerde `polling_url` en downloadt de voltooide video via de `unsigned_urls` van OpenRouter of het inhoudseindpunt van de taak. Referentieafbeeldingen worden standaard gebruikt als afbeeldingen voor het eerste of laatste frame; afbeeldingen met de tag `reference_image` worden in plaats daarvan als invoerreferenties verzonden. De meegeleverde standaardwaarde `google/veo-3.1-fast` ondersteunt duurwaarden van 4, 6 en 8 seconden, resoluties van `720P` en `1080P` en beeldverhoudingen van `16:9` en `9:16`. Video-naar-video wordt niet ondersteund: de bovenliggende API accepteert alleen tekst- en afbeeldingsreferenties.

## Muziek genereren

OpenRouter kan via audio-uitvoer van chat-completions als backend dienen voor de tool `music_generate`. Stel een OpenRouter-audiomodel in onder `agents.defaults.musicGenerationModel`:

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

De meegeleverde OpenRouter-muziekprovider gebruikt standaard `google/lyria-3-pro-preview` en biedt ook `google/lyria-3-clip-preview` aan. OpenClaw verzendt `modalities: ["text", "audio"]`, streamt het antwoord, verzamelt de audiofragmenten en slaat het resultaat op als gegenereerde media voor levering via het kanaal. Lyria-modellen accepteren één referentieafbeelding via de gedeelde parameter `music_generate image=...`. Streamingaudio, transcriptbewaring en de afgeleide SSE-gebeurtenisenvelop worden begrensd door `agents.defaults.mediaMaxMb` (de standaardlimiet voor audio is 16 MB).

## Tekst-naar-spraak

OpenRouter kan via zijn met OpenAI compatibele eindpunt `/audio/speech` als TTS-provider fungeren.

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

Als `messages.tts.providers.openrouter.apiKey` is weggelaten, valt TTS terug op `models.providers.openrouter.apiKey` en vervolgens op `OPENROUTER_API_KEY`.

## Spraak-naar-tekst (inkomende audio)

OpenRouter kan inkomende spraak- en audiobijlagen transcriberen via het gedeelde pad `tools.media.audio`, met behulp van zijn STT-eindpunt (`/audio/transcriptions`). Dit geldt voor elke kanaalplugin die inkomende spraak of audio doorstuurt naar de voorafgaande controle voor mediabegrip.

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

OpenClaw verzendt STT-aanvragen naar OpenRouter als JSON met base64-audio onder `input_audio` (het STT-contract van OpenRouter), niet als multipart OpenAI-formulieruploads.

## Fusion-router

OpenRouter Fusion verzendt één OpenClaw-modelverwijzing parallel naar meerdere OpenRouter-modellen, laat OpenRouter hun antwoorden beoordelen en retourneert één definitief antwoord via het normale OpenRouter-eindpunt. De modelslug van de bovenliggende dienst is `openrouter/fusion`, zodat de OpenClaw-modelverwijzing zowel het providerprefix van OpenClaw als de bovenliggende OpenRouter-naamruimte bevat:

```bash
openclaw models set openrouter/openrouter/fusion
```

Configureer het panel en het beoordelingsmodel van Fusion via `params.extraBody` van het model; deze velden worden rechtstreeks doorgestuurd naar de hoofdtekst van de chat-completions-aanvraag van OpenRouter. Fusion werkt met zowel het OAuth- als het API-sleutelinstelproces; laat bij gebruik van OAuth de regel `env.OPENROUTER_API_KEY` hieronder weg.

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

`analysis_models` is het parallelle panel; `model` in de configuratie van de Fusion-plugin is het beoordelingsmodel. Stel `tool_choice` op het hoogste niveau bij normale agent- of chatbeurten niet in op `"required"` om Fusion te proberen af te dwingen: OpenClaw-beurten kunnen eigen tooldefinities bevatten en een verplichte toolkeuze op het hoogste niveau kan een van die tools selecteren in plaats van de Fusion-router. Wanneer deze configuratie van de Fusion-plugin aanwezig is, voegt OpenClaw een opgeschoonde notitie aan de systeemprompt toe met de geconfigureerde analysemodellen en het beoordelingsmodel, zodat de agent vragen over zijn eigen Fusion-panel kan beantwoorden. Andere velden van `extraBody` worden niet naar de prompt gekopieerd.

Fusion is opzettelijk trager: OpenRouter verdeelt de prompt over meerdere analysemodellen en voert daarna een beoordelings- en synthesestap uit, waardoor de latentie hoger is dan bij een rechtstreekse aanvraag aan één model. Gebruik het voor weloverwogen antwoorden van hoge kwaliteit of escalatiepaden, niet als latentiegevoelige standaardinstelling. Houd het panel klein en kies snellere analyse- en beoordelingsmodellen voor snellere antwoorden.

Test een geconfigureerde verwijzing met een eenmalige lokale aanroep:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Verificatie en headers

OpenRouter gebruikt een Bearer-token op basis van uw API-sleutel. OpenRouter OAuth is een PKCE-aanmeldingsprocedure die een OpenRouter-API-sleutel uitgeeft. OpenClaw slaat het resultaat daarom op in hetzelfde API-sleutelverificatieprofiel `openrouter:default` dat voor handmatige instelling met een API-sleutel wordt gebruikt.

Om u aan te melden of de opgeslagen sleutel van een bestaande installatie te vervangen zonder het volledige instelproces opnieuw uit te voeren:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Bij geverifieerde OpenRouter-aanvragen (`https://openrouter.ai/api/v1`) voegt OpenClaw de gedocumenteerde headers voor app-toeschrijving van OpenRouter toe:

| Header                    | Waarde                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Als u de OpenRouter-provider naar een andere proxy of basis-URL laat verwijzen, voegt OpenClaw deze OpenRouter-specifieke headers of Anthropic-cachemarkeringen **niet** toe.
</Warning>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Antwoordcaching">
    Antwoordcaching van OpenRouter is optioneel. Schakel dit per model in:

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

    OpenClaw verzendt `X-OpenRouter-Cache: true` en, indien geconfigureerd, `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` dwingt een vernieuwing voor de huidige aanvraag af en slaat het vervangende antwoord op. Aliassen in snake_case (`response_cache`, `response_cache_ttl_seconds`, `response_cache_clear`) worden geaccepteerd, evenals `responseCacheTtl` en `response_cache_ttl` zonder het achtervoegsel `Seconds`.

    Dit staat los van promptcaching door de provider en van de Anthropic-markeringen `cache_control` van OpenRouter. Het is alleen van toepassing op geverifieerde routes via `openrouter.ai`, niet op aangepaste basis-URL's van proxy's.

  </Accordion>

  <Accordion title="Anthropic-cachemarkeringen">
    Op geverifieerde OpenRouter-routes behouden Anthropic-modelverwijzingen de Anthropic-markeringen `cache_control` van OpenRouter voor beter hergebruik van de promptcache bij systeem- en ontwikkelaarspromptblokken.
  </Accordion>

  <Accordion title="Anthropic-reasoningprefill">
    Op geverifieerde OpenRouter-routes verwijderen Anthropic-modelrefs waarvoor reasoning is ingeschakeld
    afsluitende prefill-beurten van de assistent voordat het verzoek
    OpenRouter bereikt, conform de vereiste van Anthropic dat reasoning-gesprekken
    eindigen met een gebruikersbeurt.
  </Accordion>

  <Accordion title="Injectie van thinking/reasoning">
    Op ondersteunde routes anders dan `auto` koppelt OpenClaw het geselecteerde thinking-niveau
    aan reasoning-payloads voor de OpenRouter-proxy. `openrouter/auto` en niet-ondersteunde
    modelhints slaan die injectie over. Verouderde `openrouter/hunter-alpha`-refs
    slaan deze ook over, omdat OpenRouter op die buiten gebruik gestelde route definitieve antwoordtekst
    in reasoning-velden kon retourneren.
  </Accordion>

  <Accordion title="Hergebruik van DeepSeek V4-reasoning">
    Op geverifieerde OpenRouter-routes vullen `openrouter/deepseek/deepseek-v4-flash` en
    `openrouter/deepseek/deepseek-v4-pro` ontbrekende `reasoning_content` in bij
    opnieuw afgespeelde assistentbeurten, zodat thinking-/toolgesprekken de door DeepSeek
    V4 vereiste vervolgstructuur behouden. OpenClaw verzendt door OpenRouter ondersteunde
    `reasoning.effort`-waarden voor deze routes: `xhigh`/`max` worden toegewezen aan `xhigh`,
    elk ander niveau dat niet uitgeschakeld is, wordt toegewezen aan `high`.
  </Accordion>

  <Accordion title="Alleen voor OpenAI geldende verzoekstructurering">
    OpenRouter werkt via het OpenAI-compatibele proxypad, waardoor systeemeigen,
    uitsluitend voor OpenAI geldende verzoekstructurering, zoals `serviceTier`, Responses `store`,
    payloads voor OpenAI-reasoningcompatibiliteit en hints voor de promptcache, niet wordt doorgestuurd.
  </Accordion>

  <Accordion title="Door Gemini ondersteunde routes">
    Door Gemini ondersteunde OpenRouter-refs blijven op het proxy-Gemini-pad: OpenClaw behoudt
    daar de opschoning van Gemini-thought-signatures, maar schakelt geen systeemeigen
    Gemini-validatie voor hergebruik of bootstrap-herschrijvingen in.
  </Accordion>

  <Accordion title="Metadata voor providerroutering">
    OpenRouter ondersteunt een `provider`-verzoekobject voor routering naar de onderliggende provider.
    Configureer met `models.providers.openrouter.params.provider` een standaardbeleid
    voor alle OpenRouter-verzoeken aan tekstmodellen:

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

    OpenClaw stuurt dat object door naar OpenRouter als de `provider`-payload
    van het verzoek. Gebruik de gedocumenteerde snake_case-velden van OpenRouter, waaronder `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` en `enforce_distillable_text`.

    Parameters per model overschrijven het providerbrede routeringsobject:

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

    Dit is alleen van toepassing op chat-completions-routes van OpenRouter. Rechtstreekse routes
    van Anthropic, Google, OpenAI of aangepaste providers negeren de routeringsparameters van OpenRouter.

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
