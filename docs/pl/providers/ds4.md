---
read_when:
    - Chcesz uruchomić OpenClaw dla antirez/ds4
    - Chcesz lokalnego backendu DeepSeek V4 Flash z wywołaniami narzędzi
    - Potrzebujesz konfiguracji OpenClaw dla ds4-server
summary: Uruchom OpenClaw za pośrednictwem ds4, lokalnego serwera DeepSeek V4 Flash zgodnego z OpenAI
title: ds4
x-i18n:
    generated_at: "2026-06-27T18:11:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) udostępnia DeepSeek V4 Flash z lokalnego
backendu Metal przez zgodne z OpenAI API `/v1`. OpenClaw łączy się z ds4
przez ogólną rodzinę dostawców `openai-completions`.

ds4 nie jest dołączonym pluginem dostawcy OpenClaw. Skonfiguruj go pod
`models.providers.ds4`, a następnie wybierz `ds4/deepseek-v4-flash`.

- Identyfikator dostawcy: `ds4`
- Plugin: brak
- API: zgodne z OpenAI Chat Completions (`openai-completions`)
- Sugerowany bazowy adres URL: `http://127.0.0.1:18000/v1`
- Identyfikator modelu: `deepseek-v4-flash`
- Wywołania narzędzi: obsługiwane przez `tools` i `tool_calls` w stylu OpenAI
- Rozumowanie: `thinking` i `reasoning_effort` w stylu DeepSeek

## Wymagania

- macOS z obsługą Metal.
- Działający checkout ds4 z `ds4-server` i plikiem GGUF DeepSeek V4 Flash.
- Wystarczająca ilość pamięci dla wybranego kontekstu. Większe wartości `--ctx` alokują więcej
  pamięci KV podczas uruchamiania serwera.

<Warning>
Tury agenta OpenClaw zawierają schematy narzędzi i kontekst obszaru roboczego. Bardzo mały kontekst,
taki jak `--ctx 4096`, może przejść bezpośrednie testy curl, ale nie przejść pełnych uruchomień agenta z
`500 prompt exceeds context`. Użyj co najmniej `--ctx 32768` dla testów smoke agenta i narzędzi.
Używaj `--ctx 393216` tylko wtedy, gdy masz wystarczająco dużo pamięci i chcesz zachowania ds4
Think Max.
</Warning>

## Szybki start

<Steps>
  <Step title="Start ds4-server">
    Zastąp `<DS4_DIR>` ścieżką do swojego checkoutu ds4.

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

Użyj tej konfiguracji, gdy ds4 działa już na `127.0.0.1:18000`.

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

Utrzymuj `contextWindow` zgodne z wartością `ds4-server --ctx`. Utrzymuj `maxTokens`
zgodne z `--tokens`, chyba że celowo chcesz, aby OpenClaw żądał mniej
danych wyjściowych niż domyślne ustawienie serwera.

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

`command` musi być bezwzględną ścieżką do pliku wykonywalnego. Wyszukiwanie w powłoce i rozwijanie `~`
nie są używane. Zobacz [Lokalne usługi modeli](/pl/gateway/local-model-services), aby poznać każde
pole `localService`.

## Think Max

ds4 stosuje Think Max tylko wtedy, gdy oba warunki są spełnione:

- `ds4-server` uruchamia się z `--ctx 393216` lub wyższym.
- Żądanie używa `reasoning_effort: "max"` albo równoważnego pola effort ds4.

Jeśli uruchamiasz tak duży kontekst, zaktualizuj zarówno flagi serwera, jak i metadane modelu
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

Zacznij od bezpośredniego sprawdzenia HTTP:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

Następnie przetestuj routing modelu OpenClaw:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

Dla pełnego smoke testu agenta i wywołania narzędzia użyj kontekstu co najmniej 32768:

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

- `executionTrace.winnerProvider` to `ds4`
- `executionTrace.winnerModel` to `deepseek-v4-flash`
- `toolSummary.calls` wynosi co najmniej `1`
- `finalAssistantVisibleText` zaczyna się od `tool-ok`

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="curl /v1/models cannot connect">
    ds4 nie działa albo nie jest przypisany do hosta i portu w `baseUrl`. Uruchom
    `ds4-server`, a następnie spróbuj ponownie:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    Skonfigurowane `--ctx` jest zbyt małe dla tury OpenClaw. Zwiększ
    `ds4-server --ctx`, a następnie zaktualizuj `models.providers.ds4.models[].contextWindow`,
    aby pasowało. Pełne tury agenta z narzędziami potrzebują znacznie więcej kontekstu niż
    bezpośrednie jednowiadomościowe żądanie curl.
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 używa Think Max tylko wtedy, gdy `--ctx` wynosi co najmniej `393216`, a żądanie
    prosi o `reasoning_effort: "max"`. Mniejsze konteksty wracają do wysokiego
    poziomu rozumowania.
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 ma zimną fazę rezydencji Metal i rozgrzewania modelu. Użyj
    `localService.readyTimeoutMs: 300000`, gdy OpenClaw uruchamia serwer na
    żądanie.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Local model services" href="/pl/gateway/local-model-services" icon="play">
    Uruchamiaj lokalne serwery modeli na żądanie przed żądaniami modeli.
  </Card>
  <Card title="Local models" href="/pl/gateway/local-models" icon="server">
    Wybieraj i obsługuj lokalne backendy modeli.
  </Card>
  <Card title="Model providers" href="/pl/concepts/model-providers" icon="layers">
    Skonfiguruj referencje dostawców, uwierzytelnianie i przełączanie awaryjne.
  </Card>
  <Card title="DeepSeek" href="/pl/providers/deepseek" icon="brain">
    Natywne zachowanie dostawcy DeepSeek i kontrolki myślenia.
  </Card>
</CardGroup>
