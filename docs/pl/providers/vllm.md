---
read_when:
    - Chcesz uruchomić OpenClaw względem lokalnego serwera vLLM
    - Chcesz punktów końcowych `/v1` zgodnych z OpenAI z własnymi modelami
summary: Uruchamianie OpenClaw z vLLM (lokalnym serwerem zgodnym z OpenAI)
title: vLLM
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:40:01Z"
  model: gpt-5.4
  provider: openai
  source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
  source_path: providers/vllm.md
  workflow: 15
---

vLLM może udostępniać modele open source (oraz niektóre modele niestandardowe) przez **zgodne z OpenAI** API HTTP. OpenClaw łączy się z vLLM przy użyciu API `openai-completions`.

OpenClaw może też **automatycznie wykrywać** dostępne modele z vLLM, gdy włączysz to przez `VLLM_API_KEY` (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania) i nie zdefiniujesz jawnego wpisu `models.providers.vllm`.

OpenClaw traktuje `vllm` jako lokalnego dostawcę zgodnego z OpenAI, który obsługuje
strumieniowe rozliczanie użycia, dzięki czemu liczby tokenów statusu/kontekstu mogą być aktualizowane na podstawie odpowiedzi
`stream_options.include_usage`.

| Właściwość      | Wartość                                  |
| --------------- | ---------------------------------------- |
| ID dostawcy     | `vllm`                                   |
| API             | `openai-completions` (zgodne z OpenAI)   |
| Uwierzytelnianie | zmienna środowiskowa `VLLM_API_KEY`     |
| Domyślny base URL | `http://127.0.0.1:8000/v1`             |

## Pierwsze kroki

<Steps>
  <Step title="Uruchom vLLM z serwerem zgodnym z OpenAI">
    Twój base URL powinien udostępniać punkty końcowe `/v1` (np. `/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Ustaw zmienną środowiskową klucza API">
    Dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Wybierz model">
    Zastąp jedną z wartości ID modelu vLLM:

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

Gdy `VLLM_API_KEY` jest ustawione (lub istnieje profil uwierzytelniania) i **nie** zdefiniujesz `models.providers.vllm`, OpenClaw wysyła zapytanie:

```
GET http://127.0.0.1:8000/v1/models
```

i przekształca zwrócone ID w wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.vllm`, automatyczne wykrywanie zostanie pominięte i musisz ręcznie zdefiniować modele.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście lub porcie
- Chcesz przypiąć wartości `contextWindow` lub `maxTokens`
- Twój serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki)
- Łączysz się z zaufanym punktem końcowym vLLM przez local loopback, LAN lub Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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
    vLLM jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie natywny
    punkt końcowy OpenAI. Oznacza to:

    | Zachowanie | Stosowane? |
    |----------|----------|
    | Natywne kształtowanie żądań OpenAI | Nie |
    | `service_tier` | Nie jest wysyłane |
    | `store` odpowiedzi | Nie jest wysyłane |
    | Wskazówki cache promptów | Nie są wysyłane |
    | Kształtowanie ładunku zgodności z rozumowaniem OpenAI | Nie jest stosowane |
    | Ukryte nagłówki atrybucji OpenClaw | Nie są wstrzykiwane przy niestandardowych base URL |

  </Accordion>

  <Accordion title="Kontrolki myślenia Nemotron 3">
    vLLM/Nemotron 3 może używać argumentów `chat-template` do kontrolowania, czy rozumowanie
    jest zwracane jako ukryte rozumowanie, czy jako widoczny tekst odpowiedzi. Gdy sesja OpenClaw
    używa `vllm/nemotron-3-*` z wyłączonym myśleniem, OpenClaw wysyła:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Aby dostosować te wartości, ustaw `chat_template_kwargs` w parametrach modelu.
    Jeśli ustawisz także `params.extra_body.chat_template_kwargs`, ta wartość ma
    ostateczny priorytet, ponieważ `extra_body` jest ostatnim nadpisaniem treści żądania.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Niestandardowy base URL">
    Jeśli serwer vLLM działa na niestandardowym hoście lub porcie, ustaw `baseUrl` w jawnej konfiguracji dostawcy:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
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
  <Accordion title="Serwer jest nieosiągalny">
    Sprawdź, czy serwer vLLM działa i jest dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli widzisz błąd połączenia, sprawdź host, port oraz to, czy vLLM zostało uruchomione w trybie serwera zgodnego z OpenAI.
    W przypadku jawnych punktów końcowych local loopback, LAN lub Tailscale ustaw też
    `models.providers.vllm.request.allowPrivateNetwork: true`; żądania dostawcy
    domyślnie blokują adresy URL sieci prywatnych, chyba że dostawca jest
    jawnie zaufany.

  </Accordion>

  <Accordion title="Błędy uwierzytelniania w żądaniach">
    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwe `VLLM_API_KEY`, które odpowiada konfiguracji serwera, albo skonfiguruj dostawcę jawnie w `models.providers.vllm`.

    <Tip>
    Jeśli serwer vLLM nie wymusza uwierzytelniania, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał włączenia dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nie wykryto modeli">
    Automatyczne wykrywanie wymaga ustawienia `VLLM_API_KEY` **oraz** braku jawnego wpisu konfiguracji `models.providers.vllm`. Jeśli dostawca został zdefiniowany ręcznie, OpenClaw pomija wykrywanie i używa tylko zadeklarowanych modeli.
  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny dostawca OpenAI i zachowanie trasy zgodnej z OpenAI.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego używania poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązania.
  </Card>
</CardGroup>
