---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem SGLang
    - Chcesz używać punktów końcowych /v1 zgodnych z OpenAI z własnymi modelami
summary: Uruchamianie OpenClaw z SGLang (samodzielnie hostowany serwer zgodny z OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang udostępnia modele o otwartych wagach przez HTTP API zgodne z OpenAI. OpenClaw łączy się z SGLang przy użyciu rodziny dostawców `openai-completions` z automatycznym wykrywaniem dostępnych modeli.

| Właściwość                | Wartość                                                      |
| ------------------------- | ------------------------------------------------------------ |
| Identyfikator dostawcy    | `sglang`                                                     |
| Plugin                    | dołączony, `enabledByDefault: true`                          |
| Zmienna środowiskowa uwierzytelniania | `SGLANG_API_KEY` (dowolna niepusta wartość, jeśli serwer nie ma uwierzytelniania) |
| Flaga wdrażania           | `--auth-choice sglang`                                       |
| API                       | zgodne z OpenAI (`openai-completions`)                       |
| Domyślny bazowy URL       | `http://127.0.0.1:30000/v1`                                  |
| Domyślny symbol zastępczy modelu | `sglang/Qwen/Qwen3-8B`                               |
| Użycie strumieniowania    | Tak (`supportsStreamingUsage: true`)                         |
| Cennik                    | oznaczone jako bezpłatne zewnętrznie (`modelPricing.external: false`) |

OpenClaw również **automatycznie wykrywa** dostępne modele z SGLang, gdy włączysz tę funkcję za pomocą `SGLANG_API_KEY` i nie zdefiniujesz jawnego wpisu `models.providers.sglang` — zobacz [Wykrywanie modelu (dostawca niejawny)](#model-discovery-implicit-provider) poniżej.

## Pierwsze kroki

<Steps>
  <Step title="Uruchom SGLang">
    Uruchom SGLang z serwerem zgodnym z OpenAI. Bazowy URL powinien udostępniać
    punkty końcowe `/v1` (na przykład `/v1/models`, `/v1/chat/completions`). SGLang
    zwykle działa pod adresem:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Ustaw klucz API">
    Jeśli na serwerze nie skonfigurowano uwierzytelniania, działa dowolna wartość:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Uruchom wdrażanie lub ustaw model bezpośrednio">
    ```bash
    openclaw onboard
    ```

    Albo skonfiguruj model ręcznie:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Wykrywanie modelu (dostawca niejawny)

Gdy ustawiono `SGLANG_API_KEY` (lub istnieje profil uwierzytelniania) i **nie**
zdefiniowano `models.providers.sglang`, OpenClaw wyśle zapytanie do:

- `GET http://127.0.0.1:30000/v1/models`

i przekształci zwrócone identyfikatory w wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.sglang`, automatyczne wykrywanie zostanie pominięte i
musisz zdefiniować modele ręcznie.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- SGLang działa na innym hoście/porcie.
- Chcesz przypiąć wartości `contextWindow`/`maxTokens`.
- Twój serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Zachowanie w stylu proxy">
    SGLang jest traktowany jako backend `/v1` w stylu proxy zgodny z OpenAI, a nie jako
    natywny punkt końcowy OpenAI.

    | Zachowanie | SGLang |
    |----------|--------|
    | Kształtowanie żądań tylko dla OpenAI | Nie stosuje się |
    | `service_tier`, Responses `store`, wskazówki pamięci podręcznej promptów | Nie są wysyłane |
    | Kształtowanie payloadu zgodne z rozumowaniem | Nie stosuje się |
    | Ukryte nagłówki atrybucji (`originator`, `version`, `User-Agent`) | Nie są wstrzykiwane dla niestandardowych bazowych URL SGLang |

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    **Serwer nieosiągalny**

    Sprawdź, czy serwer działa i odpowiada:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Błędy uwierzytelniania**

    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy `SGLANG_API_KEY`, który odpowiada
    konfiguracji serwera, albo jawnie skonfiguruj dostawcę w
    `models.providers.sglang`.

    <Tip>
    Jeśli uruchamiasz SGLang bez uwierzytelniania, dowolna niepusta wartość
    `SGLANG_API_KEY` wystarczy, aby włączyć wykrywanie modeli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym wpisy dostawców.
  </Card>
</CardGroup>
