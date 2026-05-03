---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API lub wyboru uwierzytelniania w CLI
summary: Konfiguracja Arcee AI (uwierzytelnianie + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-03T09:53:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) zapewnia dostęp do rodziny modeli mieszanki ekspertów Trinity przez API zgodne z OpenAI. Wszystkie modele Trinity są objęte licencją Apache 2.0.

Do modeli Arcee AI można uzyskać dostęp bezpośrednio przez platformę Arcee albo przez [OpenRouter](/pl/providers/openrouter).

| Właściwość | Wartość                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| Dostawca   | `arcee`                                                                               |
| Uwierzytelnianie | `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)     |
| API        | zgodne z OpenAI                                                                       |
| Bazowy URL | `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter) |

## Pierwsze kroki

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        Utwórz klucz API w [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        Utwórz klucz API w [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Te same odwołania do modeli działają zarówno w konfiguracji bezpośredniej, jak i przez OpenRouter (na przykład `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguracja nieinteraktywna

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Wbudowany katalog

OpenClaw obecnie dostarcza ten dołączony katalog Arcee:

| Odwołanie do modelu            | Nazwa                  | Dane wejściowe | Kontekst | Koszt (wej./wyj. za 1 mln) | Uwagi                                     |
| ------------------------------ | ---------------------- | -------------- | -------- | -------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst          | 256K     | $0.25 / $0.90              | Model domyślny; włączone rozumowanie      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst          | 128K     | $0.25 / $1.00              | Ogólnego przeznaczenia; 400B parametrów, 13B aktywnych |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst          | 128K     | $0.045 / $0.15             | Szybki i opłacalny; wywoływanie funkcji   |

<Tip>
Preset onboardingu ustawia `arcee/trinity-large-thinking` jako model domyślny.
</Tip>

## Obsługiwane funkcje

| Funkcja                                       | Obsługiwane                  |
| --------------------------------------------- | ---------------------------- |
| Strumieniowanie                               | Tak                          |
| Użycie narzędzi / wywoływanie funkcji         | Tak                          |
| Dane wyjściowe o określonej strukturze (tryb JSON i schemat JSON) | Tak        |
| Rozszerzone myślenie                          | Tak (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Environment note">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `ARCEEAI_API_KEY`
    (lub `OPENROUTER_API_KEY`) jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` albo przez `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Przy używaniu modeli Arcee przez OpenRouter obowiązują te same odwołania do modeli `arcee/*`.
    OpenClaw obsługuje routing przezroczyście na podstawie wybranego sposobu uwierzytelniania. Zobacz
    [dokumentację dostawcy OpenRouter](/pl/providers/openrouter), aby poznać szczegóły
    konfiguracji specyficzne dla OpenRouter.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pl/providers/openrouter" icon="shuffle">
    Uzyskaj dostęp do modeli Arcee i wielu innych za pomocą jednego klucza API.
  </Card>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
</CardGroup>
