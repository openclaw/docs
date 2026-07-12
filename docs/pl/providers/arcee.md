---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub opcji uwierzytelniania w CLI
summary: Konfiguracja Arcee AI (uwierzytelnianie + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T15:33:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) udostępnia rodzinę modeli Trinity typu mixture-of-experts za pośrednictwem API zgodnego z OpenAI. Wszystkie modele Trinity są objęte licencją Apache 2.0. Arcee jest oficjalnym pluginem OpenClaw, który nie jest dołączony do rdzenia, dlatego przed rozpoczęciem konfiguracji wstępnej należy go zainstalować.

Uzyskaj dostęp do modeli Arcee bezpośrednio przez platformę Arcee lub za pośrednictwem [OpenRouter](/pl/providers/openrouter).

| Właściwość   | Wartość                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------- |
| Dostawca      | `arcee`                                                                                       |
| Uwierzytelnianie | `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)                |
| API           | Zgodne z OpenAI                                                                               |
| Bazowy adres URL | `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter) |

## Instalowanie pluginu

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Pierwsze kroki

<Tabs>
  <Tab title="Bezpośrednio (platforma Arcee)">
    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API w serwisie [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Uruchom konfigurację wstępną">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Przez OpenRouter">
    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API w serwisie [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Uruchom konfigurację wstępną">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Te same odwołania do modeli działają zarówno w konfiguracji bezpośredniej, jak i przez OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja nieinteraktywna

<Tabs>
  <Tab title="Bezpośrednio (platforma Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Przez OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Wbudowany katalog

| Odwołanie do modelu            | Nazwa                  | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Koszt (wej./wyj. za 1 mln) | Narzędzia | Uwagi                                             |
| ------------------------------ | ---------------------- | -------------- | -------- | -------------------- | -------------------------- | --------- | ------------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst          | 256K     | 80K                  | $0.25 / $0.90              | Nie       | Model domyślny; rozszerzone rozumowanie            |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst          | 128K     | 16K                  | $0.25 / $1.00              | Tak       | Uniwersalny; 400 mld parametrów, 13 mld aktywnych  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst          | 128K     | 80K                  | $0.045 / $0.15             | Tak       | Szybki i ekonomiczny; wywoływanie funkcji          |

<Tip>
Ustawienie wstępne konfiguracji ustawia `arcee/trinity-large-thinking` jako model domyślny.
</Tip>

## Obsługiwane funkcje

| Funkcja                                           | Obsługa                                      |
| ------------------------------------------------- | -------------------------------------------- |
| Strumieniowanie                                   | Tak                                          |
| Używanie narzędzi / wywoływanie funkcji           | Tak (Trinity Mini, Trinity Large Preview)    |
| Ustrukturyzowane dane wyjściowe (tryb JSON i schemat JSON) | Tak                                |
| Rozszerzone rozumowanie                            | Tak (Trinity Large Thinking; narzędzia wyłączone) |

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że zmienna `ARCEEAI_API_KEY`
    (lub `OPENROUTER_API_KEY`) jest dostępna dla tego procesu, na przykład w
    `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`.
  </Accordion>

  <Accordion title="Trasowanie OpenRouter">
    Podczas korzystania z modeli Arcee przez OpenRouter obowiązują te same odwołania do modeli `arcee/*`.
    OpenClaw trasuje żądania w sposób przezroczysty na podstawie wybranej metody uwierzytelniania. Szczegóły
    konfiguracji właściwej dla OpenRouter znajdziesz w
    [dokumentacji dostawcy OpenRouter](/pl/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pl/providers/openrouter" icon="shuffle">
    Uzyskaj dostęp do modeli Arcee i wielu innych za pomocą jednego klucza API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
</CardGroup>
