---
read_when:
    - Chcesz skonfigurować Moonshot K2 (Moonshot Open Platform) czy Kimi Coding
    - Musisz rozumieć osobne punkty końcowe, klucze i odwołania do modeli
    - Chcesz konfiguracji do kopiowania i wklejania dla dowolnego dostawcy
summary: Skonfiguruj Moonshot K2 i Kimi Coding (osobni dostawcy + klucze)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:13:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot udostępnia Kimi API z punktami końcowymi zgodnymi z OpenAI. Skonfiguruj
dostawcę i ustaw domyślny model na `moonshot/kimi-k2.6` albo użyj
Kimi Coding z `kimi/kimi-for-coding`.

<Warning>
Moonshot i Kimi Coding to **oddzielni dostawcy**. Kluczy nie można stosować zamiennie, punkty końcowe są różne, a odwołania do modeli też się różnią (`moonshot/...` vs `kimi/...`).
</Warning>

## Wbudowany katalog modeli

[//]: # "moonshot-kimi-k2-ids:start"

| Odwołanie do modelu               | Nazwa                  | Rozumowanie        | Dane wejściowe | Kontekst | Maks. dane wyjściowe |
| --------------------------------- | ---------------------- | ------------------ | -------------- | -------- | -------------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nie                | tekst, obraz   | 262,144  | 262,144              |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Zawsze włączone    | tekst, obraz   | 262,144  | 262,144              |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nie                | tekst, obraz   | 262,144  | 262,144              |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Tak                | tekst          | 262,144  | 262,144              |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Tak                | tekst          | 262,144  | 262,144              |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nie                | tekst          | 256,000  | 16,384               |

[//]: # "moonshot-kimi-k2-ids:end"

Szacunki kosztów katalogowych dla obecnych modeli K2 hostowanych przez Moonshot używają
opublikowanych przez Moonshot stawek pay-as-you-go: Kimi K2.7 Code kosztuje $0.19/MTok przy trafieniu w cache,
$0.95/MTok wejścia i $4.00/MTok wyjścia; Kimi K2.6 kosztuje $0.16/MTok przy trafieniu w cache,
$0.95/MTok wejścia i $4.00/MTok wyjścia; Kimi K2.5 kosztuje $0.10/MTok przy trafieniu w cache,
$0.60/MTok wejścia i $3.00/MTok wyjścia. Pozostałe starsze wpisy katalogu zachowują
zerokosztowe symbole zastępcze, chyba że nadpiszesz je w konfiguracji.

Kimi K2.7 Code zawsze używa natywnego myślenia. OpenClaw udostępnia tylko stan myślenia `on`
dla tego modelu i pomija wychodzące kontrolki `thinking` oraz
`reasoning_effort`, zgodnie z wymaganiami Moonshot. OpenClaw pomija też
nadpisania próbkowania, które K2.7 ustala na domyślne wartości dostawcy. Kimi K2.6 pozostaje
domyślnym modelem onboardingu.

## Pierwsze kroki

Wybierz dostawcę i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Moonshot API">
    **Najlepsze do:** modeli Kimi K2 przez Moonshot Open Platform.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania | Punkt końcowy                 | Region          |
        | ---------------------- | ----------------------------- | --------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`  | Międzynarodowy  |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`  | Chiny           |
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Albo dla punktu końcowego w Chinach:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Ustaw domyślny model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy modele są dostępne">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Uruchom test dymny na żywo">
        Użyj izolowanego katalogu stanu, gdy chcesz zweryfikować dostęp do modelu i śledzenie kosztów
        bez naruszania zwykłych sesji:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Odpowiedź JSON powinna zgłaszać `provider: "moonshot"` oraz
        `model: "kimi-k2.6"`. Wpis transkryptu asystenta przechowuje znormalizowane
        użycie tokenów oraz szacowany koszt w `usage.cost`, gdy Moonshot zwraca
        metadane użycia.
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Najlepsze do:** zadań skoncentrowanych na kodzie przez punkt końcowy Kimi Coding.

    <Note>
    Kimi Coding używa innego klucza API i prefiksu dostawcy (`kimi/...`) niż Moonshot (`moonshot/...`). Stabilne odwołanie do modelu API to `kimi/kimi-for-coding`; starsze odwołania `kimi/kimi-code` i `kimi/k2p5` są nadal akceptowane i normalizowane do tego identyfikatora modelu API.
    </Note>

    <Steps>
      <Step title="Zainstaluj Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Ustaw domyślny model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Przykład konfiguracji

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Wyszukiwanie w sieci Kimi

Plugin Moonshot rejestruje też **Kimi** jako dostawcę `web_search`, obsługiwanego przez wyszukiwanie w sieci Moonshot.

<Steps>
  <Step title="Uruchom interaktywną konfigurację wyszukiwania w sieci">
    ```bash
    openclaw configure --section web
    ```

    Wybierz **Kimi** w sekcji wyszukiwania w sieci, aby zapisać
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Skonfiguruj region i model wyszukiwania w sieci">
    Interaktywna konfiguracja pyta o:

    | Ustawienie           | Opcje                                                                |
    | -------------------- | -------------------------------------------------------------------- |
    | Region API           | `https://api.moonshot.ai/v1` (międzynarodowy) albo `https://api.moonshot.cn/v1` (Chiny) |
    | Model wyszukiwania w sieci | Domyślnie `kimi-k2.6`                                        |

  </Step>
</Steps>

Konfiguracja znajduje się w `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Natywny tryb myślenia">
    Kimi K2.7 Code zawsze używa natywnego myślenia. Moonshot wymaga, aby klienci
    pomijali pole `thinking` dla tego modelu, więc OpenClaw udostępnia tylko `on` i
    ignoruje przestarzałe ustawienia `off`. K2.7 ustala też `temperature`, `top_p`, `n`,
    `presence_penalty` i `frequency_penalty`; OpenClaw pomija skonfigurowane
    nadpisania tych pól.

    Inne modele Moonshot Kimi obsługują binarne natywne myślenie:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Skonfiguruj je dla każdego modelu przez `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw mapuje poziomy `/think` w czasie działania dla tych modeli:

    | Poziom `/think`     | Zachowanie Moonshot        |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | Dowolny poziom inny niż off | `thinking.type=enabled` |

    <Warning>
    Gdy myślenie Moonshot jest włączone, `tool_choice` musi mieć wartość `auto` albo `none`. OpenClaw normalizuje niezgodne wartości do `auto`. Dotyczy to także Kimi K2.7 Code, którego trybu myślenia nie można wyłączyć, aby zachować przypięty wybór narzędzia.
    </Warning>

    Kimi K2.6 akceptuje również opcjonalne pole `thinking.keep`, które kontroluje
    zachowywanie `reasoning_content` między wieloma turami. Ustaw je na `"all"`, aby zachować pełne
    rozumowanie między turami; pomiń je (lub zostaw jako `null`), aby użyć domyślnej
    strategii serwera. OpenClaw przekazuje `thinking.keep` tylko dla
    `moonshot/kimi-k2.6` i usuwa je z innych modeli. Kimi K2.7 Code
    domyślnie zachowuje pełną historię rozumowania, podczas gdy OpenClaw pomija całe
    pole `thinking`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Sanityzacja identyfikatorów wywołań narzędzi">
    Moonshot Kimi udostępnia natywne identyfikatory tool_call w formacie `functions.<name>:<index>`. Dla transportu OpenAI-completions OpenClaw zachowuje pierwsze wystąpienie każdego natywnego identyfikatora Kimi i przepisuje późniejsze duplikaty na deterministyczne identyfikatory w stylu OpenAI `call_*`. Pasujące wyniki narzędzi są remapowane z tym samym identyfikatorem, dzięki czemu odtwarzanie pozostaje unikatowe bez usuwania pierwszego natywnego identyfikatora Kimi.

    Aby wymusić ścisłą sanityzację w niestandardowym dostawcy zgodnym z OpenAI, ustaw `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Zgodność użycia strumieniowego">
    Natywne punkty końcowe Moonshot (`https://api.moonshot.ai/v1` i
    `https://api.moonshot.cn/v1`) deklarują zgodność użycia strumieniowego we
    współdzielonym transporcie `openai-completions`. OpenClaw opiera to na
    możliwościach punktu końcowego, więc zgodne niestandardowe identyfikatory dostawców kierowane do tych samych natywnych
    hostów Moonshot dziedziczą to samo zachowanie użycia strumieniowego.

    Przy katalogowych cenach K2.6 strumieniowe użycie obejmujące tokeny wejściowe,
    wyjściowe i odczytu z pamięci podręcznej jest również konwertowane na lokalnie szacowany koszt w USD dla
    `/status`, `/usage full`, `/usage cost` oraz rozliczania sesji
    opartego na transkrypcji.

  </Accordion>

  <Accordion title="Referencja punktu końcowego i referencji modelu">
    | Dostawca   | Prefiks referencji modelu | Punkt końcowy                      | Zmienna środowiskowa uwierzytelniania        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Punkt końcowy Kimi Coding          | `KIMI_API_KEY`      |
    | Wyszukiwanie w sieci | N/D              | Taki sam jak region Moonshot API   | `KIMI_API_KEY` lub `MOONSHOT_API_KEY` |

    - Wyszukiwanie w sieci Kimi używa `KIMI_API_KEY` lub `MOONSHOT_API_KEY` i domyślnie korzysta z `https://api.moonshot.ai/v1` z modelem `kimi-k2.6`.
    - W razie potrzeby nadpisz ceny oraz metadane kontekstu w `models.providers`.
    - Jeśli Moonshot opublikuje inne limity kontekstu dla modelu, odpowiednio dostosuj `contextWindow`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Wyszukiwanie w sieci" href="/pl/tools/web" icon="magnifying-glass">
    Konfigurowanie dostawców wyszukiwania w sieci, w tym Kimi.
  </Card>
  <Card title="Referencja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dostawców, modeli i pluginów.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Zarządzanie kluczami API Moonshot i dokumentacja.
  </Card>
</CardGroup>
