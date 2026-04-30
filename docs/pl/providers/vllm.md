---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem vLLM
    - Chcesz punktów końcowych /v1 zgodnych z OpenAI dla własnych modeli
summary: Uruchom OpenClaw z vLLM (lokalny serwer zgodny z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-30T10:15:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM może obsługiwać modele open-source (oraz niektóre niestandardowe) przez **zgodny z OpenAI** interfejs API HTTP. OpenClaw łączy się z vLLM za pomocą API `openai-completions`.

OpenClaw może też **automatycznie wykrywać** dostępne modele z vLLM, gdy włączysz tę funkcję przez `VLLM_API_KEY` (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania) i nie zdefiniujesz jawnego wpisu `models.providers.vllm`.

OpenClaw traktuje `vllm` jako lokalnego dostawcę zgodnego z OpenAI, który obsługuje
strumieniowe rozliczanie użycia, więc liczby tokenów statusu/kontekstu mogą być aktualizowane z
odpowiedzi `stream_options.include_usage`.

| Właściwość          | Wartość                                  |
| ------------------- | ---------------------------------------- |
| ID dostawcy         | `vllm`                                   |
| API                 | `openai-completions` (zgodne z OpenAI)   |
| Uwierzytelnianie    | zmienna środowiskowa `VLLM_API_KEY`      |
| Domyślny bazowy URL | `http://127.0.0.1:8000/v1`               |

## Pierwsze kroki

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Bazowy URL powinien udostępniać endpointy `/v1` (np. `/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

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

Gdy `VLLM_API_KEY` jest ustawiony (lub istnieje profil uwierzytelniania) i **nie** definiujesz `models.providers.vllm`, OpenClaw wysyła zapytanie do:

```
GET http://127.0.0.1:8000/v1/models
```

i konwertuje zwrócone identyfikatory na wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.vllm`, automatyczne wykrywanie zostanie pominięte i musisz zdefiniować modele ręcznie.
</Note>

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście lub porcie
- Chcesz przypiąć wartości `contextWindow` lub `maxTokens`
- Serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki)
- Łączysz się z zaufanym endpointem vLLM przez loopback, LAN lub Tailscale

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

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    vLLM jest traktowany jako zgodny z OpenAI backend `/v1` w stylu proxy, a nie jako natywny
    endpoint OpenAI. Oznacza to:

    | Zachowanie | Zastosowane? |
    |----------|----------|
    | Natywne kształtowanie żądań OpenAI | Nie |
    | `service_tier` | Nie wysyłane |
    | `store` odpowiedzi | Nie wysyłane |
    | Wskazówki prompt-cache | Nie wysyłane |
    | Kształtowanie payloadu zgodności rozumowania OpenAI | Nie stosowane |
    | Ukryte nagłówki atrybucji OpenClaw | Nie wstrzykiwane przy niestandardowych bazowych URL-ach |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    W przypadku modeli Qwen obsługiwanych przez vLLM ustaw
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

    Poziomy myślenia inne niż `off` wysyłają `enable_thinking: true`. Jeśli endpoint
    oczekuje zamiast tego flag najwyższego poziomu w stylu DashScope, użyj
    `params.qwenThinkingFormat: "top-level"`, aby wysłać `enable_thinking` w katalogu głównym
    żądania. Akceptowane jest również `params.qwen_thinking_format` w zapisie snake case.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 może używać kwargs szablonu czatu do kontrolowania, czy rozumowanie jest
    zwracane jako ukryte rozumowanie czy widoczny tekst odpowiedzi. Gdy sesja OpenClaw
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
    Jeśli ustawisz również `params.extra_body.chat_template_kwargs`, ta wartość ma
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
    Najpierw upewnij się, że vLLM został uruchomiony z właściwym parserem wywołań narzędzi i szablonem czatu
    dla modelu. Na przykład vLLM dokumentuje `hermes` dla modeli Qwen2.5
    oraz `qwen3_xml` dla modeli Qwen3-Coder.

    Objawy:

    - Skills lub narzędzia nigdy się nie uruchamiają
    - asystent wypisuje surowy JSON/XML, taki jak `{"name":"read","arguments":...}`
    - vLLM zwraca pustą tablicę `tool_calls`, gdy OpenClaw wysyła
      `tool_choice: "auto"`

    Niektóre kombinacje Qwen/vLLM zwracają ustrukturyzowane wywołania narzędzi tylko wtedy, gdy
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

    Możesz zastosować to samo nadpisanie z CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    To opcjonalne obejście zgodności. Sprawia, że każda tura modelu z
    narzędziami wymaga wywołania narzędzia, więc używaj go tylko dla dedykowanego wpisu lokalnego modelu,
    gdzie takie zachowanie jest akceptowalne. Nie używaj go jako globalnej wartości domyślnej dla wszystkich
    modeli vLLM i nie używaj proxy, które bezrefleksyjnie konwertuje dowolny
    tekst asystenta na wykonywalne wywołania narzędzi.

  </Accordion>

  <Accordion title="Custom base URL">
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
    W przypadku dużych modeli lokalnych, zdalnych hostów LAN lub połączeń tailnet ustaw
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

    `timeoutSeconds` dotyczy tylko żądań HTTP modeli vLLM, w tym
    ustanawiania połączenia, nagłówków odpowiedzi, strumieniowania treści oraz całkowitego
    przerwania chronionego pobierania. Preferuj to przed zwiększaniem
    `agents.defaults.timeoutSeconds`, które kontroluje cały przebieg agenta.

  </Accordion>

  <Accordion title="Server not reachable">
    Sprawdź, czy serwer vLLM działa i jest dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli widzisz błąd połączenia, zweryfikuj host, port oraz to, czy vLLM został uruchomiony w trybie serwera zgodnego z OpenAI.
    Dla jawnych endpointów loopback, LAN lub Tailscale ustaw również
    `models.providers.vllm.request.allowPrivateNetwork: true`; żądania dostawcy
    domyślnie blokują URL-e sieci prywatnych, chyba że dostawca jest
    jawnie zaufany.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy `VLLM_API_KEY`, który pasuje do konfiguracji serwera, albo skonfiguruj dostawcę jawnie w `models.providers.vllm`.

    <Tip>
    Jeśli serwer vLLM nie wymusza uwierzytelniania, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał opt-in dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Automatyczne wykrywanie wymaga ustawienia `VLLM_API_KEY` **oraz** braku jawnego wpisu konfiguracji `models.providers.vllm`. Jeśli dostawca został zdefiniowany ręcznie, OpenClaw pomija wykrywanie i używa tylko zadeklarowanych modeli.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Jeśli model Qwen wypisuje składnię narzędzi JSON/XML zamiast wykonywać skill,
    sprawdź wskazówki dotyczące Qwen w sekcji Konfiguracja zaawansowana powyżej. Typowa poprawka to:

    - uruchomienie vLLM z poprawnym parserem/szablonem dla tego modelu
    - potwierdzenie dokładnego identyfikatora modelu za pomocą `openclaw models list --provider vllm`
    - dodanie dedykowanego nadpisania per model `params.extra_body.tool_choice: "required"`
      tylko wtedy, gdy `tool_choice: "auto"` nadal zwraca puste lub wyłącznie tekstowe
      wywołania narzędzi

  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny dostawca OpenAI i zachowanie tras zgodnych z OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego używania poświadczeń.
  </Card>
  <Card title="Troubleshooting" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązania.
  </Card>
</CardGroup>
