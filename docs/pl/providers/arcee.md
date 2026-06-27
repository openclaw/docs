---
read_when:
    - Chcesz używać Arcee AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru uwierzytelniania CLI
summary: Konfiguracja Arcee AI (uwierzytelnianie + wybór modelu)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T18:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) zapewnia dostęp do rodziny modeli Trinity typu mixture-of-experts przez API zgodne z OpenAI. Wszystkie modele Trinity są objęte licencją Apache 2.0.

Modele Arcee AI są dostępne bezpośrednio przez platformę Arcee albo przez [OpenRouter](/pl/providers/openrouter).

| Właściwość | Wartość                                                                               |
| ---------- | ------------------------------------------------------------------------------------- |
| Dostawca   | `arcee`                                                                               |
| Uwierzytelnianie | `ARCEEAI_API_KEY` (bezpośrednio) lub `OPENROUTER_API_KEY` (przez OpenRouter)    |
| API        | Zgodne z OpenAI                                                                       |
| Bazowy URL | `https://api.arcee.ai/api/v1` (bezpośrednio) lub `https://openrouter.ai/api/v1` (OpenRouter) |

## Zainstaluj plugin

Zainstaluj oficjalny plugin, a następnie zrestartuj Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

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

        Te same refs modeli działają zarówno w konfiguracji bezpośredniej, jak i przez OpenRouter (na przykład `arcee/trinity-large-thinking`).
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

OpenClaw obecnie dostarcza ten statyczny katalog Arcee:

| Ref modelu                     | Nazwa                  | Wejście | Kontekst | Koszt (wej./wyj. za 1 mln) | Uwagi                                     |
| ------------------------------ | ---------------------- | ------- | -------- | -------------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst   | 256K     | $0.25 / $0.90              | Model domyślny; włączone rozumowanie      |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst   | 128K     | $0.25 / $1.00              | Ogólnego przeznaczenia; 400B parametrów, 13B aktywnych |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst   | 128K     | $0.045 / $0.15             | Szybki i opłacalny; wywoływanie funkcji   |

<Tip>
Preset onboardingu ustawia `arcee/trinity-large-thinking` jako model domyślny.
</Tip>

## Obsługiwane funkcje

| Funkcja                                      | Obsługiwane                                  |
| -------------------------------------------- | -------------------------------------------- |
| Streaming                                    | Tak                                          |
| Użycie narzędzi / wywoływanie funkcji        | Tak (Trinity Mini, Trinity Large Preview)    |
| Dane wyjściowe ze strukturą (tryb JSON i schemat JSON) | Tak                                 |
| Rozszerzone myślenie                         | Tak (Trinity Large Thinking; narzędzia wyłączone) |

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `ARCEEAI_API_KEY`
    (lub `OPENROUTER_API_KEY`) jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` albo przez `env.shellEnv`).
  </Accordion>

  <Accordion title="Routing OpenRouter">
    Gdy używasz modeli Arcee przez OpenRouter, obowiązują te same refs modeli `arcee/*`.
    OpenClaw obsługuje routing przezroczyście na podstawie wybranego uwierzytelniania. Zobacz
    [dokumentację dostawcy OpenRouter](/pl/providers/openrouter), aby poznać szczegóły
    konfiguracji specyficzne dla OpenRouter.
  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/pl/providers/openrouter" icon="shuffle">
    Dostęp do modeli Arcee i wielu innych za pomocą jednego klucza API.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, refs modeli i zachowania failover.
  </Card>
</CardGroup>
