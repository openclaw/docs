---
read_when:
    - Chcesz włączyć lub skonfigurować code_execution
    - Chcesz zdalnej analizy bez dostępu do lokalnej powłoki
    - Chcesz połączyć x_search lub web_search ze zdalną analizą w Pythonie
summary: 'code_execution: uruchom izolowaną zdalną analizę w Pythonie za pomocą xAI'
title: Wykonywanie kodu
x-i18n:
    generated_at: "2026-05-06T09:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` uruchamia analizę w Pythonie w izolowanym zdalnym środowisku na Responses API xAI. Jest rejestrowane przez dołączony Plugin `xai` (w ramach kontraktu `tools`) i wysyła żądania do tego samego endpointu `https://api.x.ai/v1/responses`, którego używa `x_search`.

| Właściwość          | Wartość                                                        |
| ------------------- | -------------------------------------------------------------- |
| Nazwa narzędzia     | `code_execution`                                               |
| Plugin dostawcy     | `xai` (dołączony, `enabledByDefault: true`)                    |
| Uwierzytelnianie    | `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` |
| Model domyślny      | `grok-4-1-fast`                                                |
| Domyślny limit czasu | 30 sekund                                                     |
| Domyślne `maxTurns` | nieustawione (xAI stosuje własny limit wewnętrzny)             |

Różni się to od lokalnego [`exec`](/pl/tools/exec):

- `exec` uruchamia polecenia powłoki na Twoim komputerze lub sparowanym węźle.
- `code_execution` uruchamia Pythona w zdalnym sandboxie xAI.

Używaj `code_execution` do:

- Obliczeń.
- Tworzenia tabel.
- Szybkich statystyk.
- Analiz w stylu wykresów.
- Analizowania danych zwróconych przez `x_search` lub `web_search`.

**Nie** używaj go, gdy potrzebujesz plików lokalnych, swojej powłoki, swojego repozytorium lub sparowanych urządzeń. Do tego użyj [`exec`](/pl/tools/exec).

## Konfiguracja

<Steps>
  <Step title="Podaj klucz API xAI">
    Ustaw `XAI_API_KEY` w środowisku Gateway albo skonfiguruj klucz w Pluginie xAI, aby te same dane uwierzytelniające obejmowały `code_execution`, `x_search`, wyszukiwanie w sieci i inne narzędzia xAI:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Albo przez konfigurację:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Włącz i dostrój code_execution">
    Narzędzie jest kontrolowane przez `plugins.entries.xai.config.codeExecution.enabled`. Domyślnie jest wyłączone.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Uruchom ponownie Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` pojawi się na liście narzędzi agenta, gdy Plugin xAI ponownie zarejestruje się z `enabled: true`.

  </Step>
</Steps>

## Jak go używać

Pytaj naturalnie i jasno określ cel analizy:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Narzędzie wewnętrznie przyjmuje jeden parametr `task`, więc agent powinien wysłać pełne żądanie analizy oraz wszelkie dane wbudowane w jednym prompcie.

## Błędy

Gdy narzędzie działa bez uwierzytelniania, zwraca ustrukturyzowany błąd `missing_xai_api_key`, wskazujący zmienną środowiskową i ścieżkę konfiguracji. Błąd jest JSON-em, a nie zgłoszonym wyjątkiem, więc agent może samodzielnie go poprawić:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limity

- To jest zdalne wykonywanie xAI, a nie lokalne wykonywanie procesu.
- Traktuj wyniki jako efemeryczną analizę, a nie trwałą sesję notatnika.
- Nie zakładaj dostępu do plików lokalnych ani swojego obszaru roboczego.
- Dla świeżych danych z X najpierw użyj [`x_search`](/pl/tools/web#x_search), a następnie przekaż wynik do `code_execution`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie Exec" href="/pl/tools/exec" icon="terminal">
    Lokalne wykonywanie poleceń powłoki na Twoim komputerze lub sparowanym węźle.
  </Card>
  <Card title="Zatwierdzenia Exec" href="/pl/tools/exec-approvals" icon="shield">
    Zasady zezwalania/odmawiania dla wykonywania poleceń powłoki.
  </Card>
  <Card title="Narzędzia sieciowe" href="/pl/tools/web" icon="globe">
    `web_search`, `x_search` i `web_fetch`.
  </Card>
  <Card title="Dostawca xAI" href="/pl/providers/xai" icon="microchip">
    Modele Grok, wyszukiwanie w sieci/X i konfiguracja wykonywania kodu.
  </Card>
</CardGroup>
