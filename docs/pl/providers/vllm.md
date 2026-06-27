---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem vLLM
    - Chcesz punktów końcowych /v1 zgodnych z OpenAI dla własnych modeli
summary: Uruchamianie OpenClaw z vLLM (lokalny serwer zgodny z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:16:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM może udostępniać modele open-source (i niektóre niestandardowe) przez **zgodne z OpenAI** API HTTP. OpenClaw łączy się z vLLM przy użyciu API `openai-completions`.

OpenClaw może też **automatycznie wykrywać** modele dostępne w vLLM, gdy włączysz tę opcję przez `VLLM_API_KEY` (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania). Użyj `vllm/*` w `agents.defaults.models`, aby zachować dynamiczne wykrywanie, gdy konfigurujesz także niestandardowy bazowy URL vLLM.

OpenClaw traktuje `vllm` jako lokalnego dostawcę zgodnego z OpenAI, który obsługuje
strumieniowe rozliczanie użycia, dzięki czemu liczby tokenów statusu/kontekstu mogą aktualizować się na podstawie
odpowiedzi `stream_options.include_usage`.

| Właściwość       | Wartość                                  |
| ---------------- | ---------------------------------------- |
| ID dostawcy      | `vllm`                                   |
| API              | `openai-completions` (zgodne z OpenAI)   |
| Uwierzytelnianie | zmienna środowiskowa `VLLM_API_KEY`      |
| Domyślny bazowy URL | `http://127.0.0.1:8000/v1`            |

## Pierwsze kroki

<Steps>
  <Step title="Uruchom vLLM z serwerem zgodnym z OpenAI">
    Bazowy URL powinien udostępniać punkty końcowe `/v1` (np. `/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

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
  <Step title="Sprawdź, czy model jest dostępny">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Wykrywanie modeli (dostawca niejawny)

Gdy `VLLM_API_KEY` jest ustawiony (lub istnieje profil uwierzytelniania) i **nie** definiujesz `models.providers.vllm`, OpenClaw wysyła zapytanie do:

```
GET http://127.0.0.1:8000/v1/models
```

i konwertuje zwrócone identyfikatory na wpisy modeli.

<Note>
Jeśli ustawisz `models.providers.vllm` jawnie, OpenClaw domyślnie używa zadeklarowanych przez Ciebie modeli. Dodaj `"vllm/*": {}` do `agents.defaults.models`, gdy chcesz, aby OpenClaw odpytywał punkt końcowy `/models` tego skonfigurowanego dostawcy i uwzględniał wszystkie ogłaszane modele vLLM.
</Note>

## Konfiguracja jawna (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście lub porcie
- Chcesz przypiąć wartości `contextWindow` lub `maxTokens`
- Serwer wymaga prawdziwego klucza API (lub chcesz kontrolować nagłówki)
- Łączysz się z zaufanym punktem końcowym vLLM w loopback, LAN lub Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Opcjonalnie: wydłuża limit czasu połączenia/nagłówków/treści/żądania dla wolnych modeli lokalnych
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

Aby zachować dynamiczność tego dostawcy bez ręcznego wypisywania każdego modelu, dodaj
symbol wieloznaczny dostawcy do widocznego katalogu modeli:

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
  <Accordion title="Zachowanie w stylu proxy">
    vLLM jest traktowany jako backend `/v1` w stylu proxy zgodny z OpenAI, a nie jako natywny
    punkt końcowy OpenAI. Oznacza to:

    | Zachowanie | Zastosowane? |
    |----------|----------|
    | Natywne kształtowanie żądań OpenAI | Nie |
    | `service_tier` | Nie wysyłane |
    | `store` w Responses | Nie wysyłane |
    | Wskazówki pamięci podręcznej promptów | Nie wysyłane |
    | Kształtowanie ładunku zgodności reasoning OpenAI | Nie stosowane |
    | Ukryte nagłówki atrybucji OpenClaw | Nie wstrzykiwane przy niestandardowych bazowych URL-ach |

  </Accordion>

  <Accordion title="Kontrolki myślenia Qwen">
    W przypadku modeli Qwen udostępnianych przez vLLM ustaw
    `compat.thinkingFormat: "qwen-chat-template"` w wierszu modelu skonfigurowanego dostawcy,
    gdy serwer oczekuje argumentów kwargs szablonu czatu Qwen. Modele
    skonfigurowane w ten sposób udostępniają binarny profil `/think` (`off`, `on`), ponieważ
    myślenie szablonu Qwen jest flagą żądania włącz/wyłącz, a nie drabiną wysiłku
    w stylu OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw mapuje `/think off` na:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Poziomy myślenia inne niż `off` wysyłają `enable_thinking: true`. Jeśli punkt końcowy
    oczekuje zamiast tego flag najwyższego poziomu w stylu DashScope, użyj
    `compat.thinkingFormat: "qwen"`, aby wysłać `enable_thinking` w katalogu głównym
    żądania.

  </Accordion>

  <Accordion title="Kontrolki myślenia Nemotron 3">
    vLLM/Nemotron 3 może używać kwargs szablonu czatu do kontrolowania, czy reasoning jest
    zwracany jako ukryty reasoning, czy widoczny tekst odpowiedzi. Gdy sesja OpenClaw
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

  <Accordion title="Wywołania narzędzi Qwen pojawiają się jako tekst">
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
    pole żądania zgodne z OpenAI za pomocą `params.extra_body`:

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

    To obejście zgodności wymagające świadomego włączenia. Sprawia, że każda tura modelu z
    narzędziami wymaga wywołania narzędzia, więc używaj go tylko dla dedykowanego lokalnego wpisu modelu,
    w którym takie zachowanie jest akceptowalne. Nie używaj go jako globalnej wartości domyślnej dla wszystkich
    modeli vLLM i nie używaj proxy, które ślepo konwertuje dowolny
    tekst asystenta na wykonywalne wywołania narzędzi.

  </Accordion>

  <Accordion title="Niestandardowy bazowy URL">
    Jeśli serwer vLLM działa na hoście lub porcie innym niż domyślny, ustaw `baseUrl` w jawnej konfiguracji dostawcy:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
  <Accordion title="Wolna pierwsza odpowiedź lub limit czasu serwera zdalnego">
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
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` dotyczy tylko żądań HTTP modeli vLLM, w tym
    zestawiania połączenia, nagłówków odpowiedzi, strumieniowania treści oraz łącznego
    przerwania chronionego pobierania. Preferuj to przed zwiększaniem
    `agents.defaults.timeoutSeconds`, które kontroluje cały przebieg agenta.

  </Accordion>

  <Accordion title="Serwer nieosiągalny">
    Sprawdź, czy serwer vLLM działa i jest dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli widzisz błąd połączenia, sprawdź host, port oraz czy vLLM został uruchomiony w trybie serwera zgodnego z OpenAI.
    W przypadku jawnych punktów końcowych loopback, LAN lub Tailscale OpenClaw ufa
    dokładnemu skonfigurowanemu źródłu `models.providers.vllm.baseUrl` dla chronionych żądań modelu.
    Źródła metadanych/link-local pozostają blokowane bez jawnego
    włączenia. Ustaw `models.providers.vllm.request.allowPrivateNetwork: true` tylko
    wtedy, gdy żądania vLLM muszą docierać do innego prywatnego źródła, i ustaw `false`,
    aby zrezygnować z zaufania dokładnemu źródłu.

  </Accordion>

  <Accordion title="Błędy uwierzytelniania w żądaniach">
    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy `VLLM_API_KEY` zgodny z konfiguracją serwera albo skonfiguruj dostawcę jawnie w `models.providers.vllm`.

    <Tip>
    Jeśli serwer vLLM nie wymusza uwierzytelniania, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał świadomego włączenia dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nie wykryto żadnych modeli">
    Automatyczne wykrywanie wymaga ustawienia `VLLM_API_KEY`. Jeśli zdefiniowano `models.providers.vllm`, OpenClaw używa tylko zadeklarowanych modeli, chyba że `agents.defaults.models` zawiera `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Narzędzia renderują się jako surowy tekst">
    Jeśli model Qwen wypisuje składnię narzędzi JSON/XML zamiast wykonać skill,
    sprawdź wskazówki dotyczące Qwen w sekcji Konfiguracja zaawansowana powyżej. Typowa poprawka to:

    - uruchomienie vLLM z poprawnym parserem/szablonem dla tego modelu
    - potwierdzenie dokładnego identyfikatora modelu za pomocą `openclaw models list --provider vllm`
    - dodanie dedykowanego nadpisania `params.extra_body.tool_choice: "required"`
      dla konkretnego modelu tylko wtedy, gdy `tool_choice: "auto"` nadal zwraca puste lub wyłącznie tekstowe
      wywołania narzędzi

  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny dostawca OpenAI i zachowanie tras zgodnych z OpenAI.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązywania.
  </Card>
</CardGroup>
