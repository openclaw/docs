---
read_when:
    - Chcesz jeden klucz API dla wielu LLM-ów
    - Chcesz uruchamiać modele przez OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz używać OpenRouter do generowania muzyki
    - Chcesz używać OpenRouter do generowania wideo
summary: Użyj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-06-27T18:14:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40f1888d388de6f97329fc681da97d6c82eeba5d35b3861bde71ebc7c76e19e7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter udostępnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego adresu URL.

## Pierwsze kroki

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Uruchom wdrażanie OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw otwiera przepływ logowania OpenRouter w przeglądarce, wymienia kod
        PKCE na klucz API OpenRouter i zapisuje ten klucz w domyślnym
        profilu uwierzytelniania OpenRouter. Na hostach zdalnych/bez interfejsu graficznego OpenClaw wypisuje
        URL logowania i prosi o wklejenie URL przekierowania po zalogowaniu.
      </Step>
      <Step title="(Opcjonalnie) Przełącz na konkretny model">
        Wdrażanie domyślnie używa `openrouter/auto`. Konkretny model wybierz później:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Klucz API">
    <Steps>
      <Step title="Pobierz swój klucz API">
        Utwórz klucz API na [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Uruchom wdrażanie z kluczem API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcjonalnie) Przełącz na konkretny model">
        Wdrażanie domyślnie używa `openrouter/auto`. Konkretny model wybierz później:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

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

| Odwołanie do modelu               | Uwagi                         |
| --------------------------------- | ----------------------------- |
| `openrouter/auto`                 | Automatyczny routing OpenRouter |
| `openrouter/openrouter/fusion`    | Router OpenRouter Fusion      |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI    |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 przez MoonshotAI    |

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

