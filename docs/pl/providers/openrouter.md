---
read_when:
    - Chcesz mieć jeden klucz API dla wielu LLM-ów
    - Chcesz uruchamiać modele za pośrednictwem OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz używać OpenRouter do generowania wideo
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-05-02T10:01:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f7c6f9c77e2a62866fdeaa65667d3871930be2ce22a638accdb8baa76220fd
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter udostępnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego adresu URL.

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
    Onboarding domyślnie używa `openrouter/auto`. Wybierz później konkretny model:

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

| Odwołanie do modelu              | Uwagi                              |
| --------------------------------- | ---------------------------------- |
| `openrouter/auto`                 | Automatyczne routowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI         |

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

OpenClaw wysyła żądania obrazów do API obrazów uzupełnień czatu OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` narzędzia `image_generate` dla pojedynczego wywołania nadal ma pierwszeństwo.

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

OpenClaw przesyła zadania tekst-na-wideo i obraz-na-wideo do OpenRouter, odpytuje
zwrócony `polling_url` i pobiera ukończone wideo z
`unsigned_urls` OpenRouter albo z udokumentowanego endpointu zawartości zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączony
domyślny `google/veo-3.1-fast` deklaruje aktualnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Wideo-na-wideo nie jest zarejestrowane dla OpenRouter, ponieważ nadrzędne API
generowania wideo obecnie akceptuje tekst i referencje obrazów.

## Tekst na mowę

OpenRouter może też być używany jako dostawca TTS przez zgodny z OpenAI
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

Jeśli `messages.tts.providers.openrouter.apiKey` zostanie pominięty, TTS ponownie użyje
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Uwierzytelnianie i nagłówki

OpenRouter używa pod spodem tokenu Bearer z Twoim kluczem API.

W rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje też
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                  | Wartość               |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
Jeśli skierujesz dostawcę OpenRouter na inny serwer proxy lub bazowy adres URL, OpenClaw
**nie** wstrzyknie tych specyficznych dla OpenRouter nagłówków ani znaczników pamięci podręcznej Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Znaczniki pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter znaczniki Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego używania pamięci podręcznej promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Prefill rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic z włączonym rozumowaniem
    usuwają końcowe tury prefill asystenta, zanim żądanie dotrze do OpenRouter,
    zgodnie z wymaganiem Anthropic, aby konwersacje z rozumowaniem kończyły się turą użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie myślenia / rozumowania">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    payloady rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modeli i
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania. Hunter Alpha pomija też
    rozumowanie proxy dla nieaktualnych skonfigurowanych odwołań do modeli, ponieważ OpenRouter mógłby
    zwrócić tekst odpowiedzi końcowej w polach rozumowania dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal działa przez ścieżkę zgodną z OpenAI w stylu proxy, więc
    natywne kształtowanie żądań tylko dla OpenAI, takie jak `serviceTier`, Responses `store`,
    payloady zgodności rozumowania OpenAI i wskazówki pamięci podręcznej promptów, nie jest przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy Gemini: OpenClaw zachowuje
    tam sanityzację podpisu myśli Gemini, ale nie włącza natywnej walidacji
    powtórek Gemini ani przepisań bootstrap.
  </Accordion>

  <Accordion title="Metadane routowania dostawcy">
    Jeśli przekażesz routowanie dostawcy OpenRouter w parametrach modelu, OpenClaw przekaże
    je jako metadane routowania OpenRouter przed uruchomieniem współdzielonych wrapperów strumienia.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="Informacje o konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełne informacje o konfiguracji agentów, modeli i dostawców.
  </Card>
</CardGroup>
