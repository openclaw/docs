---
read_when:
    - Chcesz jednego klucza API dla wielu LLM-ów
    - Chcesz uruchamiać modele za pośrednictwem Kilo Gateway w OpenClaw
summary: Użyj ujednoliconego API Kilo Gateway, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-27T18:12:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway udostępnia **ujednolicony interfejs API**, który kieruje żądania do wielu modeli za jednym
endpointem i kluczem API. Jest zgodny z OpenAI, więc większość SDK OpenAI działa po zmianie bazowego adresu URL.

| Właściwość | Wartość                            |
| ---------- | ---------------------------------- |
| Dostawca   | `kilocode`                         |
| Uwierzytelnianie | `KILOCODE_API_KEY`           |
| API        | Zgodne z OpenAI                    |
| Bazowy URL | `https://api.kilo.ai/api/gateway/` |

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

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

## Model domyślny

Domyślnym modelem jest `kilocode/kilo/auto`, należący do dostawcy model inteligentnego routingu
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

| Referencja modelu                       | Uwagi                              |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | Domyślny — inteligentny routing    |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic przez Kilo               |
| `kilocode/openai/gpt-5.5`                | OpenAI przez Kilo                  |
| `kilocode/google/gemini-3.1-pro-preview` | Google przez Kilo                  |
| ...i wiele innych                        | Użyj `/models kilocode`, aby wyświetlić wszystkie |

<Tip>
Podczas uruchamiania OpenClaw odpytuje `GET https://api.kilo.ai/api/gateway/models` i scala
wykryte modele przed statycznym katalogiem awaryjnym. Statyczny katalog awaryjny zawsze
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
    Kilo Gateway jest udokumentowany w źródle jako zgodny z OpenRouter, dlatego pozostaje na
    ścieżce zgodnej z OpenAI w stylu proxy, zamiast używać natywnego kształtowania żądań OpenAI.

    - Referencje Kilo oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje
      tam oczyszczanie sygnatur myślenia Gemini bez włączania natywnej walidacji
      odtwarzania Gemini ani przepisywania bootstrapu.
    - Kilo Gateway używa pod spodem tokenu Bearer z Twoim kluczem API.

  </Accordion>

  <Accordion title="Opakowanie strumienia i rozumowanie">
    Wspólne opakowanie strumienia Kilo dodaje nagłówek aplikacji dostawcy i normalizuje
    ładunki rozumowania proxy dla obsługiwanych konkretnych referencji modeli.

    <Warning>
    `kilocode/kilo/auto` i inne wskazówki proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania.
    Jeśli potrzebujesz obsługi rozumowania, użyj konkretnej referencji modelu, takiej jak
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli wykrywanie modeli nie powiedzie się podczas uruchamiania, OpenClaw wróci do statycznego katalogu zawierającego `kilocode/kilo/auto`.
    - Upewnij się, że Twój klucz API jest prawidłowy i że na Twoim koncie Kilo włączono żądane modele.
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
