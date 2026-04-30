---
read_when:
    - Chcesz włączyć lub skonfigurować code_execution
    - Chcesz zdalnej analizy bez lokalnego dostępu do powłoki
    - Chcesz połączyć x_search lub web_search ze zdalną analizą w Pythonie
summary: code_execution -- uruchom zdalną analizę w Pythonie w izolowanym środowisku z xAI
title: Wykonywanie kodu
x-i18n:
    generated_at: "2026-04-30T10:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` uruchamia sandboxowaną zdalną analizę w Pythonie w Responses API firmy xAI.
Różni się to od lokalnego [`exec`](/pl/tools/exec):

- `exec` uruchamia polecenia powłoki na Twojej maszynie lub węźle
- `code_execution` uruchamia Pythona w zdalnym sandboxie xAI

Używaj `code_execution` do:

- obliczeń
- tworzenia tabel
- szybkich statystyk
- analizy typu wykresowego
- analizowania danych zwróconych przez `x_search` lub `web_search`

**Nie** używaj go, gdy potrzebujesz plików lokalnych, swojej powłoki, repozytorium lub sparowanych
urządzeń. Do tego użyj [`exec`](/pl/tools/exec).

## Konfiguracja

Potrzebujesz klucza API xAI. Działa dowolna z tych opcji:

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

## Jak go używać

Pytaj naturalnie i wyraźnie określ zamiar analizy:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Narzędzie przyjmuje wewnętrznie pojedynczy parametr `task`, więc agent powinien wysłać
pełne żądanie analizy oraz wszelkie dane w treści w jednym prompcie.

## Ograniczenia

- To jest zdalne wykonanie xAI, a nie lokalne wykonanie procesu.
- Należy je traktować jako tymczasową analizę, a nie trwały notatnik.
- Nie zakładaj dostępu do plików lokalnych ani do swojego obszaru roboczego.
- Aby uzyskać świeże dane z X, najpierw użyj [`x_search`](/pl/tools/web#x_search).

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Zatwierdzenia Exec](/pl/tools/exec-approvals)
- [Narzędzie apply_patch](/pl/tools/apply-patch)
- [Narzędzia webowe](/pl/tools/web)
- [xAI](/pl/providers/xai)
