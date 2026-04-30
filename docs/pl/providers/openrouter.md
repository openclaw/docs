---
read_when:
    - Chcesz mieć jeden klucz API dla wielu modeli LLM
    - Chcesz uruchamiać modele za pośrednictwem OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz używać OpenRouter do generowania wideo
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T10:14:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter zapewnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL.

## Pierwsze kroki

<Steps>
  <Step title="Get your API key">
    Utwórz klucz API na [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Optional) Switch to a specific model">
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

| Odwołanie do modelu              | Uwagi                                  |
| --------------------------------- | -------------------------------------- |
| `openrouter/auto`                 | Automatyczne routowanie OpenRouter     |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 za pośrednictwem MoonshotAI  |

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

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` narzędzia `image_generate` dla pojedynczego wywołania nadal ma pierwszeństwo.

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
`unsigned_urls` OpenRouter albo z udokumentowanego endpointu zawartości zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączona
wartość domyślna `google/veo-3.1-fast` deklaruje aktualnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Video-to-video nie jest zarejestrowane dla OpenRouter, ponieważ upstreamowe
API generowania wideo obecnie akceptuje tekst i referencje obrazów.

## Text-to-speech

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

Jeśli `messages.tts.providers.openrouter.apiKey` zostanie pominięte, TTS użyje ponownie
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

## Zaawansowana konfiguracja

<AccordionGroup>
  <Accordion title="Anthropic cache markers">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki `cache_control` Anthropic, których OpenClaw używa do
    lepszego ponownego wykorzystania pamięci podręcznej promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Thinking / reasoning injection">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    ładunki rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modeli oraz
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania. Hunter Alpha także pomija
    rozumowanie proxy dla nieaktualnych skonfigurowanych odwołań do modeli, ponieważ OpenRouter mógłby
    zwrócić tekst ostatecznej odpowiedzi w polach rozumowania dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="OpenAI-only request shaping">
    OpenRouter nadal przechodzi przez proxy-stylową ścieżkę zgodną z OpenAI, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    ładunki zgodności rozumowania OpenAI i wskazówki pamięci podręcznej promptów, nie jest przekazywane dalej.
  </Accordion>

  <Accordion title="Gemini-backed routes">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam sanitację sygnatur myśli Gemini, ale nie włącza natywnej walidacji
    replay Gemini ani przepisań bootstrap.
  </Accordion>

  <Accordion title="Provider routing metadata">
    Jeśli przekażesz routowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane routowania OpenRouter, zanim uruchomią się współdzielone opakowania strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji dla agentów, modeli i dostawców.
  </Card>
</CardGroup>
