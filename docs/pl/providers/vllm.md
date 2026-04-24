---
read_when:
    - Chcesz uruchamiać OpenClaw na lokalnym serwerze vLLM
    - Chcesz punktów końcowych `/v1` zgodnych z OpenAI z własnymi modelami
summary: Uruchamiaj OpenClaw z vLLM (lokalny serwer zgodny z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T09:30:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM może udostępniać modele open source (oraz niektóre niestandardowe) przez **zgodne z OpenAI** HTTP API. OpenClaw łączy się z vLLM przy użyciu API `openai-completions`.

OpenClaw może także **automatycznie wykrywać** dostępne modele z vLLM, gdy włączysz tę funkcję przez `VLLM_API_KEY` (dowolna wartość działa, jeśli Twój serwer nie wymusza uwierzytelniania) i nie zdefiniujesz jawnego wpisu `models.providers.vllm`.

OpenClaw traktuje `vllm` jako lokalnego dostawcę zgodnego z OpenAI, który obsługuje
rozliczanie użycia w streamingu, więc liczniki tokenów statusu/kontekstu mogą być aktualizowane na podstawie
odpowiedzi `stream_options.include_usage`.

| Właściwość      | Wartość                                  |
| --------------- | ---------------------------------------- |
| Identyfikator dostawcy | `vllm`                           |
| API             | `openai-completions` (zgodne z OpenAI)   |
| Uwierzytelnianie | zmienna środowiskowa `VLLM_API_KEY`     |
| Domyślny Base URL | `http://127.0.0.1:8000/v1`             |

## Pierwsze kroki

<Steps>
  <Step title="Uruchom vLLM z serwerem zgodnym z OpenAI">
    Twój Base URL powinien udostępniać punkty końcowe `/v1` (np. `/v1/models`, `/v1/chat/completions`). vLLM często działa pod adresem:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Ustaw zmienną środowiskową klucza API">
    Dowolna wartość działa, jeśli Twój serwer nie wymusza uwierzytelniania:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Wybierz model">
    Zastąp jedną z wartości identyfikatorem modelu vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Wykrywanie modeli (niejawny dostawca)

Gdy `VLLM_API_KEY` jest ustawione (lub istnieje profil uwierzytelniania) i **nie** zdefiniujesz `models.providers.vllm`, OpenClaw odpytuje:

```
GET http://127.0.0.1:8000/v1/models
```

i konwertuje zwrócone identyfikatory na wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.vllm`, automatyczne wykrywanie zostanie pominięte i musisz ręcznie zdefiniować modele.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście lub porcie
- chcesz przypiąć wartości `contextWindow` lub `maxTokens`
- Twój serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Lokalny model vLLM",
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
    vLLM jest traktowane jako zaplecze `/v1` zgodne z OpenAI w stylu proxy, a nie natywny
    punkt końcowy OpenAI. Oznacza to:

    | Zachowanie | Stosowane? |
    | ---------- | ---------- |
    | Natywne kształtowanie żądań OpenAI | Nie |
    | `service_tier` | Nie jest wysyłane |
    | `store` w Responses | Nie jest wysyłane |
    | Wskazówki prompt-cache | Nie są wysyłane |
    | Kształtowanie ładunku zgodności rozumowania OpenAI | Nie jest stosowane |
    | Ukryte nagłówki atrybucji OpenClaw | Nie są wstrzykiwane dla niestandardowych base URL |

  </Accordion>

  <Accordion title="Niestandardowy Base URL">
    Jeśli Twój serwer vLLM działa na niestandardowym hoście lub porcie, ustaw `baseUrl` w jawnej konfiguracji dostawcy:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Zdalny model vLLM",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie można połączyć się z serwerem">
    Sprawdź, czy serwer vLLM działa i jest dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli widzisz błąd połączenia, sprawdź hosta, port oraz to, czy vLLM zostało uruchomione w trybie serwera zgodnego z OpenAI.

  </Accordion>

  <Accordion title="Błędy uwierzytelniania w żądaniach">
    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwe `VLLM_API_KEY` zgodne z konfiguracją Twojego serwera albo skonfiguruj dostawcę jawnie w `models.providers.vllm`.

    <Tip>
    Jeśli Twój serwer vLLM nie wymusza uwierzytelniania, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał opt-in dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nie wykryto modeli">
    Automatyczne wykrywanie wymaga ustawionego `VLLM_API_KEY` **oraz** braku jawnego wpisu konfiguracji `models.providers.vllm`. Jeśli ręcznie zdefiniowano dostawcę, OpenClaw pomija wykrywanie i używa wyłącznie zadeklarowanych modeli.
  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania failover.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny dostawca OpenAI i zachowanie tras zgodnych z OpenAI.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązania.
  </Card>
</CardGroup>
