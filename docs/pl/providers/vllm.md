---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem vLLM
    - Potrzebujesz punktów końcowych /v1 zgodnych z OpenAI dla własnych modeli
summary: Uruchom OpenClaw z vLLM (lokalny serwer zgodny z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:33:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM może obsługiwać modele open-source (oraz niektóre niestandardowe) przez **zgodne z OpenAI** HTTP API. OpenClaw łączy się z vLLM za pomocą API `openai-completions`.

OpenClaw może także **automatycznie wykrywać** dostępne modele z vLLM, gdy włączysz tę funkcję za pomocą `VLLM_API_KEY` (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania). Użyj `vllm/*` w `agents.defaults.models`, aby zachować dynamiczne wykrywanie, gdy konfigurujesz także niestandardowy bazowy URL vLLM.

OpenClaw traktuje `vllm` jako lokalnego dostawcę zgodnego z OpenAI, który obsługuje
strumieniowe rozliczanie użycia, dzięki czemu liczby tokenów statusu/kontekstu mogą być aktualizowane na podstawie
odpowiedzi `stream_options.include_usage`.

| Właściwość       | Wartość                                  |
| ---------------- | ---------------------------------------- |
| ID dostawcy      | `vllm`                                   |
| API              | `openai-completions` (zgodne z OpenAI)   |
| Uwierzytelnianie | zmienna środowiskowa `VLLM_API_KEY`      |
| Domyślny bazowy URL | `http://127.0.0.1:8000/v1`            |

## Pierwsze kroki

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Bazowy URL powinien udostępniać punkty końcowe `/v1` (np. `/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Zastąp jednym z identyfikatorów modeli vLLM:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Wykrywanie modeli (niejawny dostawca)

Gdy ustawiono `VLLM_API_KEY` (lub istnieje profil uwierzytelniania), a **nie** definiujesz `models.providers.vllm`, OpenClaw wysyła zapytanie:

```
GET http://127.0.0.1:8000/v1/models
```

i konwertuje zwrócone identyfikatory na wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.vllm`, OpenClaw domyślnie użyje zadeklarowanych przez Ciebie modeli. Dodaj `"vllm/*": {}` do `agents.defaults.models`, gdy chcesz, aby OpenClaw odpytywał punkt końcowy `/models` tego skonfigurowanego dostawcy i uwzględniał wszystkie reklamowane modele vLLM.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście lub porcie
- Chcesz przypiąć wartości `contextWindow` lub `maxTokens`
- Serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki)
- Łączysz się z zaufanym punktem końcowym vLLM przez loopback, LAN lub Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
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

Aby ten dostawca pozostał dynamiczny bez ręcznego wypisywania każdego modelu, dodaj wieloznaczny wpis dostawcy
do widocznego katalogu modeli:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM jest traktowany jako zgodny z OpenAI backend `/v1` w stylu proxy, a nie natywny
    punkt końcowy OpenAI. Oznacza to:

    | Zachowanie | Zastosowane? |
    |----------|----------|
    | Natywne kształtowanie żądań OpenAI | Nie |
    | `service_tier` | Nie wysyłane |
    | Responses `store` | Nie wysyłane |
    | Wskazówki pamięci podręcznej promptów | Nie wysyłane |
    | Kształtowanie ładunku zgodności rozumowania OpenAI | Nie stosowane |
    | Ukryte nagłówki atrybucji OpenClaw | Nie wstrzykiwane dla niestandardowych bazowych URL-i |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Dla modeli Qwen obsługiwanych przez vLLM ustaw
    `params.qwenThinkingFormat: "chat-template"` we wpisie modelu, gdy
    serwer oczekuje argumentów kwargs szablonu czatu Qwen. OpenClaw mapuje `/think off` na:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Poziomy myślenia inne niż `off` wysyłają `enable_thinking: true`. Jeśli Twój punkt końcowy
    oczekuje zamiast tego flag najwyższego poziomu w stylu DashScope, użyj
    `params.qwenThinkingFormat: "top-level"`, aby wysłać `enable_thinking` w korzeniu
    żądania. Akceptowane jest także `params.qwen_thinking_format` w snake-case.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 może używać kwargs szablonu czatu do kontrolowania, czy rozumowanie jest
    zwracane jako ukryte rozumowanie, czy widoczny tekst odpowiedzi. Gdy sesja OpenClaw
    używa `vllm/nemotron-3-*` z wyłączonym myśleniem, dołączony Plugin vLLM wysyła:

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

  <Accordion title="Qwen tool calls appear as text">
    Najpierw upewnij się, że vLLM uruchomiono z właściwym parserem wywołań narzędzi i szablonem czatu
    dla modelu. Na przykład vLLM dokumentuje `hermes` dla modeli Qwen2.5
    oraz `qwen3_xml` dla modeli Qwen3-Coder.

    Objawy:

    - Skills lub narzędzia nigdy się nie uruchamiają
    - asystent wypisuje surowy JSON/XML, taki jak `{"name":"read","arguments":...}`
    - vLLM zwraca pustą tablicę `tool_calls`, gdy OpenClaw wysyła
      `tool_choice: "auto"`

    Niektóre kombinacje Qwen/vLLM zwracają strukturalne wywołania narzędzi tylko wtedy, gdy
    żądanie używa `tool_choice: "required"`. Dla takich wpisów modeli wymuś
    zgodne z OpenAI pole żądania za pomocą `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Zastąp `Qwen-Qwen2.5-Coder-32B-Instruct` dokładnym identyfikatorem zwróconym przez:

    ```bash
    openclaw models list --provider vllm
    ```

    To samo nadpisanie możesz zastosować z CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    To jest opcjonalne obejście zgodności. Sprawia, że każdy krok modelu z
    narzędziami wymaga wywołania narzędzia, więc używaj go tylko dla dedykowanego wpisu modelu lokalnego,
    dla którego takie zachowanie jest akceptowalne. Nie używaj go jako globalnej wartości domyślnej dla wszystkich
    modeli vLLM i nie używaj proxy, które ślepo konwertuje dowolny
    tekst asystenta na wykonywalne wywołania narzędzi.

  </Accordion>

  <Accordion title="Custom base URL">
    Jeśli serwer vLLM działa na niedomyślnym hoście lub porcie, ustaw `baseUrl` w jawnej konfiguracji dostawcy:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
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
  <Accordion title="Slow first response or remote server timeout">
    Dla dużych modeli lokalnych, zdalnych hostów LAN lub łączy tailnet ustaw
    limit czasu żądania w zakresie dostawcy:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` dotyczy wyłącznie żądań HTTP modeli vLLM, w tym
    ustanawiania połączenia, nagłówków odpowiedzi, strumieniowania treści oraz całkowitego
    przerwania chronionego pobierania. Preferuj to rozwiązanie przed zwiększaniem
    `agents.defaults.timeoutSeconds`, które kontroluje cały przebieg agenta.

  </Accordion>

  <Accordion title="Server not reachable">
    Sprawdź, czy serwer vLLM działa i jest dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli widzisz błąd połączenia, zweryfikuj host, port oraz to, czy vLLM uruchomiono w trybie serwera zgodnego z OpenAI.
    Dla jawnych punktów końcowych loopback, LAN lub Tailscale ustaw także
    `models.providers.vllm.request.allowPrivateNetwork: true`; żądania dostawcy
    domyślnie blokują URL-e sieci prywatnych, chyba że dostawca jest
    jawnie zaufany.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy `VLLM_API_KEY`, który pasuje do konfiguracji serwera, lub jawnie skonfiguruj dostawcę w `models.providers.vllm`.

    <Tip>
    Jeśli serwer vLLM nie wymusza uwierzytelniania, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał zgody dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Automatyczne wykrywanie wymaga ustawienia `VLLM_API_KEY`. Jeśli zdefiniowano `models.providers.vllm`, OpenClaw używa tylko zadeklarowanych modeli, chyba że `agents.defaults.models` zawiera `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Jeśli model Qwen wypisuje składnię narzędzi JSON/XML zamiast wykonywać skill,
    sprawdź wskazówki dotyczące Qwen w sekcji Konfiguracja zaawansowana powyżej. Typowa poprawka to:

    - uruchomienie vLLM z poprawnym parserem/szablonem dla tego modelu
    - potwierdzenie dokładnego identyfikatora modelu za pomocą `openclaw models list --provider vllm`
    - dodanie dedykowanego dla modelu nadpisania `params.extra_body.tool_choice: "required"`
      tylko jeśli `tool_choice: "auto"` nadal zwraca puste lub wyłącznie tekstowe
      wywołania narzędzi

  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) oraz [FAQ](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny dostawca OpenAI i zachowanie trasy zgodnej z OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązywania.
  </Card>
</CardGroup>
