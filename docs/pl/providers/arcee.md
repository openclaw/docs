---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru auth w CLI
summary: Konfiguracja Arcee AI (auth + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-24T09:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) zapewnia dostęp do rodziny modeli mixture-of-experts Trinity przez API zgodne z OpenAI. Wszystkie modele Trinity są objęte licencją Apache 2.0.

Dostęp do modeli Arcee AI można uzyskać bezpośrednio przez platformę Arcee lub przez [OpenRouter](/pl/providers/openrouter).

| Właściwość | Wartość                                                                              |
| ---------- | ------------------------------------------------------------------------------------ |
| Provider   | `arcee`                                                                              |
| Auth       | `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)         |
| API        | Zgodne z OpenAI                                                                      |
| Base URL   | `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter) |

## Pierwsze kroki

<Tabs>
  <Tab title="Bezpośrednio (platforma Arcee)">
    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz klucz API w [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Uruchom onboarding">
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
      <Step title="Pobierz klucz API">
        Utwórz klucz API w [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Uruchom onboarding">
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

        Te same odwołania modeli działają zarówno dla konfiguracji bezpośrednich, jak i przez OpenRouter (na przykład `arcee/trinity-large-thinking`).
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

OpenClaw obecnie dostarcza ten dołączony katalog Arcee:

| Ref modelu                     | Nazwa                  | Wejście | Kontekst | Koszt (wej./wyj. na 1M) | Uwagi                                      |
| ------------------------------ | ---------------------- | ------- | -------- | ----------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst   | 256K     | $0.25 / $0.90           | Model domyślny; reasoning włączone         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst   | 128K     | $0.25 / $1.00           | Ogólnego przeznaczenia; 400B parametrów, 13B aktywnych |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst   | 128K     | $0.045 / $0.15          | Szybki i oszczędny; function calling       |

<Tip>
Preset onboardingu ustawia `arcee/trinity-large-thinking` jako model domyślny.
</Tip>

## Obsługiwane funkcje

| Funkcja                                       | Obsługiwane                  |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Tak                          |
| Użycie narzędzi / function calling            | Tak                          |
| Strukturalne dane wyjściowe (tryb JSON i schemat JSON) | Tak                  |
| Extended thinking                             | Tak (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Uwaga o środowisku">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `ARCEEAI_API_KEY`
    (lub `OPENROUTER_API_KEY`) jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` albo przez `env.shellEnv`).
  </Accordion>

  <Accordion title="Routing OpenRouter">
    Przy używaniu modeli Arcee przez OpenRouter obowiązują te same odwołania modeli `arcee/*`.
    OpenClaw obsługuje routing transparentnie zgodnie z Twoim wyborem auth. Zobacz
    [dokumentację providera OpenRouter](/pl/providers/openrouter), aby poznać szczegóły
    konfiguracji specyficzne dla OpenRouter.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pl/providers/openrouter" icon="shuffle">
    Uzyskaj dostęp do modeli Arcee i wielu innych przez jeden klucz API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowania failover.
  </Card>
</CardGroup>
