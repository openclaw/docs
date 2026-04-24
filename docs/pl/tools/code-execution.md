---
read_when:
    - Chcesz włączyć lub skonfigurować `code_execution`
    - Chcesz zdalnej analizy bez lokalnego dostępu do shella
    - Chcesz połączyć `x_search` lub `web_search` ze zdalną analizą w Pythonie
summary: code_execution -- uruchamiaj sandboxowaną zdalną analizę w Pythonie z xAI
title: Wykonywanie kodu
x-i18n:
    generated_at: "2026-04-24T09:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
    source_path: tools/code-execution.md
    workflow: 15
---

`code_execution` uruchamia sandboxowaną zdalną analizę w Pythonie na Responses API xAI.
To różni się od lokalnego [`exec`](/pl/tools/exec):

- `exec` uruchamia polecenia shella na twojej maszynie lub Node
- `code_execution` uruchamia Python w zdalnym sandboxie xAI

Używaj `code_execution` do:

- obliczeń
- tabelaryzacji
- szybkich statystyk
- analiz w stylu wykresów
- analizowania danych zwróconych przez `x_search` lub `web_search`

**Nie** używaj tego, gdy potrzebujesz lokalnych plików, swojego shella, repozytorium lub sparowanych
urządzeń. Do tego używaj [`exec`](/pl/tools/exec).

## Konfiguracja

Potrzebujesz klucza API xAI. Każdy z tych wariantów działa:

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

Pisz naturalnie i jasno określ intencję analizy:

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
pełne żądanie analizy i wszelkie dane inline w jednym promptcie.

## Ograniczenia

- To jest zdalne wykonywanie xAI, a nie wykonywanie lokalnego procesu.
- Należy to traktować jako analizę efemeryczną, a nie trwały notebook.
- Nie zakładaj dostępu do lokalnych plików ani swojego obszaru roboczego.
- Dla świeżych danych X najpierw użyj [`x_search`](/pl/tools/web#x_search).

## Powiązane

- [Narzędzie Exec](/pl/tools/exec)
- [Zatwierdzenia Exec](/pl/tools/exec-approvals)
- [Narzędzie apply_patch](/pl/tools/apply-patch)
- [Narzędzia internetowe](/pl/tools/web)
- [xAI](/pl/providers/xai)
