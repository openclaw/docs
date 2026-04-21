---
read_when:
    - Chcesz skonfigurować Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
    - Musisz zrozumieć oddzielne endpointy, klucze i model-refy
    - Chcesz gotową do skopiowania konfigurację dla każdego z dostawców
summary: Skonfiguruj Moonshot K2 vs Kimi Coding (oddzielni dostawcy + klucze)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T10:00:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot udostępnia API Kimi z endpointami zgodnymi z OpenAI. Skonfiguruj
dostawcę i ustaw domyślny model na `moonshot/kimi-k2.6`, albo użyj
Kimi Coding z `kimi/kimi-code`.

<Warning>
Moonshot i Kimi Coding to **oddzielni dostawcy**. Klucze nie są wymienne, endpointy się różnią, a model-refy także się różnią (`moonshot/...` vs `kimi/...`).
</Warning>

## Wbudowany katalog modeli

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Nazwa                  | Rozumowanie | Wejście      | Kontekst | Maks. wyjście |
| --------------------------------- | ---------------------- | ----------- | ------------ | -------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nie         | tekst, obraz | 262,144  | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nie         | tekst, obraz | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Tak         | tekst        | 262,144  | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Tak         | tekst        | 262,144  | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nie         | tekst        | 256,000  | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

Dołączone szacunki kosztów dla bieżących modeli K2 hostowanych przez Moonshot używają
opublikowanych przez Moonshot stawek pay-as-you-go: Kimi K2.6 to $0.16/MTok cache hit,
$0.95/MTok wejście i $4.00/MTok wyjście; Kimi K2.5 to $0.10/MTok cache hit,
$0.60/MTok wejście i $3.00/MTok wyjście. Inne starsze wpisy katalogu zachowują
placeholdery o zerowym koszcie, chyba że nadpiszesz je w config.

## Pierwsze kroki

Wybierz dostawcę i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Moonshot API">
    **Najlepsze dla:** modeli Kimi K2 przez Moonshot Open Platform.

    <Steps>
      <Step title="Wybierz region endpointu">
        | Wybór auth             | Endpoint                       | Region         |
        | ---------------------- | ------------------------------ | -------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Międzynarodowy |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Chiny          |
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Albo dla endpointu China:

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
        bez dotykania swoich normalnych sesji:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Odpowiedź JSON powinna raportować `provider: "moonshot"` oraz
        `model: "kimi-k2.6"`. Wpis transkryptu asystenta przechowuje znormalizowane
        użycie tokenów oraz szacowany koszt pod `usage.cost`, gdy Moonshot zwraca
        metadane użycia.
      </Step>
    </Steps>

    ### Przykład config

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
    **Najlepsze dla:** zadań skupionych na kodzie przez endpoint Kimi Coding.

    <Note>
    Kimi Coding używa innego klucza API i prefiksu dostawcy (`kimi/...`) niż Moonshot (`moonshot/...`). Starszy model ref `kimi/k2p5` pozostaje akceptowany jako identyfikator zgodności.
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
              model: { primary: "kimi/kimi-code" },
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

    ### Przykład config

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi web search

OpenClaw dostarcza także **Kimi** jako dostawcę `web_search`, opartego na Moonshot web
search.

<Steps>
  <Step title="Uruchom interaktywną konfigurację web search">
    ```bash
    openclaw configure --section web
    ```

    W sekcji web-search wybierz **Kimi**, aby zapisać
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Skonfiguruj region web search i model">
    Interaktywna konfiguracja pyta o:

    | Ustawienie          | Opcje                                                                |
    | ------------------- | -------------------------------------------------------------------- |
    | Region API          | `https://api.moonshot.ai/v1` (międzynarodowy) lub `https://api.moonshot.cn/v1` (Chiny) |
    | Model web search    | Domyślnie `kimi-k2.6`                                                |

  </Step>
</Steps>

Config znajduje się pod `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // albo użyj KIMI_API_KEY / MOONSHOT_API_KEY
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

## Zaawansowane

<AccordionGroup>
  <Accordion title="Natywny tryb rozumowania">
    Moonshot Kimi obsługuje binarny natywny tryb rozumowania:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Skonfiguruj go per model przez `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw mapuje także poziomy runtime `/think` dla Moonshot:

    | Poziom `/think`      | Zachowanie Moonshot         |
    | -------------------- | --------------------------- |
    | `/think off`         | `thinking.type=disabled`    |
    | Dowolny poziom nie-off | `thinking.type=enabled`   |

    <Warning>
    Gdy rozumowanie Moonshot jest włączone, `tool_choice` musi mieć wartość `auto` albo `none`. OpenClaw normalizuje niezgodne wartości `tool_choice` do `auto` dla zgodności.
    </Warning>

    Kimi K2.6 akceptuje także opcjonalne pole `thinking.keep`, które kontroluje
    zachowanie `reasoning_content` między turami. Ustaw je na `"all"`, aby zachować pełne
    rozumowanie między turami; pomiń je (albo pozostaw `null`), aby użyć domyślnej
    strategii serwera. OpenClaw przekazuje `thinking.keep` tylko dla
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

  <Accordion title="Zgodność użycia strumieniowego">
    Natywne endpointy Moonshot (`https://api.moonshot.ai/v1` i
    `https://api.moonshot.cn/v1`) deklarują zgodność użycia strumieniowego na
    współdzielonym transporcie `openai-completions`. OpenClaw opiera to o możliwości endpointu,
    więc zgodne niestandardowe identyfikatory dostawców kierujące na te same natywne
    hosty Moonshot dziedziczą to samo zachowanie użycia strumieniowego.

    Przy dołączonym cenniku K2.6, użycie strumieniowe obejmujące tokeny wejścia, wyjścia
    i odczytu cache jest także przeliczane na lokalny szacowany koszt w USD dla
    `/status`, `/usage full`, `/usage cost` i rozliczania sesji opartego na
    transkryptach.

  </Accordion>

  <Accordion title="Referencja endpointów i model-refów">
    | Dostawca      | Prefiks model-ref | Endpoint                      | Zmienna środowiskowa auth |
    | ------------- | ----------------- | ----------------------------- | ------------------------- |
    | Moonshot      | `moonshot/`       | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`        |
    | Moonshot CN   | `moonshot/`       | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`        |
    | Kimi Coding   | `kimi/`           | endpoint Kimi Coding          | `KIMI_API_KEY`            |
    | Web search    | N/D               | Taki sam jak region API Moonshot | `KIMI_API_KEY` albo `MOONSHOT_API_KEY` |

    - Kimi web search używa `KIMI_API_KEY` albo `MOONSHOT_API_KEY` i domyślnie używa `https://api.moonshot.ai/v1` z modelem `kimi-k2.6`.
    - W razie potrzeby nadpisz cennik i metadane kontekstu w `models.providers`.
    - Jeśli Moonshot opublikuje inne limity kontekstu dla modelu, odpowiednio dostosuj `contextWindow`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, model-refów i zachowania failover.
  </Card>
  <Card title="Web search" href="/tools/web-search" icon="magnifying-glass">
    Konfigurowanie dostawców web search, w tym Kimi.
  </Card>
  <Card title="Referencja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dla dostawców, modeli i pluginów.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Zarządzanie kluczami API Moonshot i dokumentacja.
  </Card>
</CardGroup>
