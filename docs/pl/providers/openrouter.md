---
read_when:
    - Chcesz używać jednego klucza API do wielu LLM-ów
    - Chcesz uruchamiać modele za pośrednictwem OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz używać OpenRouter do generowania wideo
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-04T02:26:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6b7299408aa0de7530e2248c7fa5dae8c09095e2d20a0e9d12a64cab83966fc
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter udostępnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego adresu URL.

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

| Odwołanie do modelu             | Uwagi                            |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | Automatyczne routowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI     |

## Generowanie obrazów

OpenRouter może też obsługiwać narzędzie `image_generate`. Użyj modelu obrazów OpenRouter w `agents.defaults.imageGenerationModel`:

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

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` narzędzia `image_generate` dla pojedynczego wywołania nadal ma pierwszeństwo.

## Generowanie wideo

OpenRouter może też obsługiwać narzędzie `video_generate` przez swoje asynchroniczne API `/videos`. Użyj modelu wideo OpenRouter w `agents.defaults.videoGenerationModel`:

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
`unsigned_urls` OpenRouter albo udokumentowanego punktu końcowego treści zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączony
domyślny `google/veo-3.1-fast` deklaruje obecnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Video-to-video nie jest zarejestrowane dla OpenRouter, ponieważ nadrzędne
API generowania wideo obecnie akceptuje tekst i referencje obrazów.

## Text-to-speech

OpenRouter może być też używany jako dostawca TTS przez zgodny z OpenAI
punkt końcowy `/audio/speech`.

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

OpenRouter używa pod spodem tokenu Bearer z Twoim kluczem API.

W rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje też
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                    | Wartość                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jeśli skierujesz dostawcę OpenRouter na inne proxy lub bazowy adres URL, OpenClaw
**nie** wstrzykuje tych nagłówków specyficznych dla OpenRouter ani znaczników pamięci podręcznej Anthropic.
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

    OpenClaw wysyła `X-OpenRouter-Cache: true` oraz, gdy skonfigurowano,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` wymusza odświeżenie dla
    bieżącego żądania i zapisuje zastępczą odpowiedź. Akceptowane są też aliasy snake_case
    (`response_cache`, `response_cache_ttl_seconds` i
    `response_cache_clear`).

    Jest to oddzielne od buforowania promptów dostawcy oraz od znaczników
    Anthropic `cache_control` OpenRouter. Stosuje się tylko na zweryfikowanych
    trasach `openrouter.ai`, a nie na niestandardowych bazowych adresach URL proxy.

  </Accordion>

  <Accordion title="Znaczniki pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego użycia pamięci podręcznej promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Wstępne wypełnianie rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic z włączonym rozumowaniem
    usuwają końcowe tury wstępnego wypełnienia asystenta, zanim żądanie trafi do OpenRouter,
    zgodnie z wymogiem Anthropic, aby konwersacje z rozumowaniem kończyły się turą użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie myślenia / rozumowania">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    ładunki rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modelu oraz
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania. Hunter Alpha pomija również
    rozumowanie proxy dla nieaktualnych skonfigurowanych odwołań do modeli, ponieważ OpenRouter mógłby
    zwrócić tekst finalnej odpowiedzi w polach rozumowania dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="Odtwarzanie rozumowania DeepSeek V4">
    Na zweryfikowanych trasach OpenRouter `openrouter/deepseek/deepseek-v4-flash` oraz
    `openrouter/deepseek/deepseek-v4-pro` uzupełniają brakujące `reasoning_content` w
    odtwarzanych turach asystenta, aby konwersacje z myśleniem/narzędziami zachowały wymagany
    kształt kontynuacji DeepSeek V4.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal przechodzi przez ścieżkę proxy zgodną z OpenAI, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    ładunki zgodności rozumowania OpenAI oraz wskazówki pamięci podręcznej promptów nie są przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam oczyszczanie sygnatur myślenia Gemini, ale nie włącza natywnej walidacji
    odtwarzania Gemini ani przepisań bootstrap.
  </Accordion>

  <Accordion title="Metadane routowania dostawcy">
    Jeśli przekażesz routowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane routowania OpenRouter przed uruchomieniem współdzielonych wrapperów strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
