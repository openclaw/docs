---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Wymagana jest zmienna środowiskowa klucza API albo wybór uwierzytelniania CLI
summary: Konfiguracja Arcee AI (uwierzytelnianie + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) zapewnia dostęp do rodziny modeli Trinity typu mixture-of-experts przez API zgodne z OpenAI. Wszystkie modele Trinity są objęte licencją Apache 2.0.

Dostęp do modeli Arcee AI można uzyskać bezpośrednio przez platformę Arcee albo przez [OpenRouter](/pl/providers/openrouter).

| Właściwość       | Wartość                                                                               |
| ---------------- | ------------------------------------------------------------------------------------- |
| Dostawca         | `arcee`                                                                               |
| Uwierzytelnianie | `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)          |
| API              | zgodne z OpenAI                                                                       |
| Bazowy URL       | `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter) |

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

OpenClaw obecnie zawiera ten wbudowany katalog Arcee:

| Odwołanie do modelu            | Nazwa                  | Dane wejściowe | Kontekst | Koszt (wej./wyj. za 1 mln) | Uwagi                                           |
| ------------------------------ | ---------------------- | -------------- | -------- | -------------------------- | ----------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst          | 256K     | $0.25 / $0.90              | Model domyślny; wnioskowanie włączone; bez narzędzi |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst          | 128K     | $0.25 / $1.00              | Ogólnego przeznaczenia; 400 mld parametrów, 13 mld aktywnych |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst          | 128K     | $0.045 / $0.15             | Szybki i ekonomiczny; wywoływanie funkcji       |

<Tip>
Preset onboardingu ustawia `arcee/trinity-large-thinking` jako model domyślny. Obsługuje on tylko wnioskowanie i tekst oraz nie obsługuje użycia narzędzi ani wywoływania funkcji.
</Tip>

## Obsługiwane funkcje

| Funkcja                                      | Obsługiwane                                 |
| -------------------------------------------- | ------------------------------------------- |
| Strumieniowanie                              | Tak                                         |
| Użycie narzędzi / wywoływanie funkcji        | Zależne od modelu; nie Trinity Large Thinking |
| Dane wyjściowe ze strukturą (tryb JSON i schemat JSON) | Tak                                |
| Rozszerzone myślenie                         | Tak (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `ARCEEAI_API_KEY`
    (lub `OPENROUTER_API_KEY`) jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` albo przez `env.shellEnv`).
  </Accordion>

  <Accordion title="Routing OpenRouter">
    Podczas używania modeli Arcee przez OpenRouter obowiązują te same odwołania do modeli `arcee/*`.
    OpenClaw obsługuje routing transparentnie na podstawie wybranej metody uwierzytelniania. Zobacz
    [dokumentację dostawcy OpenRouter](/pl/providers/openrouter), aby poznać szczegóły konfiguracji
    specyficzne dla OpenRouter.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pl/providers/openrouter" icon="shuffle">
    Dostęp do modeli Arcee i wielu innych przy użyciu jednego klucza API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
</CardGroup>
