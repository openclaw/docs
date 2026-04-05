---
read_when:
    - Chcesz włączyć lub skonfigurować code_execution
    - Chcesz wykonywać zdalną analizę bez lokalnego dostępu do powłoki
    - Chcesz połączyć x_search lub web_search ze zdalną analizą Pythona
summary: code_execution — uruchamianie zdalnej, sandboxowanej analizy Pythona z xAI
title: Code Execution
x-i18n:
    generated_at: "2026-04-05T14:07:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Code Execution

`code_execution` uruchamia zdalną, sandboxowaną analizę Pythona w API Responses xAI.
Różni się to od lokalnego [`exec`](/tools/exec):

- `exec` uruchamia polecenia powłoki na Twojej maszynie lub węźle
- `code_execution` uruchamia Pythona w zdalnym sandboxie xAI

Używaj `code_execution` do:

- obliczeń
- tabelaryzacji
- szybkiej statystyki
- analizy w stylu wykresów
- analizowania danych zwróconych przez `x_search` lub `web_search`

**Nie** używaj go, gdy potrzebujesz lokalnych plików, swojej powłoki, repozytorium lub sparowanych
urządzeń. W tym celu użyj [`exec`](/tools/exec).

## Konfiguracja

Potrzebujesz klucza API xAI. Działa dowolny z poniższych:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Przykład:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Jak tego używać

Pytaj naturalnie i jasno określ intencję analizy:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Narzędzie wewnętrznie przyjmuje pojedynczy parametr `task`, więc agent powinien wysłać
pełne żądanie analizy oraz wszelkie dane inline w jednym promptcie.

## Ograniczenia

- To zdalne wykonywanie xAI, a nie lokalne wykonywanie procesów.
- Należy traktować to jako analizę efemeryczną, a nie trwały notebook.
- Nie zakładaj dostępu do lokalnych plików ani swojego obszaru roboczego.
- Aby uzyskać świeże dane z X, najpierw użyj [`x_search`](/tools/web#x_search).

## Zobacz także

- [Narzędzia webowe](/tools/web)
- [Exec](/tools/exec)
- [xAI](/providers/xai)
