---
read_when:
    - Potrzebujesz jednego klucza API do wielu LLM-ów
    - Chcesz uruchamiać modele za pośrednictwem Kilo Gateway w OpenClaw
summary: Użyj ujednoliconego interfejsu API Kilo Gateway, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:59:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway zapewnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość OpenAI SDK działa po zmianie bazowego URL.

| Właściwość | Wartość                            |
| ---------- | ---------------------------------- |
| Dostawca   | `kilocode`                         |
| Uwierzytelnianie | `KILOCODE_API_KEY`           |
| API        | Zgodne z OpenAI                    |
| Bazowy URL | `https://api.kilo.ai/api/gateway/` |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz konto">
    Przejdź do [app.kilo.ai](https://app.kilo.ai), zaloguj się lub utwórz konto, następnie przejdź do API Keys i wygeneruj nowy klucz.
  </Step>
  <Step title="Uruchom wdrożenie">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Albo ustaw zmienną środowiskową bezpośrednio:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model domyślny

Domyślnym modelem jest `kilocode/kilo/auto`, należący do dostawcy model
inteligentnego routingu zarządzany przez Kilo Gateway.

<Note>
OpenClaw traktuje `kilocode/kilo/auto` jako stabilną domyślną referencję, ale nie
publikuje opartego na źródłach mapowania zadań na modele nadrzędne dla tej trasy. Dokładny
routing nadrzędny za `kilocode/kilo/auto` należy do Kilo Gateway i nie jest
zakodowany na stałe w OpenClaw.
</Note>

## Wbudowany katalog

OpenClaw dynamicznie wykrywa dostępne modele z Kilo Gateway podczas uruchamiania. Użyj
`/models kilocode`, aby zobaczyć pełną listę modeli dostępnych na Twoim koncie.

Każdy model dostępny w gateway może być używany z prefiksem `kilocode/`:

| Referencja modelu                      | Uwagi                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Domyślny — inteligentny routing    |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic przez Kilo               |
| `kilocode/openai/gpt-5.5`              | OpenAI przez Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google przez Kilo                  |
| ...i wiele więcej                      | Użyj `/models kilocode`, aby wyświetlić wszystkie |

<Tip>
Podczas uruchamiania OpenClaw wysyła zapytanie `GET https://api.kilo.ai/api/gateway/models` i scala
wykryte modele przed statycznym katalogiem awaryjnym. Dołączony katalog awaryjny zawsze
zawiera `kilocode/kilo/auto` (`Kilo Auto`) z `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` oraz `maxTokens: 128000`.
</Tip>

## Przykład konfiguracji

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport i zgodność">
    Kilo Gateway jest udokumentowany w źródle jako zgodny z OpenRouter, więc pozostaje na
    ścieżce zgodnej z OpenAI w stylu proxy, zamiast używać natywnego kształtowania żądań OpenAI.

    - Referencje Kilo oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje
      tam oczyszczanie sygnatur myśli Gemini bez włączania natywnej walidacji
      odtwarzania Gemini ani przepisywania bootstrapu.
    - Kilo Gateway używa tokena Bearer z Twoim kluczem API pod spodem.

  </Accordion>

  <Accordion title="Wrapper strumienia i rozumowanie">
    Wspólny wrapper strumienia Kilo dodaje nagłówek aplikacji dostawcy i normalizuje
    ładunki rozumowania proxy dla obsługiwanych konkretnych referencji modeli.

    <Warning>
    `kilocode/kilo/auto` i inne wskazówki nieobsługujące rozumowania proxy pomijają wstrzykiwanie
    rozumowania. Jeśli potrzebujesz obsługi rozumowania, użyj konkretnej referencji modelu, takiej jak
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli wykrywanie modeli nie powiedzie się podczas uruchamiania, OpenClaw wraca do dołączonego statycznego katalogu zawierającego `kilocode/kilo/auto`.
    - Potwierdź, że Twój klucz API jest prawidłowy i że Twoje konto Kilo ma włączone żądane modele.
    - Gdy Gateway działa jako demon, upewnij się, że `KILOCODE_API_KEY` jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel Kilo Gateway, klucze API i zarządzanie kontem.
  </Card>
</CardGroup>
