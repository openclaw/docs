---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem SGLang
    - Chcesz używać punktów końcowych /v1 zgodnych z OpenAI dla własnych modeli
summary: Uruchom OpenClaw z SGLang (samodzielnie hostowany serwer zgodny z OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:33:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang udostępnia modele o otwartych wagach przez zgodne z OpenAI API HTTP. OpenClaw łączy się z SGLang przy użyciu rodziny dostawców `openai-completions` z automatycznym wykrywaniem dostępnych modeli.

| Właściwość                | Wartość                                                      |
| ------------------------- | ------------------------------------------------------------ |
| Identyfikator dostawcy    | `sglang`                                                     |
| Plugin                    | wbudowany, `enabledByDefault: true`                          |
| Zmienna środowiskowa uwierzytelniania | `SGLANG_API_KEY` (dowolna niepusta wartość, jeśli serwer nie ma uwierzytelniania) |
| Flaga konfiguracji początkowej | `--auth-choice sglang`                                  |
| API                       | zgodne z OpenAI (`openai-completions`)                       |
| Domyślny bazowy URL       | `http://127.0.0.1:30000/v1`                                  |
| Domyślny symbol zastępczy modelu | `sglang/Qwen/Qwen3-8B`                                |
| Użycie strumieniowania    | Tak (`supportsStreamingUsage: true`)                         |
| Cennik                    | Oznaczone jako zewnętrznie bezpłatne (`modelPricing.external: false`) |

OpenClaw także **automatycznie wykrywa** dostępne modele z SGLang, gdy włączysz tę opcję za pomocą `SGLANG_API_KEY`. Użyj `sglang/*` w `agents.defaults.models`, aby zachować dynamiczne wykrywanie, gdy konfigurujesz także niestandardowy bazowy URL SGLang. Zobacz [Wykrywanie modeli (niejawny dostawca)](#model-discovery-implicit-provider) poniżej.

## Pierwsze kroki

<Steps>
  <Step title="Uruchom SGLang">
    Uruchom SGLang z serwerem zgodnym z OpenAI. Twój bazowy URL powinien udostępniać
    punkty końcowe `/v1` (na przykład `/v1/models`, `/v1/chat/completions`). SGLang
    zwykle działa pod adresem:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Ustaw klucz API">
    Dowolna wartość działa, jeśli na serwerze nie skonfigurowano uwierzytelniania:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Uruchom konfigurację początkową lub ustaw model bezpośrednio">
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

## Wykrywanie modeli (niejawny dostawca)

Gdy `SGLANG_API_KEY` jest ustawione (albo istnieje profil uwierzytelniania), a Ty **nie**
definiujesz `models.providers.sglang`, OpenClaw wyśle zapytanie do:

- `GET http://127.0.0.1:30000/v1/models`

i przekształci zwrócone identyfikatory w wpisy modeli.

<Note>
Jeśli ustawisz `models.providers.sglang` jawnie, OpenClaw domyślnie użyje zadeklarowanych
przez Ciebie modeli. Dodaj `"sglang/*": {}` do `agents.defaults.models`, gdy
chcesz, aby OpenClaw odpytywał punkt końcowy `/models` skonfigurowanego dostawcy i uwzględniał
wszystkie ogłaszane modele SGLang.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- SGLang działa na innym hoście/porcie.
- Chcesz przypiąć wartości `contextWindow`/`maxTokens`.
- Twój serwer wymaga prawdziwego klucza API (albo chcesz kontrolować nagłówki).

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
    SGLang jest traktowany jako backend `/v1` w stylu proxy zgodny z OpenAI, a nie
    natywny punkt końcowy OpenAI.

    | Zachowanie | SGLang |
    |----------|--------|
    | Kształtowanie żądań tylko dla OpenAI | Nie jest stosowane |
    | `service_tier`, Responses `store`, wskazówki pamięci podręcznej promptów | Nie są wysyłane |
    | Kształtowanie ładunku zgodności rozumowania | Nie jest stosowane |
    | Ukryte nagłówki atrybucji (`originator`, `version`, `User-Agent`) | Nie są wstrzykiwane dla niestandardowych bazowych URL-i SGLang |

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    **Serwer nieosiągalny**

    Sprawdź, czy serwer działa i odpowiada:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Błędy uwierzytelniania**

    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy `SGLANG_API_KEY`, który pasuje
    do konfiguracji serwera, albo skonfiguruj dostawcę jawnie w
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
