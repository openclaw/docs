---
read_when:
    - Chcesz używać jednego klucza API do wielu modeli LLM
    - Chcesz uruchamiać modele za pośrednictwem Kilo Gateway w OpenClaw
summary: Korzystaj z ujednoliconego API Kilo Gateway, aby uzyskiwać dostęp do wielu modeli w OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T15:32:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway kieruje żądania do wielu modeli za pośrednictwem jednego punktu końcowego zgodnego z OpenAI i jednego klucza API.

| Właściwość  | Wartość                            |
| ------------ | ---------------------------------- |
| Dostawca     | `kilocode`                         |
| Uwierzytelnianie | `KILOCODE_API_KEY`             |
| API          | Zgodne z OpenAI                    |
| Bazowy adres URL | `https://api.kilo.ai/api/gateway/` |

## Instalacja pluginu

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Konfiguracja

<Steps>
  <Step title="Utwórz konto">
    Przejdź do [app.kilo.ai](https://app.kilo.ai), zaloguj się lub utwórz konto, a następnie wygeneruj klucz API.
  </Step>
  <Step title="Uruchom wdrażanie">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Możesz też ustawić zmienną środowiskową bezpośrednio:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Sprawdź dostępność modelu">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Model domyślny i katalog

Domyślnym modelem jest `kilocode/kilo/auto` — należący do dostawcy model inteligentnego kierowania. OpenClaw nie
publikuje dla niego mapowania zadań na modele nadrzędne; za kierowanie za pośrednictwem `kilo/auto` odpowiada Kilo Gateway.

Podczas uruchamiania OpenClaw wysyła zapytanie `GET https://api.kilo.ai/api/gateway/models` i scala wykryte modele,
umieszczając je przed statycznym katalogiem awaryjnym. Statyczny katalog awaryjny zawiera tylko `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

Do każdego modelu w Gateway można odwołać się jako `kilocode/<upstream-id>` (na przykład
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Uruchom `/models kilocode` lub
`openclaw models list --provider kilocode`, aby wyświetlić pełną listę wykrytych modeli.

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

## Uwagi dotyczące działania

<AccordionGroup>
  <Accordion title="Transport i zgodność">
    Kilo Gateway jest zgodny z OpenRouter, dlatego korzysta ze ścieżki żądań zgodnej z OpenAI w stylu serwera proxy
    zamiast natywnego formatowania żądań OpenAI (bez `store` i bez ładunku poziomu intensywności rozumowania OpenAI).

    - Odwołania Kilo oparte na Gemini pozostają na ścieżce Gemini serwera proxy: OpenClaw oczyszcza tam sygnatury
      toku rozumowania Gemini, ale nie włącza natywnej walidacji odtwarzania Gemini ani przepisywania inicjalizacyjnego.
    - Żądania używają tokenu Bearer utworzonego z klucza API.

  </Accordion>

  <Accordion title="Otoka strumienia i rozumowanie">
    Otoka strumienia Kilo dodaje nagłówek żądania `X-KILOCODE-FEATURE` (domyślnie `openclaw`,
    wartość można nadpisać zmienną środowiskową `KILOCODE_FEATURE`) i normalizuje ładunki poziomu intensywności rozumowania dla
    modeli, które je obsługują.

    <Warning>
    Odwołania `kilocode/kilo/auto` i `x-ai/*` pomijają wstrzykiwanie poziomu intensywności rozumowania. Jeśli potrzebujesz obsługi
    rozumowania, użyj odwołania do konkretnego modelu, takiego jak `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Jeśli wykrywanie modeli nie powiedzie się podczas uruchamiania, OpenClaw użyje statycznego katalogu awaryjnego zawierającego `kilocode/kilo/auto`.
    - Upewnij się, że klucz API jest prawidłowy, a na koncie Kilo włączono żądane modele.
    - Gdy Gateway działa jako demon, upewnij się, że zmienna `KILOCODE_API_KEY` jest dostępna dla tego procesu (na przykład w `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełna dokumentacja konfiguracji OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Panel Kilo Gateway, klucze API i zarządzanie kontem.
  </Card>
</CardGroup>
