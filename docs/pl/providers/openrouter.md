---
read_when:
    - Chcesz jednego klucza API do wielu dużych modeli językowych
    - Chcesz uruchamiać modele za pośrednictwem OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz użyć OpenRouter do generowania wideo
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter zapewnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL-a.

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj swój klucz API">
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

Przykłady dołączonych opcji awaryjnych:

| Odwołanie modelu                 | Uwagi                              |
| --------------------------------- | ---------------------------------- |
| `openrouter/auto`                 | Automatyczne trasowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI         |

## Generowanie obrazów

OpenRouter może także obsługiwać narzędzie `image_generate`. Użyj modelu obrazów OpenRouter w `agents.defaults.imageGenerationModel`:

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

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` dla pojedynczego wywołania narzędzia `image_generate` nadal ma pierwszeństwo.

## Generowanie wideo

OpenRouter może także obsługiwać narzędzie `video_generate` przez swoje asynchroniczne API `/videos`. Użyj modelu wideo OpenRouter w `agents.defaults.videoGenerationModel`:

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
zwrócony `polling_url` i pobiera ukończone wideo z
`unsigned_urls` OpenRouter albo z udokumentowanego endpointu treści zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączony
domyślny `google/veo-3.1-fast` deklaruje obecnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Video-to-video nie jest zarejestrowane dla OpenRouter, ponieważ nadrzędne
API generowania wideo obecnie akceptuje tekst i referencje obrazów.

## Zamiana tekstu na mowę

OpenRouter może być także używany jako dostawca TTS przez zgodny z OpenAI
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

## Uwierzytelnianie i nagłówki

OpenRouter używa pod spodem tokena Bearer z Twoim kluczem API.

W rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje także
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                  | Wartość                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jeśli przekierujesz dostawcę OpenRouter na inny proxy lub bazowy URL, OpenClaw
**nie** wstrzyknie tych nagłówków specyficznych dla OpenRouter ani znaczników pamięci podręcznej Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Buforowanie odpowiedzi">
    Buforowanie odpowiedzi OpenRouter jest opcjonalne. Włącz je dla poszczególnych modeli OpenRouter za pomocą
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

    OpenClaw wysyła `X-OpenRouter-Cache: true` oraz, po skonfigurowaniu,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` wymusza odświeżenie dla
    bieżącego żądania i zapisuje zastępczą odpowiedź. Akceptowane są także aliasy snake_case
    (`response_cache`, `response_cache_ttl_seconds` oraz
    `response_cache_clear`).

    Jest to niezależne od buforowania promptów dostawcy i od znaczników
    Anthropic `cache_control` OpenRouter. Jest stosowane tylko na zweryfikowanych
    trasach `openrouter.ai`, a nie dla niestandardowych bazowych URL-i proxy.

  </Accordion>

  <Accordion title="Znaczniki pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego wykorzystania pamięci podręcznej promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Wstępne wypełnianie rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic z włączonym rozumowaniem
    usuwają końcowe tury wstępnego wypełniania asystenta, zanim żądanie dotrze do OpenRouter,
    zgodnie z wymaganiem Anthropic, aby konwersacje z rozumowaniem kończyły się turą użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie myślenia / rozumowania">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    payloady rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modeli i
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania. Hunter Alpha również pomija
    rozumowanie proxy dla nieaktualnych skonfigurowanych odwołań modeli, ponieważ OpenRouter mógłby
    zwrócić tekst odpowiedzi końcowej w polach rozumowania dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="Odtwarzanie rozumowania DeepSeek V4">
    Na zweryfikowanych trasach OpenRouter `openrouter/deepseek/deepseek-v4-flash` i
    `openrouter/deepseek/deepseek-v4-pro` uzupełniają brakujące `reasoning_content` w
    odtworzonych turach asystenta, aby konwersacje z myśleniem/narzędziami zachowały wymagany
    przez DeepSeek V4 kształt kontynuacji. OpenClaw wysyła obsługiwane przez OpenRouter
    wartości `reasoning_effort` dla tych tras; `xhigh` jest najwyższym deklarowanym
    poziomem, a nieaktualne nadpisania `max` są mapowane na `xhigh`.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez zgodną z OpenAI ścieżkę w stylu proxy, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    payloady zgodności rozumowania OpenAI i wskazówki pamięci podręcznej promptów, nie jest przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam oczyszczanie podpisów myśli Gemini, ale nie włącza natywnej walidacji
    odtwarzania Gemini ani przepisywania bootstrap.
  </Accordion>

  <Accordion title="Metadane trasowania dostawcy">
    Jeśli przekażesz trasowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane trasowania OpenRouter, zanim uruchomią się współdzielone wrappery strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
