---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem SGLang
    - Chcesz punktów końcowych /v1 zgodnych z OpenAI dla własnych modeli
summary: Uruchamianie OpenClaw z SGLang (samodzielnie hostowany serwer zgodny z OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T15:34:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang udostępnia modele z otwartymi wagami za pośrednictwem interfejsu HTTP API zgodnego z OpenAI. OpenClaw łączy się z SGLang przy użyciu rodziny dostawców `openai-completions` z automatycznym wykrywaniem dostępnych modeli.

| Właściwość                       | Wartość                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| Identyfikator dostawcy           | `sglang`                                                              |
| Plugin                           | wbudowany, `enabledByDefault: true`                                   |
| Zmienna środowiskowa uwierzytelniania | `SGLANG_API_KEY` (dowolna niepusta wartość, jeśli serwer nie wymaga uwierzytelniania) |
| Flaga wdrażania                  | `--auth-choice sglang`                                                |
| API                              | zgodne z OpenAI (`openai-completions`)                                |
| Domyślny bazowy adres URL        | `http://127.0.0.1:30000/v1`                                           |
| Domyślny symbol zastępczy modelu | `sglang/Qwen/Qwen3-8B`                                                |
| Użycie podczas strumieniowania   | Tak (`supportsStreamingUsage: true`)                                  |
| Cennik                           | Oznaczone jako bezpłatne zewnętrznie (`modelPricing.external: false`) |

OpenClaw również **automatycznie wykrywa** modele dostępne w SGLang po wyrażeniu zgody przez ustawienie `SGLANG_API_KEY`. Użyj `sglang/*` w `agents.defaults.models`, aby zachować dynamiczne wykrywanie również po skonfigurowaniu niestandardowego bazowego adresu URL SGLang. Zobacz poniżej [Wykrywanie modeli (dostawca niejawny)](#model-discovery-implicit-provider).

## Pierwsze kroki

<Steps>
  <Step title="Uruchom SGLang">
    Uruchom SGLang z serwerem zgodnym z OpenAI. Bazowy adres URL powinien udostępniać
    punkty końcowe `/v1` (na przykład `/v1/models`, `/v1/chat/completions`). SGLang
    zwykle działa pod adresem:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Ustaw klucz API">
    Dowolna wartość zadziała, jeśli na serwerze nie skonfigurowano uwierzytelniania:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Uruchom wdrażanie lub ustaw model bezpośrednio">
    ```bash
    openclaw onboard
    ```

    Możesz też skonfigurować model ręcznie:

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

## Wykrywanie modeli (dostawca niejawny)

Gdy ustawiono `SGLANG_API_KEY` (lub istnieje profil uwierzytelniania) i **nie**
zdefiniowano `models.providers.sglang`, OpenClaw wysyła zapytanie do:

- `GET http://127.0.0.1:30000/v1/models`

i przekształca zwrócone identyfikatory we wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.sglang`, OpenClaw domyślnie użyje
zadeklarowanych modeli. Dodaj `"sglang/*": {}` do `agents.defaults.models`, jeśli
OpenClaw ma wysyłać zapytania do punktu końcowego `/models` skonfigurowanego
dostawcy i uwzględniać wszystkie ogłaszane modele SGLang.
</Note>

## Konfiguracja jawna (modele ręczne)

Użyj konfiguracji jawnej, gdy:

- SGLang działa na innym hoście lub porcie.
- Chcesz ustalić wartości `contextWindow`/`maxTokens`.
- Serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki).

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
  <Accordion title="Działanie w stylu serwera proxy">
    SGLang jest traktowany jako zgodne z OpenAI zaplecze `/v1` działające w stylu
    serwera proxy, a nie jako natywny punkt końcowy OpenAI.

    | Zachowanie | SGLang |
    |------------|--------|
    | Kształtowanie żądań wyłącznie dla OpenAI | Niezastosowane |
    | `service_tier`, `store` interfejsu Responses, wskazówki pamięci podręcznej promptów | Niewysyłane |
    | Kształtowanie ładunku zapewniające zgodność rozumowania | Niezastosowane |
    | Ukryte nagłówki atrybucji (`originator`, `version`, `User-Agent`) | Niewstrzykiwane przy niestandardowych bazowych adresach URL SGLang |

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    **Brak połączenia z serwerem**

    Sprawdź, czy serwer działa i odpowiada:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Błędy uwierzytelniania**

    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy
    `SGLANG_API_KEY` zgodny z konfiguracją serwera albo jawnie skonfiguruj
    dostawcę w `models.providers.sglang`.

    <Tip>
    Jeśli uruchamiasz SGLang bez uwierzytelniania, dowolna niepusta wartość
    `SGLANG_API_KEY` wystarczy, aby włączyć wykrywanie modeli.
    </Tip>

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym wpisy dostawców.
  </Card>
</CardGroup>
