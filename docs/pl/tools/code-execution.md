---
read_when:
    - Chcesz włączyć lub skonfigurować code_execution
    - Chcesz przeprowadzić zdalną analizę bez dostępu do lokalnej powłoki
    - Chcesz połączyć x_search lub web_search ze zdalną analizą w Pythonie
summary: 'code_execution: uruchamianie zdalnej analizy w języku Python w środowisku izolowanym za pomocą xAI'
title: Wykonywanie kodu
x-i18n:
    generated_at: "2026-07-12T15:44:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` uruchamia zdalną analizę w języku Python w środowisku izolowanym za pośrednictwem interfejsu Responses API firmy xAI
(`https://api.x.ai/v1/responses`, tego samego punktu końcowego, którego używa `x_search`). Jest
rejestrowane przez dołączony plugin `xai` zgodnie z kontraktem `tools`.

<Warning>
  `code_execution` działa na serwerach xAI. xAI nalicza 5 USD za 1000 wywołań narzędzia
  oraz opłaty za tokeny wejściowe i wyjściowe modelu.
</Warning>

| Właściwość              | Wartość                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| Nazwa narzędzia         | `code_execution`                                                                  |
| Plugin dostawcy         | `xai` (dołączony, `enabledByDefault: true`)                                       |
| Uwierzytelnianie        | profil uwierzytelniania xAI, `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` |
| Model domyślny          | `grok-4.3`                                                                        |
| Domyślny limit czasu    | 30 sekund                                                                         |
| Domyślne `maxTurns`     | nieustawione (xAI stosuje własny limit wewnętrzny)                                |

Używaj go do obliczeń, zestawień tabelarycznych, szybkich statystyk i analiz
w formie wykresów, w tym do danych zwracanych przez `x_search` lub `web_search`. Nie ma
dostępu do plików lokalnych, powłoki, repozytorium ani sparowanych urządzeń i nie
zachowuje stanu między wywołaniami, dlatego każde wywołanie należy traktować jako analizę tymczasową, a nie
sesję notatnika. Aby uzyskać aktualne dane z X, najpierw uruchom [`x_search`](/pl/tools/web#x_search)
i przekaż jego wynik.

Do wykonywania lokalnego użyj zamiast tego [`exec`](/pl/tools/exec).

## Konfiguracja

<Steps>
  <Step title="Podaj dane uwierzytelniające xAI">
    OAuth wymaga odpowiedniej subskrypcji SuperGrok lub X Premium
    (weryfikacja za pomocą kodu urządzenia, dzięki czemu działa na hostach zdalnych bez
    wywołania zwrotnego do hosta lokalnego):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Podczas nowej instalacji ten sam wybór jest dostępny we wdrażaniu początkowym:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Możesz też użyć klucza API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Lub konfiguracji:

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

    Każda z tych trzech metod obsługuje również `x_search` i `web_search` modelu Grok.

  </Step>

  <Step title="Włącz i dostosuj code_execution">
    Jeśli `enabled` zostanie pominięte, `code_execution` jest udostępniane tylko wtedy, gdy dostawcą aktywnego
    modelu jest `xai` i można uzyskać dane uwierzytelniające xAI. W przypadku aktywnego modelu
    ze znanym dostawcą innym niż xAI ustaw
    `plugins.entries.xai.config.codeExecution.enabled` na `true`, aby włączyć
    używanie między dostawcami. Jeśli brakuje dostawcy aktywnego modelu lub nie można go ustalić,
    narzędzie pozostaje ukryte. Ustaw `enabled` na `false`, aby wyłączyć je dla każdego
    dostawcy. Dane uwierzytelniające xAI są zawsze wymagane.

    Użyj tego samego bloku, aby zastąpić model, limit tur lub limit czasu:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // wymagane dla znanego dostawcy modelu innego niż xAI
                model: "grok-4.3", // zastępuje domyślny model xAI do wykonywania kodu
                maxTurns: 2,            // opcjonalny limit wewnętrznych tur narzędzia
                timeoutSeconds: 30,     // limit czasu żądania (domyślnie: 30)
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

    `code_execution` pojawi się na liście narzędzi agenta, gdy plugin xAI
    zarejestruje się ponownie i powyższe kontrole dostawcy, włączenia oraz uwierzytelniania zakończą się pomyślnie.

  </Step>
</Steps>

## Sposób użycia

Wyraźnie określ cel analizy; narzędzie przyjmuje jeden parametr `task`,
dlatego prześlij pełne żądanie oraz wszystkie dane wbudowane w jednym poleceniu:

```text
Użyj code_execution, aby obliczyć 7-dniową średnią kroczącą dla tych liczb: ...
```

```text
Użyj x_search, aby znaleźć wpisy wspominające OpenClaw w tym tygodniu, a następnie użyj code_execution, aby policzyć je według dni.
```

```text
Użyj web_search, aby zebrać najnowsze wyniki testów porównawczych AI, a następnie użyj code_execution, aby porównać zmiany procentowe.
```

## Błędy

Bez uwierzytelniania narzędzie zwraca ustrukturyzowany błąd JSON (zamiast zgłaszać
wyjątek), dzięki czemu agent może samodzielnie skorygować działanie:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution wymaga danych uwierzytelniających xAI. Uruchom `openclaw onboard --auth-choice xai-oauth`, aby zalogować się za pomocą Grok, uruchom `openclaw onboard --auth-choice xai-api-key`, ustaw `XAI_API_KEY` w środowisku Gateway lub skonfiguruj `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Powiązane

<CardGroup cols={2}>
  <Card title="Narzędzie Exec" href="/pl/tools/exec" icon="terminal">
    Lokalne wykonywanie poleceń powłoki na Twoim komputerze lub sparowanym węźle.
  </Card>
  <Card title="Zatwierdzanie Exec" href="/pl/tools/exec-approvals" icon="shield">
    Zasady zezwalania na wykonywanie poleceń powłoki lub jego odmawiania.
  </Card>
  <Card title="Narzędzia internetowe" href="/pl/tools/web" icon="globe">
    `web_search`, `x_search` i `web_fetch`.
  </Card>
  <Card title="Dostawca xAI" href="/pl/providers/xai" icon="microchip">
    Modele Grok, wyszukiwanie w internecie i X oraz konfiguracja wykonywania kodu.
  </Card>
</CardGroup>
