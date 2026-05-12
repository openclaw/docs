---
read_when:
    - Chcesz mieć jeden klucz API dla wielu LLM-ów
    - Chcesz uruchamiać modele za pośrednictwem OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz używać OpenRouter do generowania wideo
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter zapewnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL.

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcjonalnie) Przełącz na konkretny model">
    Onboarding domyślnie używa `openrouter/auto`. Później wybierz konkretny model:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Przykład konfiguracji

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

## Odwołania do modeli

<Note>
Odwołania do modeli mają wzorzec `openrouter/<provider>/<model>`. Pełną listę
dostępnych dostawców i modeli znajdziesz w [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Dołączone przykłady awaryjne:

| Odwołanie do modelu              | Uwagi                                |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | Automatyczne routowanie OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI           |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 przez MoonshotAI           |

## Generowanie obrazów

OpenRouter może również obsługiwać narzędzie `image_generate`. Użyj modelu obrazów OpenRouter w `agents.defaults.imageGenerationModel`:

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

OpenClaw wysyła żądania obrazów do API obrazów czatowych completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` narzędzia `image_generate` dla pojedynczego wywołania nadal ma pierwszeństwo.

## Generowanie wideo

OpenRouter może również obsługiwać narzędzie `video_generate` przez swoje asynchroniczne API `/videos`. Użyj modelu wideo OpenRouter w `agents.defaults.videoGenerationModel`:

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

OpenClaw przesyła zadania text-to-video i image-to-video do OpenRouter, odpytuje
zwrócony `polling_url` i pobiera gotowe wideo z
`unsigned_urls` OpenRouter lub udokumentowanego endpointu zawartości zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączony
domyślny `google/veo-3.1-fast` deklaruje obecnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Video-to-video nie jest zarejestrowane dla OpenRouter, ponieważ upstreamowe
API generowania wideo obecnie przyjmuje tekst i referencje obrazów.

## Text-to-speech

OpenRouter może być również używany jako dostawca TTS przez swój zgodny z OpenAI
endpoint `/audio/speech`.

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

Jeśli `messages.tts.providers.openrouter.apiKey` zostanie pominięte, TTS ponownie użyje
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Speech-to-text (przychodzące audio)

OpenRouter może transkrybować przychodzące załączniki głosowe/audio przez współdzieloną
ścieżkę `tools.media.audio`, używając swojego endpointu STT (`/audio/transcriptions`).
Dotyczy to każdego Plugin kanału, który przekazuje przychodzący głos/audio do
wstępnego rozpoznawania mediów.

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

OpenClaw wysyła żądania STT OpenRouter jako JSON z audio base64 w
`input_audio` (kontrakt STT OpenRouter), a nie jako wieloczęściowe przesyłanie formularza OpenAI.

## Uwierzytelnianie i nagłówki

OpenRouter używa pod spodem tokena Bearer z Twoim kluczem API.

W rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje również
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                  | Wartość                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jeśli skierujesz dostawcę OpenRouter do innego proxy lub bazowego URL, OpenClaw
**nie** wstrzyknie tych nagłówków specyficznych dla OpenRouter ani znaczników cache Anthropic.
</Warning>

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Cache odpowiedzi">
    Cache odpowiedzi OpenRouter jest opcjonalny. Włącz go dla danego modelu OpenRouter za pomocą
    parametrów modelu:

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

    OpenClaw wysyła `X-OpenRouter-Cache: true` oraz, gdy skonfigurowano,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` wymusza odświeżenie dla
    bieżącego żądania i zapisuje zastępczą odpowiedź. Akceptowane są również aliasy snake_case
    (`response_cache`, `response_cache_ttl_seconds` i
    `response_cache_clear`).

    Jest to oddzielne od cache promptów dostawcy i od znaczników Anthropic
    `cache_control` OpenRouter. Jest stosowane tylko na zweryfikowanych trasach
    `openrouter.ai`, a nie dla niestandardowych bazowych URL proxy.

  </Accordion>

  <Accordion title="Znaczniki cache Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego użycia cache promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Prefill rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic z włączonym rozumowaniem
    usuwają końcowe tury prefill asystenta, zanim żądanie dotrze do OpenRouter,
    zgodnie z wymaganiem Anthropic, aby konwersacje z rozumowaniem kończyły się turą użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie thinking / reasoning">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom thinking na
    ładunki reasoning proxy OpenRouter. Nieobsługiwane wskazówki modelu i
    `openrouter/auto` pomijają to wstrzykiwanie reasoning. Hunter Alpha również pomija
    reasoning proxy dla nieaktualnych skonfigurowanych odwołań do modeli, ponieważ OpenRouter mógłby
    zwracać tekst odpowiedzi końcowej w polach reasoning dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="Odtwarzanie rozumowania DeepSeek V4">
    Na zweryfikowanych trasach OpenRouter `openrouter/deepseek/deepseek-v4-flash` i
    `openrouter/deepseek/deepseek-v4-pro` uzupełniają brakujące `reasoning_content` w
    odtwarzanych turach asystenta, aby konwersacje thinking/tool zachowały wymagany
    kształt dalszego ciągu DeepSeek V4. OpenClaw wysyła obsługiwane przez OpenRouter
    wartości `reasoning_effort` dla tych tras; `xhigh` jest najwyższym deklarowanym
    poziomem, a nieaktualne nadpisania `max` są mapowane na `xhigh`.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal przechodzi przez proxy-style ścieżkę zgodną z OpenAI, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    ładunki zgodności rozumowania OpenAI i wskazówki cache promptów, nie jest przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam sanityzację sygnatur thought Gemini, ale nie włącza natywnej walidacji
    odtwarzania Gemini ani przepisywania bootstrap.
  </Accordion>

  <Accordion title="Metadane routowania dostawcy">
    Jeśli przekażesz routowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane routowania OpenRouter, zanim uruchomią się współdzielone wrappery strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
