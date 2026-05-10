---
read_when:
    - Chcesz skonfigurować Moonshot K2 (Moonshot Open Platform), a nie Kimi Coding
    - Musisz rozumieć odrębne punkty końcowe, klucze i odwołania do modeli
    - Chcesz konfiguracji do skopiowania i wklejenia dla dowolnego dostawcy
summary: Skonfiguruj Moonshot K2 i Kimi Coding (oddzielni dostawcy + klucze)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot udostępnia Kimi API z punktami końcowymi zgodnymi z OpenAI. Skonfiguruj
dostawcę i ustaw domyślny model na `moonshot/kimi-k2.6` albo użyj
Kimi Coding z `kimi/kimi-for-coding`.

<Warning>
Moonshot i Kimi Coding to **osobni dostawcy**. Klucze nie są wymienne, punkty końcowe się różnią, a odwołania do modeli są różne (`moonshot/...` i `kimi/...`).
</Warning>

## Wbudowany katalog modeli

[//]: # "moonshot-kimi-k2-ids:start"

| Odwołanie do modelu               | Nazwa                  | Rozumowanie | Wejście      | Kontekst | Maks. wyjście |
| --------------------------------- | ---------------------- | ----------- | ------------ | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nie         | tekst, obraz | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nie         | tekst, obraz | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Tak         | tekst        | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Tak         | tekst        | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nie         | tekst        | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Dołączone szacunki kosztów dla obecnych modeli K2 hostowanych przez Moonshot używają
opublikowanych przez Moonshot stawek płatności według zużycia: Kimi K2.6 kosztuje $0.16/MTok przy trafieniu w pamięć podręczną,
$0.95/MTok wejścia i $4.00/MTok wyjścia; Kimi K2.5 kosztuje $0.10/MTok przy trafieniu w pamięć podręczną,
$0.60/MTok wejścia i $3.00/MTok wyjścia. Pozostałe starsze wpisy katalogu zachowują
zerokosztowe symbole zastępcze, chyba że nadpiszesz je w konfiguracji.

## Pierwsze kroki

Wybierz dostawcę i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Moonshot API">
    **Najlepsze do:** modeli Kimi K2 przez Moonshot Open Platform.

    <Steps>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania | Punkt końcowy                 | Region        |
        | ---------------------- | ----------------------------- | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`  | Międzynarodowy |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`  | Chiny         |
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
      <Step title="Ustaw model domyślny">
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
      <Step title="Uruchom test smoke na żywo">
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

        Odpowiedź JSON powinna zgłosić `provider: "moonshot"` i
        `model: "kimi-k2.6"`. Wpis transkrypcji asystenta przechowuje znormalizowane
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
    **Najlepsze do:** zadań skoncentrowanych na kodzie przez punkt końcowy Kimi Coding.

    <Note>
    Kimi Coding używa innego klucza API i prefiksu dostawcy (`kimi/...`) niż Moonshot (`moonshot/...`). Stabilne odwołanie do modelu API to `kimi/kimi-for-coding`; starsze odwołania `kimi/kimi-code` i `kimi/k2p5` pozostają akceptowane i są normalizowane do tego identyfikatora modelu API.
    </Note>

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Ustaw model domyślny">
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

## Wyszukiwanie internetowe Kimi

OpenClaw dostarcza też **Kimi** jako dostawcę `web_search`, opartego na wyszukiwaniu w sieci Moonshot.

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

    | Ustawienie          | Opcje                                                                |
    | ------------------- | -------------------------------------------------------------------- |
    | Region API          | `https://api.moonshot.ai/v1` (międzynarodowy) lub `https://api.moonshot.cn/v1` (Chiny) |
    | Model wyszukiwania w sieci | Domyślnie `kimi-k2.6`                                      |

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
    Moonshot Kimi obsługuje binarny natywny tryb myślenia:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Skonfiguruj go dla każdego modelu przez `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw mapuje też poziomy runtime `/think` dla Moonshot:

    | Poziom `/think`     | Zachowanie Moonshot        |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Dowolny poziom inny niż off | `thinking.type=enabled` |

    <Warning>
    Gdy myślenie Moonshot jest włączone, `tool_choice` musi mieć wartość `auto` albo `none`. OpenClaw normalizuje niezgodne wartości `tool_choice` do `auto` dla zgodności.
    </Warning>

    Kimi K2.6 akceptuje też opcjonalne pole `thinking.keep`, które kontroluje
    wieloturowe zachowywanie `reasoning_content`. Ustaw je na `"all"`, aby zachować pełne
    rozumowanie między turami; pomiń je (albo pozostaw jako `null`), aby użyć domyślnej strategii
    serwera. OpenClaw przekazuje `thinking.keep` tylko dla
    `moonshot/kimi-k2.6` i usuwa je z innych modeli.

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
    Moonshot Kimi udostępnia identyfikatory tool_call w formacie `functions.<name>:<index>`. OpenClaw zachowuje je bez zmian, dzięki czemu wieloturowe wywołania narzędzi nadal działają.

    Aby wymusić ścisłą sanityzację dla niestandardowego dostawcy zgodnego z OpenAI, ustaw `sanitizeToolCallIds: true`:

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

  <Accordion title="Zgodność użycia w streamingu">
    Natywne endpointy Moonshot (`https://api.moonshot.ai/v1` i
    `https://api.moonshot.cn/v1`) deklarują zgodność użycia w streamingu we
    współdzielonym transporcie `openai-completions`. OpenClaw opiera to na
    możliwościach endpointu, więc zgodne identyfikatory niestandardowych dostawców kierujące do tych samych natywnych
    hostów Moonshot dziedziczą to samo zachowanie użycia w streamingu.

    Przy dołączonej wycenie K2.6 streamowane użycie, które obejmuje tokeny wejściowe, wyjściowe
    i odczytu z pamięci podręcznej, jest też przeliczane na lokalnie szacowany koszt w USD dla
    `/status`, `/usage full`, `/usage cost` oraz rozliczania sesji
    opartego na transkrypcji.

  </Accordion>

  <Accordion title="Odwołanie do punktów końcowych i odwołań do modeli">
    | Dostawca   | Prefiks odwołania do modelu | Punkt końcowy                 | Zmienna środowiskowa uwierzytelniania |
    | ---------- | --------------------------- | ----------------------------- | ------------------------------------- |
    | Moonshot   | `moonshot/`                 | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                    |
    | Moonshot CN| `moonshot/`                 | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                    |
    | Kimi Coding| `kimi/`                     | Punkt końcowy Kimi Coding     | `KIMI_API_KEY`                        |
    | Wyszukiwanie w sieci | N/A              | Taki sam jak region API Moonshot | `KIMI_API_KEY` lub `MOONSHOT_API_KEY` |

    - Wyszukiwanie w sieci Kimi używa `KIMI_API_KEY` lub `MOONSHOT_API_KEY` i domyślnie korzysta z `https://api.moonshot.ai/v1` z modelem `kimi-k2.6`.
    - W razie potrzeby nadpisz cennik oraz metadane kontekstu w `models.providers`.
    - Jeśli Moonshot opublikuje inne limity kontekstu dla modelu, odpowiednio dostosuj `contextWindow`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Wyszukiwanie w sieci" href="/pl/tools/web" icon="magnifying-glass">
    Konfigurowanie dostawców wyszukiwania w sieci, w tym Kimi.
  </Card>
  <Card title="Odwołanie do konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dla dostawców, modeli i plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Zarządzanie kluczami API Moonshot i dokumentacja.
  </Card>
</CardGroup>
