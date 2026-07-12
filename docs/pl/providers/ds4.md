---
read_when:
    - Chcesz uruchomić OpenClaw z antirez/ds4
    - Chcesz lokalny backend DeepSeek V4 Flash z wywołaniami narzędzi
    - Potrzebujesz konfiguracji OpenClaw dla ds4-server
summary: Uruchom OpenClaw przez ds4, lokalny serwer DeepSeek V4 Flash zgodny z OpenAI
title: ds4
x-i18n:
    generated_at: "2026-07-12T15:29:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) udostępnia DeepSeek V4 Flash z lokalnego
backendu Metal za pośrednictwem interfejsu API `/v1` zgodnego z OpenAI. OpenClaw łączy się z ds4
przez ogólną rodzinę dostawców `openai-completions`.

ds4 nie jest dołączonym Pluginem dostawcy OpenClaw. Skonfiguruj go w
`models.providers.ds4`, a następnie wybierz `ds4/deepseek-v4-flash`.

| Właściwość          | Wartość                                                   |
| ------------------- | --------------------------------------------------------- |
| Identyfikator dostawcy | `ds4`                                                  |
| Plugin              | brak (tylko konfiguracja)                                 |
| API                 | Chat Completions zgodne z OpenAI (`openai-completions`)   |
| Bazowy adres URL    | `http://127.0.0.1:18000/v1` (sugerowany)                  |
| Identyfikator modelu | `deepseek-v4-flash`                                      |
| Wywołania narzędzi  | `tools` / `tool_calls` w stylu OpenAI                     |
| Rozumowanie         | `thinking` i `reasoning_effort` w stylu DeepSeek          |

## Wymagania

- macOS z obsługą Metal.
- Działająca kopia robocza ds4 z `ds4-server` oraz plikiem GGUF DeepSeek V4 Flash.
- Wystarczająca ilość pamięci dla wybranego kontekstu; większe wartości `--ctx` przydzielają więcej
  pamięci KV podczas uruchamiania serwera.

<Warning>
Tury agenta OpenClaw zawierają schematy narzędzi i kontekst przestrzeni roboczej. Mały kontekst,
taki jak `--ctx 4096`, może przejść bezpośrednie testy curl, ale powodować niepowodzenie pełnych uruchomień agenta
z błędem `500 prompt exceeds context`. Do testów dymnych agenta i narzędzi używaj co najmniej
`--ctx 32768`. Wartości `--ctx 393216` używaj tylko przy wystarczającej ilości pamięci oraz w celu włączenia
Think Max w ds4.
</Warning>

## Szybki start

<Steps>
  <Step title="Start ds4-server">
    Zastąp `<DS4_DIR>` ścieżką do swojej kopii roboczej ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    Odpowiedź powinna zawierać `deepseek-v4-flash`.

  </Step>
  <Step title="Add the OpenClaw provider config">
    Dodaj konfigurację z sekcji [Pełna konfiguracja](#full-config), a następnie uruchom jednorazowe
    sprawdzenie modelu:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## Pełna konfiguracja

Użyj tej konfiguracji, gdy ds4 jest już uruchomiony pod adresem `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

Utrzymuj `contextWindow` zgodne z `ds4-server --ctx`. Utrzymuj `maxTokens` zgodne
z `--tokens`, chyba że celowo chcesz, aby OpenClaw żądał mniejszej ilości danych wyjściowych
niż domyślna wartość serwera.

## Uruchamianie na żądanie

OpenClaw może uruchamiać ds4 tylko wtedy, gdy wybrany jest model `ds4/...`. Dodaj
`localService` do tego samego wpisu dostawcy:

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` musi być bezwzględną ścieżką do pliku wykonywalnego. Wyszukiwanie przez powłokę ani rozwijanie `~`
nie są używane. Opis wszystkich pól `localService` znajdziesz w sekcji
[Lokalne usługi modeli](/pl/gateway/local-model-services).

## Think Max

ds4 stosuje Think Max tylko wtedy, gdy oba warunki są spełnione:

- `ds4-server` uruchamia się z wartością `--ctx 393216` lub większą.
- Żądanie używa `reasoning_effort: "max"` (lub równoważnego pola poziomu wysiłku ds4).

Jeśli używasz tak dużego kontekstu, zaktualizuj zarówno flagi serwera, jak i metadane modelu
OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## Test

Bezpośrednie sprawdzenie HTTP z pominięciem OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Trasowanie modelu OpenClaw (takie samo jak sprawdzenie w sekcji Szybki start):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Pełny test dymny agenta i wywołań narzędzi z kontekstem wynoszącym co najmniej 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

Oczekiwany wynik:

- `executionTrace.winnerProvider` ma wartość `ds4`
- `executionTrace.winnerModel` ma wartość `deepseek-v4-flash`
- `toolSummary.calls` wynosi co najmniej `1`
- `finalAssistantVisibleText` zaczyna się od `tool-ok`

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 nie jest uruchomiony albo nie nasłuchuje na hoście lub porcie określonym w `baseUrl`. Uruchom
    `ds4-server`, a następnie spróbuj ponownie:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Skonfigurowana wartość `--ctx` jest zbyt mała dla tury OpenClaw. Zwiększ
    `ds4-server --ctx`, a następnie odpowiednio zaktualizuj `models.providers.ds4.models[].contextWindow`.
    Pełne tury agenta z narzędziami wymagają znacznie większego kontekstu niż bezpośrednie
    żądanie curl z pojedynczą wiadomością.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 używa Think Max tylko wtedy, gdy `--ctx` wynosi co najmniej `393216`, a żądanie
    określa `reasoning_effort: "max"`. Mniejsze konteksty powodują powrót do wysokiego
    poziomu rozumowania.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 ma fazę początkowego umieszczania w pamięci Metal i rozgrzewania modelu. Ustaw
    `localService.readyTimeoutMs: 300000`, gdy OpenClaw uruchamia serwer
    na żądanie.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Local model services" href="/pl/gateway/local-model-services" icon="play">
    Uruchamiaj lokalne serwery modeli na żądanie przed żądaniami do modeli.
  </Card>
  <Card title="Local models" href="/pl/gateway/local-models" icon="server">
    Wybieraj i obsługuj lokalne backendy modeli.
  </Card>
  <Card title="Model providers" href="/pl/concepts/model-providers" icon="layers">
    Konfiguruj odwołania do dostawców, uwierzytelnianie i przełączanie awaryjne.
  </Card>
  <Card title="DeepSeek" href="/pl/providers/deepseek" icon="brain">
    Natywne zachowanie dostawcy DeepSeek i ustawienia sterujące myśleniem.
  </Card>
</CardGroup>
