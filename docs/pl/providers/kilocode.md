---
read_when:
    - Chcesz mieć jeden klucz API do wielu LLM-ów
    - Chcesz uruchamiać modele za pośrednictwem Kilo Gateway w OpenClaw
summary: Użyj ujednoliconego API Kilo Gateway, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-30T10:13:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c51012b94d4b720795356b67c8482ae7ee0b37d401689e923be0b7732d77c4aa
    source_path: providers/kilocode.md
    workflow: 16
---

# Kilo Gateway

Kilo Gateway udostępnia **ujednolicone API**, które kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego URL.

| Właściwość | Wartość                            |
| ---------- | ---------------------------------- |
| Dostawca   | `kilocode`                         |
| Uwierzytelnianie | `KILOCODE_API_KEY`          |
| API        | Zgodne z OpenAI                    |
| Bazowy URL | `https://api.kilo.ai/api/gateway/` |

## Pierwsze kroki

<Steps>
  <Step title="Utwórz konto">
    Przejdź do [app.kilo.ai](https://app.kilo.ai), zaloguj się lub utwórz konto, a następnie przejdź do API Keys i wygeneruj nowy klucz.
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Możesz też ustawić zmienną środowiskową bezpośrednio:

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

## Domyślny model

Domyślny model to `kilocode/kilo/auto`, należący do dostawcy model inteligentnego routingu
zarządzany przez Kilo Gateway.

<Note>
OpenClaw traktuje `kilocode/kilo/auto` jako stabilną domyślną referencję, ale nie
publikuje opartego na źródłach mapowania zadań na modele nadrzędne dla tej trasy. Dokładny
routing nadrzędny za `kilocode/kilo/auto` należy do Kilo Gateway i nie jest
zakodowany na stałe w OpenClaw.
</Note>

## Wbudowany katalog

OpenClaw dynamicznie wykrywa dostępne modele z Kilo Gateway podczas uruchamiania. Użyj
`/models kilocode`, aby zobaczyć pełną listę modeli dostępnych na Twoim koncie.

Każdego modelu dostępnego w Gateway można używać z prefiksem `kilocode/`:

| Referencja modelu                      | Uwagi                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | Domyślny — inteligentny routing    |
| `kilocode/anthropic/claude-sonnet-4`   | Anthropic przez Kilo               |
| `kilocode/openai/gpt-5.5`              | OpenAI przez Kilo                  |
| `kilocode/google/gemini-3-pro-preview` | Google przez Kilo                  |
| ...i wiele więcej                      | Użyj `/models kilocode`, aby wyświetlić wszystkie |

<Tip>
Podczas uruchamiania OpenClaw odpytuje `GET https://api.kilo.ai/api/gateway/models` i scala
wykryte modele przed statycznym katalogiem awaryjnym. Dołączony katalog awaryjny zawsze
obejmuje `kilocode/kilo/auto` (`Kilo Auto`) z `input: ["text", "image"]`,
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
    ścieżce proxy zgodnej z OpenAI zamiast natywnego kształtowania żądań OpenAI.

    - Referencje Kilo oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje
      tam oczyszczanie sygnatur myślowych Gemini bez włączania natywnej walidacji
      powtórek Gemini ani przepisywania bootstrapu.
    - Kilo Gateway używa pod spodem tokenu Bearer z Twoim kluczem API.

  </Accordion>

  <Accordion title="Wrapper strumienia i reasoning">
    Wspólny wrapper strumienia Kilo dodaje nagłówek aplikacji dostawcy i normalizuje
    ładunki proxy reasoning dla obsługiwanych konkretnych referencji modeli.

    <Warning>
    `kilocode/kilo/auto` i inne wskazówki bez obsługi proxy reasoning pomijają wstrzykiwanie reasoning.
    Jeśli potrzebujesz obsługi reasoning, użyj konkretnej referencji modelu, takiej jak
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
    Wybór dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel Kilo Gateway, klucze API i zarządzanie kontem.
  </Card>
</CardGroup>
