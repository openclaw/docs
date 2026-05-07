---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API albo wyboru uwierzytelniania w CLI
summary: Konfiguracja Arcee AI (uwierzytelnianie + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) zapewnia dostęp do rodziny modeli Trinity typu mixture-of-experts przez API zgodne z OpenAI. Wszystkie modele Trinity są objęte licencją Apache 2.0.

Do modeli Arcee AI można uzyskać dostęp bezpośrednio przez platformę Arcee lub przez [OpenRouter](/pl/providers/openrouter).

| Właściwość | Wartość                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| Dostawca   | `arcee`                                                                               |
| Uwierzytelnianie | `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)    |
| API        | Zgodne z OpenAI                                                                       |
| Bazowy URL | `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter) |

## Pierwsze kroki

<Tabs>
  <Tab title="Bezpośrednio (platforma Arcee)">
    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz klucz API w [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Ustaw domyślny model">
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
        Utwórz klucz API w [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Ustaw domyślny model">
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

| Odwołanie do modelu            | Nazwa                  | Wejście | Kontekst | Koszt (wej./wyj. za 1 mln) | Uwagi                                     |
| ------------------------------ | ---------------------- | ------- | -------- | -------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text    | 256K     | $0.25 / $0.90              | Model domyślny; włączone rozumowanie      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text    | 128K     | $0.25 / $1.00              | Ogólnego przeznaczenia; 400 mld parametrów, 13 mld aktywnych |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text    | 128K     | $0.045 / $0.15             | Szybki i opłacalny; wywoływanie funkcji   |

<Tip>
Preset onboardingu ustawia `arcee/trinity-large-thinking` jako model domyślny.
</Tip>

## Obsługiwane funkcje

| Funkcja                                       | Obsługiwane                                  |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Tak                                          |
| Użycie narzędzi / wywoływanie funkcji         | Tak (Trinity Mini, Trinity Large Preview)    |
| Dane wyjściowe strukturalne (tryb JSON i schemat JSON) | Tak                                  |
| Rozszerzone myślenie                          | Tak (Trinity Large Thinking; narzędzia wyłączone) |

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `ARCEEAI_API_KEY`
    (lub `OPENROUTER_API_KEY`) jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` lub przez `env.shellEnv`).
  </Accordion>

  <Accordion title="Routing OpenRouter">
    Gdy używasz modeli Arcee przez OpenRouter, obowiązują te same odwołania do modeli `arcee/*`.
    OpenClaw obsługuje routing przejrzyście na podstawie wybranego uwierzytelniania. Szczegóły
    konfiguracji specyficzne dla OpenRouter znajdziesz w
    [dokumentacji dostawcy OpenRouter](/pl/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pl/providers/openrouter" icon="shuffle">
    Uzyskaj dostęp do modeli Arcee i wielu innych za pomocą jednego klucza API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
</CardGroup>
