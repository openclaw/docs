---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem vLLM
    - Chcesz punktów końcowych /v1 zgodnych z OpenAI, działających z Twoimi własnymi modelami
summary: Uruchamianie OpenClaw z vLLM (lokalnym serwerem zgodnym z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T15:32:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM udostępnia modele open source (oraz niektóre modele niestandardowe) przez interfejs HTTP API **zgodny z OpenAI**. OpenClaw łączy się za pomocą API `openai-completions` i może **automatycznie wykrywać** modele po wyrażeniu zgody przez ustawienie `VLLM_API_KEY`.

| Właściwość             | Wartość                                    |
| ---------------------- | ------------------------------------------ |
| Identyfikator dostawcy | `vllm`                                     |
| API                    | `openai-completions` (zgodne z OpenAI)     |
| Uwierzytelnianie       | zmienna środowiskowa `VLLM_API_KEY`        |
| Domyślny bazowy URL    | `http://127.0.0.1:8000/v1`                 |
| Użycie strumieniowe    | Obsługiwane (`stream_options.include_usage`) |

## Pierwsze kroki

<Steps>
  <Step title="Uruchom vLLM z serwerem zgodnym z OpenAI">
    Bazowy URL musi udostępniać punkty końcowe `/v1` (`/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Ustaw zmienną środowiskową klucza API">
    Jeśli serwer nie wymusza uwierzytelniania, zadziała dowolna niepusta wartość:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Wybierz model">
    Zastąp wartość jednym z identyfikatorów modeli vLLM:

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

<Tip>
W przypadku konfiguracji nieinteraktywnej (CI, skrypty) przekaż bezpośrednio bazowy URL, klucz i model:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Wykrywanie modeli (dostawca niejawny)

Gdy ustawiono `VLLM_API_KEY` (lub istnieje profil uwierzytelniania), a `models.providers.vllm` **nie** jest zdefiniowane, OpenClaw wysyła zapytanie `GET http://127.0.0.1:8000/v1/models` i przekształca zwrócone identyfikatory we wpisy modeli.

<Note>
Jeśli jawnie ustawisz `models.providers.vllm`, OpenClaw użyje wyłącznie zadeklarowanych modeli. Dodaj `"vllm/*": {}` do `agents.defaults.models`, aby OpenClaw również odpytywał punkt końcowy `/models` skonfigurowanego dostawcy i uwzględniał wszystkie ogłaszane modele vLLM.
</Note>

## Konfiguracja jawna

Skonfiguruj dostawcę jawnie, gdy vLLM działa na innym hoście lub porcie, chcesz ustalić wartości `contextWindow`/`maxTokens`, serwer wymaga prawdziwego klucza API albo łączysz się z zaufanym punktem końcowym loopback, LAN lub Tailscale:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

Aby zachować dynamicznego dostawcę bez wymieniania każdego modelu, dodaj symbol wieloznaczny do widocznego katalogu modeli:

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
  <Accordion title="Działanie w stylu serwera proxy">
    vLLM jest traktowany jako zgodne z OpenAI zaplecze `/v1` działające w stylu serwera proxy, a nie jako natywny punkt końcowy OpenAI:

    | Zachowanie                                      | Zastosowano?                                      |
    | ----------------------------------------------- | ------------------------------------------------- |
    | Natywne kształtowanie żądań OpenAI              | Nie                                               |
    | `service_tier`                                  | Nie jest wysyłane                                 |
    | `store` interfejsu Responses                    | Nie jest wysyłane                                 |
    | Wskazówki pamięci podręcznej promptów            | Nie są wysyłane                                   |
    | Kształtowanie ładunku zgodności rozumowania OpenAI | Nie jest stosowane                              |
    | Ukryte nagłówki atrybucji OpenClaw              | Nie są dodawane dla niestandardowych bazowych URL-i |

  </Accordion>

  <Accordion title="Sterowanie rozumowaniem Qwen">
    W przypadku modeli Qwen ustaw `compat.thinkingFormat: "qwen-chat-template"` we wpisie modelu, gdy serwer oczekuje argumentów szablonu czatu Qwen. Modele te udostępniają binarny profil `/think` (`off`, `on`), ponieważ rozumowanie w szablonie czatu Qwen jest przełącznikiem włączone/wyłączone, a nie skalą poziomu wysiłku w stylu OpenAI.

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

    Poziomy rozumowania inne niż `off` wysyłają `enable_thinking: true`. Jeśli punkt końcowy oczekuje zamiast tego flag najwyższego poziomu w stylu DashScope, użyj `compat.thinkingFormat: "qwen"`, aby wysyłać `enable_thinking` w głównym obiekcie żądania.

  </Accordion>

  <Accordion title="Sterowanie rozumowaniem Nemotron 3">
    W przypadku modeli `vllm/nemotron-3-*` z wyłączonym rozumowaniem dołączony Plugin wysyła:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Aby dostosować te wartości, ustaw `chat_template_kwargs` w parametrach modelu. Jeśli ustawisz również `params.extra_body.chat_template_kwargs`, ta wartość ma pierwszeństwo, ponieważ `extra_body` jest ostatnim nadpisaniem treści żądania.

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
    Najpierw potwierdź, że vLLM został uruchomiony z właściwym parserem wywołań narzędzi oraz szablonem czatu dla danego modelu. Dokumentacja vLLM wskazuje `hermes` dla modeli Qwen2.5 i `qwen3_xml` dla modeli Qwen3-Coder.

    Objawy: Skills/narzędzia nigdy się nie uruchamiają, asystent wyświetla surowy kod JSON/XML, taki jak `{"name":"read","arguments":...}`, albo vLLM zwraca pustą tablicę `tool_calls`, gdy OpenClaw wysyła `tool_choice: "auto"`.

    Niektóre kombinacje Qwen/vLLM zwracają ustrukturyzowane wywołania narzędzi tylko wtedy, gdy żądanie używa `tool_choice: "required"`. Wymuś to osobno dla modelu za pomocą `params.extra_body`:

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

    Zastąp identyfikator modelu dokładnym identyfikatorem zwróconym przez `openclaw models list --provider vllm` albo zastosuj to samo nadpisanie za pomocą CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Jest to opcjonalne obejście wymagające jawnego włączenia: wymusza ono wywołanie narzędzia w każdej turze z narzędziami, dlatego używaj go tylko dla osobnego wpisu modelu, w którym takie działanie jest akceptowalne. Nie ustawiaj go jako globalnej wartości domyślnej dla wszystkich modeli vLLM i nie łącz go z serwerem proxy, który przekształca dowolny tekst asystenta w wykonywalne wywołania narzędzi.

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
  <Accordion title="Powolna pierwsza odpowiedź lub przekroczenie limitu czasu serwera zdalnego">
    W przypadku dużych modeli lokalnych, zdalnych hostów LAN lub połączeń w sieci tailnet ustaw limit czasu żądania dla dostawcy:

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

    `timeoutSeconds` dotyczy wyłącznie żądań HTTP modeli vLLM: ustanawiania połączenia, nagłówków odpowiedzi, strumieniowania treści oraz całkowitego przerwania chronionego pobierania. Podnosi również limit mechanizmu nadzorującego bezczynność/strumień LLM ponad niejawną domyślną wartość około 120 sekund dla tego dostawcy. Preferuj tę opcję zamiast zwiększania `agents.defaults.timeoutSeconds`, które kontroluje całe uruchomienie agenta.

  </Accordion>

  <Accordion title="Serwer jest nieosiągalny">
    Sprawdź, czy serwer vLLM jest uruchomiony i dostępny:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Jeśli wystąpi błąd połączenia, sprawdź host, port oraz czy vLLM został uruchomiony w trybie serwera zgodnego z OpenAI. OpenClaw ufa dokładnemu źródłu skonfigurowanemu w `models.providers.vllm.baseUrl` dla chronionych żądań modeli kierowanych do punktów końcowych loopback, LAN i Tailscale. Źródła metadanych i adresy link-local pozostają zablokowane bez jawnej zgody. Ustaw `models.providers.vllm.request.allowPrivateNetwork: true` tylko wtedy, gdy żądania vLLM muszą docierać do innego prywatnego źródła, albo `false`, aby wyłączyć zaufanie do dokładnie wskazanego źródła.

  </Accordion>

  <Accordion title="Błędy uwierzytelniania żądań">
    Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwy `VLLM_API_KEY`, który odpowiada konfiguracji serwera, albo skonfiguruj dostawcę jawnie w `models.providers.vllm`.

    <Tip>
    Jeśli serwer vLLM nie wymusza uwierzytelniania, dowolna niepusta wartość `VLLM_API_KEY` działa jako sygnał zgody dla OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Nie wykryto modeli">
    Automatyczne wykrywanie wymaga ustawienia `VLLM_API_KEY`. Jeśli zdefiniowano `models.providers.vllm`, OpenClaw używa wyłącznie zadeklarowanych modeli, chyba że `agents.defaults.models` zawiera `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Narzędzia są wyświetlane jako surowy tekst">
    Jeśli model Qwen wyświetla składnię narzędzi JSON/XML zamiast wykonywać Skill:

    - Uruchom vLLM z właściwym parserem/szablonem dla tego modelu.
    - Potwierdź dokładny identyfikator modelu za pomocą `openclaw models list --provider vllm`.
    - Dodaj osobne dla danego modelu nadpisanie `params.extra_body.tool_choice: "required"` tylko wtedy, gdy `tool_choice: "auto"` nadal zwraca puste lub wyłącznie tekstowe wywołania narzędzi.

  </Accordion>
</AccordionGroup>

<Warning>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Często zadawane pytania](/pl/help/faq).
</Warning>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu przełączania awaryjnego.
  </Card>
  <Card title="OpenAI" href="/pl/providers/openai" icon="bolt">
    Natywny dostawca OpenAI i działanie tras zgodnych z OpenAI.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego używania poświadczeń.
  </Card>
  <Card title="Rozwiązywanie problemów" href="/pl/help/troubleshooting" icon="wrench">
    Typowe problemy i sposoby ich rozwiązywania.
  </Card>
</CardGroup>
