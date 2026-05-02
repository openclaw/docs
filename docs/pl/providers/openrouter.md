---
read_when:
    - Chcesz mieć jeden klucz API dla wielu LLM-ów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz korzystać z OpenRouter do generowania wideo
summary: Użyj ujednoliconego interfejsu API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T20:57:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e98b8b540265b6d11681390c02cb68312f33625bf223823a2dbca17e877c0422
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter udostępnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL.

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

## Referencje modeli

<Note>
Referencje modeli są zgodne ze wzorcem `openrouter/<provider>/<model>`. Pełną listę
dostępnych dostawców i modeli znajdziesz w [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Dołączone przykłady zapasowe:

| Referencja modelu                 | Uwagi                                |
| --------------------------------- | ------------------------------------ |
| `openrouter/auto`                 | Automatyczne kierowanie OpenRouter   |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI           |

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

OpenClaw wysyła żądania obrazów do interfejsu API obrazów w uzupełnieniach czatu OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` dla pojedynczego wywołania narzędzia `image_generate` nadal ma pierwszeństwo.

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

OpenClaw przesyła zadania tekst-na-wideo i obraz-na-wideo do OpenRouter, odpytuje
zwrócony `polling_url` i pobiera ukończone wideo z
`unsigned_urls` OpenRouter albo z udokumentowanego punktu końcowego treści zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączona
wartość domyślna `google/veo-3.1-fast` deklaruje obecnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Wideo-na-wideo nie jest zarejestrowane dla OpenRouter, ponieważ nadrzędne
API generowania wideo obecnie akceptuje tekst i referencje obrazów.

## Tekst na mowę

OpenRouter może być także używany jako dostawca TTS przez swój zgodny z OpenAI
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

Jeśli `messages.tts.providers.openrouter.apiKey` zostanie pominięty, TTS ponownie użyje
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Uwierzytelnianie i nagłówki

OpenRouter używa pod spodem tokenu Bearer z Twoim kluczem API.

W rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje także
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                  | Wartość               |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Jeśli przekierujesz dostawcę OpenRouter na inny proxy lub bazowy URL, OpenClaw
**nie** wstrzykuje tych nagłówków specyficznych dla OpenRouter ani znaczników pamięci podręcznej Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Znaczniki pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter referencje modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego wykorzystania pamięci podręcznej promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Prefill rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter referencje modeli Anthropic z włączonym rozumowaniem
    usuwają końcowe tury prefill asystenta, zanim żądanie dotrze do OpenRouter,
    zgodnie z wymaganiem Anthropic, aby konwersacje z rozumowaniem kończyły się turą użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie thinking / reasoning">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom thinking na
    ładunki rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modeli i
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania. Hunter Alpha pomija także
    rozumowanie proxy dla nieaktualnych skonfigurowanych referencji modeli, ponieważ OpenRouter mógłby
    zwracać tekst końcowej odpowiedzi w polach rozumowania dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="Odtwarzanie rozumowania DeepSeek V4">
    Na zweryfikowanych trasach OpenRouter `openrouter/deepseek/deepseek-v4-flash` i
    `openrouter/deepseek/deepseek-v4-pro` uzupełniają brakujące `reasoning_content` w
    odtwarzanych turach asystenta, aby konwersacje thinking/narzędziowe zachowywały wymagany
    kształt kontynuacji DeepSeek V4.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez ścieżkę zgodną z OpenAI w stylu proxy, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    ładunki zgodności rozumowania OpenAI i wskazówki pamięci podręcznej promptów, nie są przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Referencje OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam sanityzację sygnatur myśli Gemini, ale nie włącza natywnej walidacji odtwarzania Gemini
    ani przepisań bootstrap.
  </Accordion>

  <Accordion title="Metadane routingu dostawcy">
    Jeśli przekażesz routing dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    go jako metadane routingu OpenRouter, zanim zostaną uruchomione współdzielone wrappery strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
