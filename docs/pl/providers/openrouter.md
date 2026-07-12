---
read_when:
    - Chcesz używać jednego klucza API do wielu modeli LLM
    - Chcesz uruchamiać modele za pośrednictwem OpenRouter w OpenClaw
    - Chcesz używać OpenRouter do generowania obrazów
    - Chcesz użyć OpenRouter do generowania muzyki
    - Chcesz używać OpenRouter do generowania wideo
summary: Używaj ujednoliconego API OpenRouter, aby uzyskać dostęp do wielu modeli w OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T15:30:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter kieruje żądania do wielu modeli za pośrednictwem jednego API i jednego klucza. Jest
zgodny z OpenAI, dlatego OpenClaw komunikuje się z nim za pomocą tego samego
transportu w stylu `openai-completions`, który jest używany w przypadku innych dostawców proxy.

## Pierwsze kroki

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Uruchom wdrażanie OAuth">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw otwiera w przeglądarce proces logowania OpenRouter (PKCE), wymienia
        kod na klucz API OpenRouter i zapisuje go w domyślnym
        profilu uwierzytelniania OpenRouter. Na hostach zdalnych lub bez interfejsu graficznego OpenClaw wyświetla
        adres URL logowania i prosi o wklejenie adresu URL przekierowania po zalogowaniu.
      </Step>
      <Step title="(Opcjonalnie) Przełącz na konkretny model">
        Domyślnym modelem podczas wdrażania jest `openrouter/auto`. Konkretny model możesz wybrać później:

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="Klucz API">
    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API na stronie [openrouter.ai/keys](https://openrouter.ai/keys).
      </Step>
      <Step title="Uruchom wdrażanie z kluczem API">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(Opcjonalnie) Przełącz na konkretny model">
        Domyślnym modelem podczas wdrażania jest `openrouter/auto`. Konkretny model możesz wybrać później:

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
Odwołania do modeli mają postać `openrouter/<provider>/<model>`. Pełną listę
dostępnych dostawców i modeli znajdziesz w sekcji [/concepts/model-providers](/pl/concepts/model-providers).
</Note>

Wbudowane modele rezerwowe używane, gdy dynamiczne wykrywanie katalogu jest niedostępne:

| Odwołanie do modelu               | Uwagi                          |
| --------------------------------- | ------------------------------ |
| `openrouter/auto`                 | Automatyczne kierowanie OpenRouter |
| `openrouter/moonshotai/kimi-k2.6` | Kimi K2.6 przez MoonshotAI     |
| `openrouter/moonshotai/kimi-k2.5` | Kimi K2.5 przez MoonshotAI     |

Każde inne odwołanie `openrouter/<provider>/<model>`, w tym
`openrouter/openrouter/fusion` (zobacz [router Fusion](#fusion-router)), jest rozpoznawane
dynamicznie na podstawie aktualnego katalogu modeli OpenRouter.

## Generowanie obrazów

OpenRouter może obsługiwać narzędzie `image_generate`. Ustaw model obrazów OpenRouter
w `agents.defaults.imageGenerationModel`:

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

OpenClaw wysyła żądania generowania obrazów do API obrazów chat-completions OpenRouter z
`modalities: ["image", "text"]`. Modele obrazów Gemini otrzymują dodatkowo
wskazówki `aspectRatio` i `resolution` za pośrednictwem `image_config` OpenRouter;
inne modele obrazów ich nie otrzymują. W przypadku wolniejszych modeli użyj
`agents.defaults.imageGenerationModel.timeoutMs`; wartość `timeoutMs` dla pojedynczego wywołania
narzędzia `image_generate` nadal ma pierwszeństwo.

## Generowanie filmów

OpenRouter może obsługiwać narzędzie `video_generate` za pośrednictwem asynchronicznego
API `/videos`. Ustaw model wideo OpenRouter w
`agents.defaults.videoGenerationModel`:

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

OpenClaw przesyła zadania generowania filmu z tekstu i obrazu, odpytuje zwrócony
`polling_url`, a następnie pobiera gotowy film z `unsigned_urls` OpenRouter
lub z punktu końcowego zawartości zadania. Obrazy referencyjne są domyślnie używane jako
pierwsza lub ostatnia klatka; obrazy oznaczone jako `reference_image` są zamiast tego wysyłane
jako referencje wejściowe. Domyślny, wbudowany model `google/veo-3.1-fast` obsługuje czas trwania
4/6/8 sekund, rozdzielczości `720P`/`1080P` oraz proporcje obrazu `16:9`/`9:16`.
Generowanie filmu na podstawie filmu nie jest obsługiwane: nadrzędne API akceptuje wyłącznie tekst
i obrazy referencyjne.

## Generowanie muzyki

OpenRouter może obsługiwać narzędzie `music_generate` za pośrednictwem dźwięku wyjściowego
chat-completions. Ustaw model audio OpenRouter w
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

Wbudowany dostawca muzyki OpenRouter używa domyślnie modelu `google/lyria-3-pro-preview`
i udostępnia również `google/lyria-3-clip-preview`. OpenClaw wysyła `modalities:
["text", "audio"]`, przesyła strumieniowo odpowiedź, zbiera fragmenty dźwięku i zapisuje
wynik jako wygenerowane multimedia do dostarczenia przez kanał. Modele Lyria przyjmują jeden
obraz referencyjny za pośrednictwem wspólnego parametru `music_generate image=...`.
Strumieniowy dźwięk, przechowywanie transkrypcji oraz pochodna otoczka zdarzeń SSE są
ograniczone przez `agents.defaults.mediaMaxMb` (domyślny limit dźwięku wynosi 16 MB).

## Zamiana tekstu na mowę

OpenRouter może działać jako dostawca TTS za pośrednictwem zgodnego z OpenAI
punktu końcowego `/audio/speech`.

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

Jeśli pominięto `messages.tts.providers.openrouter.apiKey`, TTS korzysta kolejno z
`models.providers.openrouter.apiKey`, a następnie `OPENROUTER_API_KEY`.

## Zamiana mowy na tekst (przychodzący dźwięk)

OpenRouter może transkrybować przychodzące załączniki głosowe/dźwiękowe za pośrednictwem wspólnej
ścieżki `tools.media.audio`, używając swojego punktu końcowego STT (`/audio/transcriptions`).
Dotyczy to każdego pluginu kanału, który przekazuje przychodzący głos/dźwięk do
wstępnego etapu rozpoznawania multimediów.

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

OpenClaw wysyła żądania STT do OpenRouter jako JSON z dźwiękiem zakodowanym w base64 w polu
`input_audio` (zgodnie z kontraktem STT OpenRouter), a nie jako wieloczęściowe dane formularza
OpenAI.

## Router Fusion

OpenRouter Fusion wysyła jedno odwołanie do modelu OpenClaw równolegle do kilku modeli OpenRouter,
zleca OpenRouter ocenę ich odpowiedzi i zwraca jedną ostateczną odpowiedź
przez standardowy punkt końcowy OpenRouter. Identyfikator modelu po stronie usługi nadrzędnej to
`openrouter/fusion`, dlatego odwołanie do modelu OpenClaw zawiera zarówno prefiks dostawcy OpenClaw,
jak i przestrzeń nazw nadrzędnego OpenRouter:

```bash
openclaw models set openrouter/openrouter/fusion
```

Skonfiguruj panel i model oceniający Fusion za pomocą `params.extraBody` modelu;
pola te są przekazywane bezpośrednio do treści żądania uzupełniania czatu OpenRouter.
Fusion działa zarówno z wdrażaniem przez OAuth, jak i przez klucz API; jeśli używasz OAuth,
pomiń poniższy wiersz `env.OPENROUTER_API_KEY`.

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

`analysis_models` to panel modeli działających równolegle; `model` wewnątrz konfiguracji pluginu Fusion
to model oceniający. W zwykłych turach agenta/czatu nie ustawiaj `tool_choice` najwyższego poziomu na `"required"`
w celu wymuszenia Fusion: tury OpenClaw mogą zawierać własne definicje narzędzi,
a wymagany wybór narzędzia najwyższego poziomu może wskazać jedno z nich
zamiast routera Fusion. Gdy ta konfiguracja pluginu Fusion jest obecna,
OpenClaw dodaje do komunikatu systemowego oczyszczoną notatkę z listą skonfigurowanych modeli analitycznych
i modelu oceniającego, dzięki czemu agent może odpowiadać na pytania dotyczące własnego panelu Fusion.
Inne pola `extraBody` nie są kopiowane do komunikatu.

Fusion jest z założenia wolniejszy: OpenRouter rozsyła komunikat do wielu
modeli analitycznych, a następnie wykonuje etap oceny/syntezy, więc opóźnienie jest większe niż
w przypadku bezpośredniego żądania do jednego modelu. Używaj go do przemyślanych odpowiedzi wysokiej jakości lub
ścieżek eskalacji, a nie jako domyślnej opcji wrażliwej na opóźnienia. Utrzymuj niewielki panel i
wybieraj szybsze modele analityczne/oceniające, aby uzyskać krótszy czas odpowiedzi.

Przetestuj skonfigurowane odwołanie za pomocą jednorazowego wywołania lokalnego:

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## Uwierzytelnianie i nagłówki

OpenRouter używa tokenu Bearer pochodzącego z Twojego klucza API. OAuth OpenRouter to proces
logowania PKCE, który wystawia klucz API OpenRouter, dlatego OpenClaw zapisuje wynik w
tym samym profilu uwierzytelniania kluczem API `openrouter:default`, którego używa ręczna
konfiguracja klucza API.

Aby zalogować się lub zmienić zapisany klucz w istniejącej instalacji bez ponownego wykonywania
pełnego wdrażania:

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

Do zweryfikowanych żądań OpenRouter (`https://openrouter.ai/api/v1`) OpenClaw dodaje
udokumentowane przez OpenRouter nagłówki identyfikujące aplikację:

| Nagłówek                  | Wartość                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
Jeśli przekierujesz dostawcę OpenRouter do innego serwera proxy lub bazowego adresu URL, OpenClaw
**nie** dodaje tych nagłówków właściwych dla OpenRouter ani znaczników pamięci podręcznej Anthropic.
</Warning>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Buforowanie odpowiedzi">
    Buforowanie odpowiedzi OpenRouter jest opcjonalne. Włącz je osobno dla każdego modelu:

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

    OpenClaw wysyła `X-OpenRouter-Cache: true` oraz, jeśli skonfigurowano,
    `X-OpenRouter-Cache-TTL`. `responseCacheClear: true` wymusza odświeżenie dla
    bieżącego żądania i zapisuje odpowiedź zastępczą. Akceptowane są aliasy w notacji snake_case
    (`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`), podobnie jak `responseCacheTtl` /
    `response_cache_ttl` bez przyrostka `Seconds`.

    Jest to funkcja odrębna od buforowania komunikatów przez dostawcę oraz od znaczników
    Anthropic `cache_control` w OpenRouter. Ma zastosowanie wyłącznie do zweryfikowanych
    tras `openrouter.ai`, a nie do niestandardowych bazowych adresów URL serwerów proxy.

  </Accordion>

  <Accordion title="Znaczniki pamięci podręcznej Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic zachowują
    znaczniki Anthropic `cache_control` OpenRouter, aby zwiększyć ponowne wykorzystanie pamięci podręcznej komunikatów
    dla bloków komunikatów systemowych/deweloperskich.
  </Accordion>

  <Accordion title="Wstępne wypełnianie rozumowania Anthropic">
    Na zweryfikowanych trasach OpenRouter odwołania do modeli Anthropic z włączonym rozumowaniem
    usuwają końcowe tury wstępnie wypełnione przez asystenta, zanim żądanie dotrze do
    OpenRouter, zgodnie z wymaganiem Anthropic, aby konwersacje z rozumowaniem
    kończyły się turą użytkownika.
  </Accordion>

  <Accordion title="Wstrzykiwanie myślenia / rozumowania">
    Na obsługiwanych trasach innych niż `auto` OpenClaw mapuje wybrany poziom myślenia
    na ładunki rozumowania proxy OpenRouter. `openrouter/auto` i nieobsługiwane
    wskazówki dotyczące modeli pomijają to wstrzykiwanie. Nieaktualne odwołania `openrouter/hunter-alpha` również
    je pomijają, ponieważ na tej wycofanej trasie OpenRouter mógł zwracać tekst odpowiedzi końcowej
    w polach rozumowania.
  </Accordion>

  <Accordion title="Odtwarzanie rozumowania DeepSeek V4">
    Na zweryfikowanych trasach OpenRouter modele `openrouter/deepseek/deepseek-v4-flash` i
    `openrouter/deepseek/deepseek-v4-pro` uzupełniają brakujące `reasoning_content` w
    odtwarzanych turach asystenta, zachowując konwersacje obejmujące myślenie i narzędzia w wymaganym przez DeepSeek
    V4 formacie kolejnej tury. OpenClaw wysyła obsługiwane przez OpenRouter
    wartości `reasoning.effort` dla tych tras: `xhigh`/`max` są mapowane na `xhigh`,
    a każdy inny poziom poza wyłączeniem jest mapowany na `high`.
  </Accordion>

  <Accordion title="Kształtowanie żądań tylko dla OpenAI">
    OpenRouter działa przez zgodną z OpenAI ścieżkę w stylu proxy, dlatego natywne
    kształtowanie żądań przeznaczone wyłącznie dla OpenAI, takie jak `serviceTier`, `store` interfejsu Responses,
    ładunki zgodności rozumowania OpenAI i wskazówki dotyczące pamięci podręcznej promptów, nie jest przekazywane.
  </Accordion>

  <Accordion title="Trasy oparte na Gemini">
    Odwołania OpenRouter oparte na Gemini pozostają na ścieżce proxy Gemini: OpenClaw zachowuje
    tam oczyszczanie sygnatur myśli Gemini, ale nie włącza natywnej
    walidacji odtwarzania Gemini ani przepisywania inicjalizacji.
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
    Użyj udokumentowanych przez OpenRouter pól w formacie snake_case, w tym `sort`,
    `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr` i `enforce_distillable_text`.

    Parametry poszczególnych modeli zastępują obiekt routingu obowiązujący dla całego dostawcy:

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

    Dotyczy to wyłącznie tras uzupełniania czatu OpenRouter. Bezpośrednie trasy Anthropic,
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
