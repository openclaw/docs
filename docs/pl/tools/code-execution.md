---
read_when:
    - Chcesz włączyć lub skonfigurować code_execution
    - Chcesz przeprowadzać zdalną analizę bez dostępu do lokalnej powłoki
    - Chcesz połączyć x_search lub web_search ze zdalną analizą w Pythonie
summary: 'code_execution: uruchom izolowaną zdalną analizę w Pythonie z xAI'
title: Wykonywanie kodu
x-i18n:
    generated_at: "2026-06-27T18:25:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` uruchamia zdalną analizę w Pythonie w piaskownicy w Responses API xAI. Jest rejestrowane przez dołączony Plugin `xai` (w ramach kontraktu `tools`) i wysyła żądania do tego samego punktu końcowego `https://api.x.ai/v1/responses`, którego używa `x_search`.

| Właściwość          | Wartość                                                                           |
| ------------------- | --------------------------------------------------------------------------------- |
| Nazwa narzędzia     | `code_execution`                                                                  |
| Plugin dostawcy     | `xai` (dołączony, `enabledByDefault: true`)                                       |
| Uwierzytelnianie    | profil uwierzytelniania xAI, `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` |
| Domyślny model      | `grok-4-1-fast`                                                                   |
| Domyślny limit czasu | 30 sekund                                                                        |
| Domyślne `maxTurns` | nieustawione (xAI stosuje własny limit wewnętrzny)                                |

Różni się to od lokalnego [`exec`](/pl/tools/exec):

- `exec` uruchamia polecenia powłoki na Twojej maszynie lub sparowanym węźle.
- `code_execution` uruchamia Pythona w zdalnej piaskownicy xAI.

Używaj `code_execution` do:

- Obliczeń.
- Tabelaryzacji.
- Szybkich statystyk.
- Analizy w stylu wykresów.
- Analizowania danych zwróconych przez `x_search` lub `web_search`.

**Nie** używaj go, gdy potrzebujesz plików lokalnych, swojej powłoki, swojego repozytorium lub sparowanych urządzeń. Do tego użyj [`exec`](/pl/tools/exec).

## Konfiguracja

<Steps>
  <Step title="Podaj dane logowania xAI">
    Zaloguj się przez OAuth Grok przy użyciu kwalifikującej się subskrypcji SuperGrok lub X Premium
    albo zapisz klucz API. OAuth xAI używa weryfikacji kodem urządzenia, więc działa
    ze zdalnych hostów bez wywołania zwrotnego localhost. OAuth działa dla
    `code_execution` i `x_search`; `XAI_API_KEY` lub konfiguracja wyszukiwania web w Pluginie
    może również zasilać Grok `web_search`.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Podczas świeżej instalacji te same opcje uwierzytelniania są dostępne w
    onboardingu:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Albo użyj klucza API:

    ```bash
    openclaw models auth login --provider xai --method api-key
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
    `code_execution` jest dostępne, gdy dostępne są dane logowania xAI. Ustaw
    `plugins.entries.xai.config.codeExecution.enabled` na `false`, aby je wyłączyć,
    albo użyj tego samego bloku, aby dostroić model i limit czasu.

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

    `code_execution` pojawia się na liście narzędzi agenta, gdy Plugin xAI ponownie zarejestruje się z `enabled: true`.

  </Step>
</Steps>

## Jak go używać

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

Narzędzie wewnętrznie przyjmuje pojedynczy parametr `task`, więc agent powinien wysłać pełną prośbę o analizę i wszystkie dane inline w jednym prompcie.

## Błędy

Gdy narzędzie działa bez uwierzytelniania, zwraca ustrukturyzowany błąd `missing_xai_api_key`, wskazując opcje profilu uwierzytelniania, zmiennej środowiskowej i konfiguracji. Błąd jest JSON-em, a nie rzuconym wyjątkiem, więc agent może sam się poprawić:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Limity

- To jest zdalne wykonywanie xAI, a nie wykonywanie lokalnego procesu.
- Traktuj wyniki jako efemeryczną analizę, a nie trwałą sesję notatnika.
- Nie zakładaj dostępu do plików lokalnych ani swojego obszaru roboczego.
- Aby uzyskać świeże dane X, najpierw użyj [`x_search`](/pl/tools/web#x_search), a następnie przekaż wynik do `code_execution`.

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie exec" href="/pl/tools/exec" icon="terminal">
    Lokalne wykonywanie powłoki na Twojej maszynie lub sparowanym węźle.
  </Card>
  <Card title="Zatwierdzenia exec" href="/pl/tools/exec-approvals" icon="shield">
    Zasady zezwalania/odmawiania dla wykonywania powłoki.
  </Card>
  <Card title="Narzędzia web" href="/pl/tools/web" icon="globe">
    `web_search`, `x_search` i `web_fetch`.
  </Card>
  <Card title="Dostawca xAI" href="/pl/providers/xai" icon="microchip">
    Modele Grok, wyszukiwanie web/X i konfiguracja wykonywania kodu.
  </Card>
</CardGroup>
