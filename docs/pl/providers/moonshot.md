---
read_when:
    - Chcesz skonfigurować Moonshot K2 (Moonshot Open Platform) zamiast Kimi Coding
    - Musisz rozumieć oddzielne punkty końcowe, klucze i odwołania do modeli
    - Potrzebujesz konfiguracji do skopiowania i wklejenia dla dowolnego z tych dostawców
summary: Konfiguracja Moonshot K2 i Kimi Coding (oddzielni dostawcy i klucze)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T15:35:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot udostępnia API Kimi za pośrednictwem punktów końcowych zgodnych z OpenAI. Ustaw
model domyślny na `moonshot/kimi-k2.6` dla Moonshot Open Platform albo
`kimi/kimi-for-coding` dla Kimi Coding.

<Warning>
Moonshot i Kimi Coding są **oddzielnymi dostawcami**, z których każdy jest dostarczany jako osobny zewnętrzny plugin. Klucze nie są wymienne, punkty końcowe się różnią, podobnie jak odwołania do modeli (`moonshot/...` i `kimi/...`).
</Warning>

## Wbudowany katalog modeli

[//]: # "moonshot-kimi-k2-ids:start"

| Odwołanie do modelu               | Nazwa                  | Rozumowanie       | Dane wejściowe | Kontekst | Maks. dane wyjściowe |
| --------------------------------- | ---------------------- | ----------------- | --------------- | -------- | -------------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Nie               | tekst, obraz    | 262,144  | 262,144              |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Zawsze włączone   | tekst, obraz    | 262,144  | 262,144              |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Nie               | tekst, obraz    | 262,144  | 262,144              |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Tak               | tekst           | 262,144  | 262,144              |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Tak               | tekst           | 262,144  | 262,144              |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Nie               | tekst           | 256,000  | 16,384               |

[//]: # "moonshot-kimi-k2-ids:end"

Szacunki kosztów w katalogu wykorzystują opublikowane przez Moonshot stawki płatności za użycie: w przypadku Kimi
K2.7 Code trafienie w pamięci podręcznej kosztuje 0,19 USD/MTok, dane wejściowe 0,95 USD/MTok, a dane wyjściowe 4,00 USD/MTok; w przypadku Kimi
K2.6 trafienie w pamięci podręcznej kosztuje 0,16 USD/MTok, dane wejściowe 0,95 USD/MTok, a dane wyjściowe 4,00 USD/MTok; w przypadku Kimi K2.5
trafienie w pamięci podręcznej kosztuje 0,10 USD/MTok, dane wejściowe 0,60 USD/MTok, a dane wyjściowe 3,00 USD/MTok. Pozostałe pozycje katalogu
zachowują symbole zastępcze zerowych kosztów, chyba że zastąpisz je w konfiguracji.

Kimi K2.7 Code zawsze używa natywnego rozumowania. OpenClaw udostępnia dla tego modelu wyłącznie stan rozumowania `on`
i pomija wychodzące pola `thinking` oraz
`reasoning_effort`, zgodnie z wymaganiami Moonshot. Pomija również nadpisania parametrów
próbkowania (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), które K2.7 ustala na wartości domyślne dostawcy. Kimi K2.6 pozostaje
modelem domyślnym podczas konfiguracji początkowej.

## Pierwsze kroki

Zarówno Moonshot, jak i Kimi Coding są zewnętrznymi pluginami — zainstaluj jeden z nich przed
konfiguracją początkową.

<Tabs>
  <Tab title="Moonshot API">
    **Najlepsze zastosowanie:** modele Kimi K2 za pośrednictwem Moonshot Open Platform.

    <Steps>
      <Step title="Zainstaluj plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Wybierz region punktu końcowego">
        | Wybór uwierzytelniania | Punkt końcowy                  | Region        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Międzynarodowy |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Chiny         |
      </Step>
      <Step title="Uruchom konfigurację początkową">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Lub dla chińskiego punktu końcowego:

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
      <Step title="Sprawdź dostępność modeli">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Uruchom test dymny na żywo">
        Użyj odizolowanego katalogu stanu, jeśli chcesz sprawdzić dostęp do modelu i śledzenie
        kosztów bez modyfikowania zwykłych sesji:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Odpowiedź JSON powinna zawierać `provider: "moonshot"` oraz
        `model: "kimi-k2.6"`. Wpis transkrypcji asystenta przechowuje znormalizowane
        użycie tokenów wraz z szacowanym kosztem w `usage.cost`, gdy Moonshot zwraca
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
    **Najlepsze zastosowanie:** zadania ukierunkowane na kod za pośrednictwem punktu końcowego Kimi Coding.

    <Note>
    Kimi Coding używa innego klucza API i prefiksu dostawcy (`kimi/...`) niż Moonshot (`moonshot/...`). Stabilne odwołanie do modelu to `kimi/kimi-for-coding`; starsze odwołania `kimi/kimi-code` i `kimi/k2p5` pozostają akceptowane i są normalizowane do tego identyfikatora modelu.
    </Note>

    <Steps>
      <Step title="Zainstaluj plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Uruchom konfigurację początkową">
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
      <Step title="Sprawdź dostępność modelu">
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

Plugin Moonshot rejestruje również **Kimi** jako dostawcę `web_search`, wykorzystującego wyszukiwanie internetowe Moonshot.

<Steps>
  <Step title="Uruchom interaktywną konfigurację wyszukiwania internetowego">
    ```bash
    openclaw configure --section web
    ```

    Wybierz **Kimi** w sekcji wyszukiwania internetowego, aby zapisać
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Skonfiguruj region i model wyszukiwania internetowego">
    Interaktywna konfiguracja wyświetla monity dotyczące następujących ustawień:

    | Ustawienie                   | Opcje                                                              |
    | ---------------------------- | ------------------------------------------------------------------ |
    | Region API                   | `https://api.moonshot.ai/v1` (międzynarodowy) lub `https://api.moonshot.cn/v1` (Chiny) |
    | Model wyszukiwania internetowego | Domyślnie `kimi-k2.6`                                           |

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
  <Accordion title="Natywny tryb rozumowania">
    Kimi K2.7 Code zawsze używa natywnego rozumowania. Moonshot wymaga od klientów
    pominięcia pola `thinking` dla tego modelu, dlatego OpenClaw udostępnia wyłącznie `on` i
    ignoruje nieaktualne ustawienia `off`. K2.7 ustala również wartości `temperature`, `top_p`, `n`,
    `presence_penalty` oraz `frequency_penalty`; OpenClaw pomija skonfigurowane
    nadpisania tych pól.

    Inne modele Moonshot Kimi obsługują binarne natywne rozumowanie:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Skonfiguruj je osobno dla każdego modelu za pomocą `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw mapuje poziomy `/think` środowiska uruchomieniowego dla tych modeli:

    | Poziom `/think`       | Zachowanie Moonshot        |
    | --------------------- | -------------------------- |
    | `/think off`          | `thinking.type=disabled`   |
    | Dowolny poziom inny niż off | `thinking.type=enabled` |

    <Warning>
    Gdy rozumowanie Moonshot jest włączone, `tool_choice` musi mieć wartość `auto` albo `none`. Przypięty wybór narzędzia (`type: "tool"` albo `type: "function"`) wymusza zamiast tego powrót rozumowania do stanu `disabled`, dzięki czemu żądane narzędzie nadal zostanie uruchomione; wartość `tool_choice: "required"` jest natomiast normalizowana do `auto`. Dotyczy to każdego modelu Moonshot z wyjątkiem Kimi K2.7 Code, którego trybu rozumowania nie można wyłączyć — w przypadku niezgodności jego wartość `tool_choice` jest normalizowana do `auto`.
    </Warning>

    Kimi K2.6 akceptuje również opcjonalne pole `thinking.keep`, które kontroluje
    zachowywanie `reasoning_content` między wieloma turami. Ustaw je na `"all"`, aby zachować pełne
    rozumowanie między turami; pomiń je (lub pozostaw jako `null`), aby użyć
    domyślnej strategii serwera. OpenClaw przekazuje `thinking.keep` wyłącznie dla
    `moonshot/kimi-k2.6` i usuwa je w przypadku innych modeli. Kimi K2.7 Code
    domyślnie zachowuje pełną historię rozumowania, natomiast OpenClaw pomija całe
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

  <Accordion title="Tool call id sanitization">
    Moonshot Kimi udostępnia natywne identyfikatory tool_call w formacie `functions.<name>:<index>`. OpenClaw zachowuje pierwsze wystąpienie każdego natywnego identyfikatora Kimi, a późniejsze duplikaty zastępuje deterministycznymi identyfikatorami `call_*` w stylu OpenAI. Odpowiadające im wyniki narzędzi są ponownie mapowane przy użyciu tego samego identyfikatora, dzięki czemu odtwarzanie pozostaje jednoznaczne bez usuwania pierwszego natywnego identyfikatora Kimi. To zachowanie jest wbudowane w dołączonego dostawcę Moonshot i nie stanowi ustawienia konfigurowalnego przez użytkownika.
  </Accordion>

  <Accordion title="Streaming usage compatibility">
    Natywne punkty końcowe Moonshot (`https://api.moonshot.ai/v1` oraz
    `https://api.moonshot.cn/v1`) deklarują zgodność ze strumieniowym raportowaniem użycia.
    OpenClaw rozpoznaje ją na podstawie hosta punktu końcowego, a nie identyfikatora dostawcy, dlatego niestandardowy
    identyfikator dostawcy wskazujący ten sam natywny host Moonshot dziedziczy takie samo
    zachowanie strumieniowego raportowania użycia.

    Przy katalogowych cenach K2.6 strumieniowe dane o użyciu, które obejmują tokeny wejściowe, wyjściowe
    i odczytane z pamięci podręcznej, są również przeliczane na lokalnie szacowany koszt w USD dla
    `/status`, `/usage full`, `/usage cost` oraz rozliczania sesji
    na podstawie transkrypcji.

  </Accordion>

  <Accordion title="Endpoint and model ref reference">
    | Dostawca   | Prefiks odwołania do modelu | Punkt końcowy                  | Zmienna środowiskowa uwierzytelniania |
    | ---------- | --------------------------- | ------------------------------ | ------------------------------------- |
    | Moonshot   | `moonshot/`                 | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`                    |
    | Moonshot CN| `moonshot/`                 | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`                    |
    | Kimi Coding| `kimi/`                     | Punkt końcowy Kimi Coding     | `KIMI_API_KEY`                        |
    | Wyszukiwanie w sieci | Nie dotyczy       | Taki sam jak region API Moonshot | `KIMI_API_KEY` lub `MOONSHOT_API_KEY` |

    - Wyszukiwanie Kimi w sieci używa `KIMI_API_KEY` lub `MOONSHOT_API_KEY`, a domyślnie korzysta z `https://api.moonshot.ai/v1` z modelem `kimi-k2.6`.
    - W razie potrzeby zastąp ceny oraz metadane kontekstu w `models.providers`.
    - Jeśli Moonshot opublikuje inne limity kontekstu dla modelu, odpowiednio dostosuj `contextWindow`.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli oraz zachowania przełączania awaryjnego.
  </Card>
  <Card title="Web search" href="/pl/tools/web" icon="magnifying-glass">
    Konfigurowanie dostawców wyszukiwania w sieci, w tym Kimi.
  </Card>
  <Card title="Configuration reference" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji dostawców, modeli i pluginów.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Zarządzanie kluczami API Moonshot i dokumentacja.
  </Card>
</CardGroup>
