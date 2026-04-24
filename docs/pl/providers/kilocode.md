---
read_when:
    - Chcesz jednego klucza API dla wielu LLM-ów
    - Chcesz uruchamiać modele przez Kilo Gateway w OpenClaw
summary: Użyj zunifikowanego API Kilo Gateway, aby uzyskać dostęp do wielu modeli w OpenClaw
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T09:28:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway udostępnia **zunifikowane API**, które kieruje żądania do wielu modeli za jednym
punktem końcowym i kluczem API. Jest zgodne z OpenAI, więc większość SDK OpenAI działa po zmianie base URL.

| Właściwość | Wartość                           |
| ---------- | --------------------------------- |
| Provider   | `kilocode`                        |
| Auth       | `KILOCODE_API_KEY`                |
| API        | Zgodne z OpenAI                   |
| Base URL   | `https://api.kilo.ai/api/gateway/` |

## Szybki start

<Steps>
  <Step title="Utwórz konto">
    Przejdź do [app.kilo.ai](https://app.kilo.ai), zaloguj się lub utwórz konto, a następnie przejdź do API Keys i wygeneruj nowy klucz.
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Lub ustaw zmienną środowiskową bezpośrednio:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Zweryfikuj, że model jest dostępny">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model domyślny

Domyślny model to `kilocode/kilo/auto`, model smart-routing należący do providera
zarządzany przez Kilo Gateway.

<Note>
OpenClaw traktuje `kilocode/kilo/auto` jako stabilną referencję domyślną, ale nie
publikuje mapowania źródłowego zadanie→model-upstream dla tej trasy. Dokładny
routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway, a nie jest
hardkodowany w OpenClaw.
</Note>

## Wbudowany katalog

OpenClaw dynamicznie wykrywa dostępne modele z Kilo Gateway przy starcie. Użyj
`/models kilocode`, aby zobaczyć pełną listę modeli dostępnych dla Twojego konta.

Każdy model dostępny w gateway może być używany z prefiksem `kilocode/`:

| Referencja modelu                       | Uwagi                              |
| --------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                    | Domyślny — smart routing           |
| `kilocode/anthropic/claude-sonnet-4`    | Anthropic przez Kilo               |
| `kilocode/openai/gpt-5.5`               | OpenAI przez Kilo                  |
| `kilocode/google/gemini-3-pro-preview`  | Google przez Kilo                  |
| ...i wiele innych                       | Użyj `/models kilocode`, aby wyświetlić wszystkie |

<Tip>
Przy starcie OpenClaw odpytuje `GET https://api.kilo.ai/api/gateway/models` i scala
wykryte modele przed statycznym katalogiem awaryjnym. Dołączony fallback zawsze
zawiera `kilocode/kilo/auto` (`Kilo Auto`) z `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` i `maxTokens: 128000`.
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
    Kilo Gateway jest opisywany w źródle jako zgodny z OpenRouter, więc pozostaje na
    ścieżce proxy-style zgodnej z OpenAI zamiast natywnego kształtowania żądań OpenAI.

    - Referencje Kilo oparte na Gemini pozostają na ścieżce proxy-Gemini, więc OpenClaw zachowuje
      tam sanityzację podpisu myśli Gemini bez włączania natywnej walidacji replay Gemini
      ani przepisów bootstrap.
    - Kilo Gateway wewnętrznie używa tokenu Bearer z Twoim kluczem API.

  </Accordion>

  <Accordion title="Wrapper strumienia i rozumowanie">
    Współdzielony wrapper strumienia Kilo dodaje nagłówek aplikacji providera i normalizuje
    ładunki rozumowania proxy dla obsługiwanych konkretnych referencji modeli.

    <Warning>
    `kilocode/kilo/auto` i inne wskazania, które nie obsługują rozumowania proxy, pomijają wstrzykiwanie
    rozumowania. Jeśli potrzebujesz obsługi rozumowania, użyj konkretnej referencji modelu, takiej jak
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli wykrywanie modeli nie powiedzie się przy starcie, OpenClaw wraca do dołączonego statycznego katalogu zawierającego `kilocode/kilo/auto`.
    - Potwierdź, że Twój klucz API jest prawidłowy i że konto Kilo ma włączone pożądane modele.
    - Gdy Gateway działa jako daemon, upewnij się, że `KILOCODE_API_KEY` jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` lub przez `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i zachowanie failover.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel Kilo Gateway, klucze API i zarządzanie kontem.
  </Card>
</CardGroup>