OpenClaw wysyła żądania obrazów do API obrazów chat completions OpenRouter z `modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują obsługiwane wskazówki `aspectRatio` i `resolution` przez `image_config` OpenRouter. Użyj `agents.defaults.imageGenerationModel.timeoutMs` dla wolniejszych modeli obrazów OpenRouter; parametr `timeoutMs` na pojedyncze wywołanie narzędzia `image_generate` nadal ma pierwszeństwo.

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
`unsigned_urls` OpenRouter albo udokumentowanego endpointu treści zadania.
Obrazy referencyjne są domyślnie wysyłane jako obrazy pierwszej/ostatniej klatki; obrazy
oznaczone `reference_image` są wysyłane jako referencje wejściowe OpenRouter. Dołączona
domyślna opcja `google/veo-3.1-fast` deklaruje obecnie obsługiwane czasy trwania 4/6/8
sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Wideo-na-wideo nie jest zarejestrowane dla OpenRouter, ponieważ nadrzędne
API generowania wideo obecnie przyjmuje tekst i referencje obrazów.

## Generowanie muzyki

OpenRouter może także obsługiwać narzędzie `music_generate` przez wyjście audio
chat completions. Użyj modelu audio OpenRouter w
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

Dołączony dostawca muzyki OpenRouter domyślnie używa
`google/lyria-3-pro-preview` i udostępnia także
`google/lyria-3-clip-preview`. OpenClaw wysyła `modalities: ["text",
"audio"]`, włącza strumieniowanie, zbiera strumieniowane fragmenty audio i zapisuje
wynik jako wygenerowane media do dostarczenia kanałem. Obrazy referencyjne są
akceptowane dla modeli Lyria przez współdzielony parametr `music_generate image=...`.

## Tekst na mowę

OpenRouter może być także używany jako dostawca TTS przez swój zgodny z OpenAI
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
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Jeśli `messages.tts.providers.openrouter.apiKey` zostanie pominięte, TTS ponownie użyje
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Mowa na tekst (przychodzące audio)

OpenRouter może transkrybować przychodzące załączniki głosowe/audio przez współdzieloną
ścieżkę `tools.media.audio`, używając swojego endpointu STT (`/audio/transcriptions`).
Dotyczy to dowolnej wtyczki kanału, która przekazuje przychodzące głos/audio do
wstępnej analizy rozumienia mediów.

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

## Router Fusion

Użyj OpenRouter Fusion, gdy chcesz, aby jedno odwołanie do modelu OpenClaw zapytało kilka
modeli OpenRouter równolegle, pozwoliło OpenRouter ocenić ich odpowiedzi i zwróciło
jedną finalną odpowiedź przez standardowy endpoint dostawcy OpenRouter. Ponieważ
slug modelu nadrzędnego to `openrouter/fusion`, odwołanie do modelu OpenClaw zawiera
zarówno prefiks dostawcy OpenClaw, jak i nadrzędną przestrzeń nazw OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Skonfiguruj panel i sędziego Fusion przez `params.extraBody` modelu. Te
pola są przekazywane do treści żądania chat-completions OpenRouter. Fusion
działa zarówno z wdrażaniem OAuth OpenRouter, jak i wdrażaniem z kluczem API; jeśli używasz
OAuth, pomiń wiersz `env.OPENROUTER_API_KEY` z poniższego przykładu.

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

Lista `analysis_models` jest panelem równoległym, a `model` wewnątrz konfiguracji
pluginu Fusion jest modelem sędziowskim. Nie ustawiaj najwyższego poziomu `tool_choice` na
`"required"` w normalnych turach agenta/czatu OpenClaw, próbując wymusić Fusion;
tury OpenClaw mogą zawierać definicje narzędzi OpenClaw, a wymagany wybór narzędzia
na najwyższym poziomie może wymagać jednego z tych narzędzi zamiast routera Fusion. Gdy
ta konfiguracja pluginu Fusion jest obecna, OpenClaw dodaje także oczyszczoną
notatkę w prompcie systemowym ze skonfigurowanymi modelami analizy i modelem sędziowskim, aby
agent mógł odpowiadać na pytania o swój bieżący panel Fusion. Inne pola `extraBody`
nie są kopiowane do promptu.

Fusion jest z założenia wolniejsze. OpenRouter może wysłać ten sam prompt OpenClaw do
wielu modeli analizy, a następnie uruchomić końcowy krok sędziowania/syntezy, więc opóźnienie jest
zwykle większe niż przy bezpośrednim żądaniu do pojedynczego modelu. Używaj Fusion do przemyślanych,
wysokiej jakości odpowiedzi lub ścieżek eskalacji, a nie jako domyślnej opcji dla
czatu wrażliwego na opóźnienia. Aby uzyskać szybsze odpowiedzi, utrzymuj mały panel i wybieraj
szybsze modele analizy i sędziowania.

Przetestuj skonfigurowane odwołanie za pomocą jednorazowego lokalnego wywołania modelu:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Uwierzytelnianie i nagłówki

OpenRouter używa pod spodem tokenu Bearer z Twoim kluczem API. OpenRouter
OAuth to przepływ logowania PKCE, który wydaje klucz API OpenRouter, więc OpenClaw zapisuje
wynik jako ten sam profil uwierzytelniania z kluczem API `openrouter:default`, którego używa
ręczna ścieżka konfiguracji z kluczem API.

Dla istniejącej instalacji zaloguj się lub obróć zapisany klucz OpenRouter bez
ponownego uruchamiania pełnego wdrażania:

```bash
openclaw models auth login --provider openrouter --method oauth
```

Użyj `openclaw models auth login --provider openrouter --method api-key`, gdy
chcesz wkleić klucz utworzony ręcznie w OpenRouter.

W rzeczywistych żądaniach OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje także
udokumentowane nagłówki atrybucji aplikacji OpenRouter:

| Nagłówek                  | Wartość                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jeśli przekierujesz dostawcę OpenRouter na inny proxy lub bazowy URL, OpenClaw
**nie** wstrzykuje tych nagłówków specyficznych dla OpenRouter ani markerów pamięci podręcznej Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Buforowanie odpowiedzi">
    Buforowanie odpowiedzi OpenRouter jest opcjonalne. Włącz je dla każdego modelu OpenRouter za pomocą
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
    bieżącego żądania i zapisuje zastępczą odpowiedź. Aliasy snake_case
    (`response_cache`, `response_cache_ttl_seconds` i
    `response_cache_clear`) są również akceptowane.

    Jest to niezależne od buforowania promptów dostawcy oraz od markerów
    Anthropic `cache_control` OpenRouter. Stosuje się tylko do zweryfikowanych
    tras `openrouter.ai`, a nie do niestandardowych bazowych URL proxy.

  </Accordion>

  <Accordion title="Markery pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    specyficzne dla OpenRouter markery Anthropic `cache_control`, których OpenClaw używa do
    lepszego ponownego wykorzystania pamięci podręcznej promptów w blokach promptów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Wstępne wypełnienie rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic z włączonym rozumowaniem
    odrzucają końcowe tury wstępnego wypełnienia asystenta, zanim żądanie dotrze do OpenRouter,
    zgodnie z wymaganiem Anthropic, aby konwersacje z rozumowaniem kończyły się turą
    użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie myślenia / rozumowania">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia na
    ładunki rozumowania proxy OpenRouter. Nieobsługiwane wskazówki modeli i
    `openrouter/auto` pomijają to wstrzykiwanie rozumowania. Hunter Alpha pomija również
    rozumowanie proxy dla nieaktualnych skonfigurowanych odwołań do modeli, ponieważ OpenRouter mógłby
    zwrócić tekst końcowej odpowiedzi w polach rozumowania dla tej wycofanej trasy.
  </Accordion>

  <Accordion title="Odtwarzanie rozumowania DeepSeek V4">
    Na zweryfikowanych trasach OpenRouter `openrouter/deepseek/deepseek-v4-flash` i
    `openrouter/deepseek/deepseek-v4-pro` uzupełniają brakujące `reasoning_content` w
    odtwarzanych turach asystenta, aby konwersacje z myśleniem/narzędziami zachowywały wymagany
    kształt kontynuacji DeepSeek V4. OpenClaw wysyła obsługiwane przez OpenRouter
    wartości `reasoning_effort` dla tych tras; `xhigh` jest najwyższym reklamowanym
    poziomem, a nieaktualne nadpisania `max` są mapowane na `xhigh`.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter nadal przechodzi przez zgodną z OpenAI ścieżkę w stylu proxy, więc
    natywne kształtowanie żądań przeznaczone tylko dla OpenAI, takie jak `serviceTier`, `store` Responses,
    ładunki zgodności rozumowania OpenAI oraz wskazówki pamięci podręcznej promptów nie są przekazywane dalej.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy-Gemini: OpenClaw zachowuje
    tam sanityzację sygnatur myśli Gemini, ale nie włącza natywnej walidacji odtwarzania Gemini
    ani przepisywania bootstrapu.
  </Accordion>

  <Accordion title="Metadane routingu dostawcy">
    OpenRouter obsługuje obiekt żądania `provider` do routingu bazowego dostawcy.
    Skonfiguruj domyślną politykę dla wszystkich żądań modeli tekstowych OpenRouter
    za pomocą `models.providers.openrouter.params.provider`:

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

    OpenClaw przekazuje ten obiekt do OpenRouter jako ładunek żądania `provider`.
    Używaj udokumentowanych pól OpenRouter w formacie snake_case, w tym `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` i `enforce_distillable_text`.

    Parametry dla poszczególnych modeli nadal zastępują obiekt routingu na poziomie dostawcy:

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

    Dotyczy to tylko tras chat-completions OpenRouter. Bezpośrednie trasy Anthropic,
    Google, OpenAI lub niestandardowych dostawców ignorują parametry routingu OpenRouter.

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
