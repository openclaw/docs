---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami chmurowymi lub lokalnymi przez Ollama
    - Potrzebujesz wskazówek dotyczących konfiguracji i ustawień Ollama
    - Chcesz używać modeli vision Ollama do rozumienia obrazów
summary: Uruchamianie OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T04:28:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32623b6523f22930a5987fb22d2074f1e9bb274cc01ae1ad1837825cc04ec179
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw integruje się z natywnym API Ollama (`/api/chat`) dla hostowanych modeli chmurowych oraz lokalnych/self-hosted serwerów Ollama. Z Ollama można korzystać w trzech trybach: `Cloud + Local` przez osiągalny host Ollama, `Cloud only` względem `https://ollama.com` lub `Local only` względem osiągalnego hosta Ollama.

<Warning>
**Użytkownicy zdalnego Ollama**: nie używaj URL-a zgodnego z OpenAI `/v1` (`http://host:11434/v1`) z OpenClaw. To psuje wywoływanie narzędzi i modele mogą wypisywać surowy JSON narzędzi jako zwykły tekst. Zamiast tego użyj natywnego URL-a API Ollama: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

## Pierwsze kroki

Wybierz preferowaną metodę konfiguracji i tryb.

<Tabs>
  <Tab title="Onboarding (zalecane)">
    **Najlepsze dla:** najszybszej drogi do działającej konfiguracji Ollama cloud lub local.

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        ```

        Wybierz **Ollama** z listy providerów.
      </Step>
      <Step title="Wybierz tryb">
        - **Cloud + Local** — lokalny host Ollama plus modele chmurowe routowane przez ten host
        - **Cloud only** — hostowane modele Ollama przez `https://ollama.com`
        - **Local only** — tylko modele lokalne
      </Step>
      <Step title="Wybierz model">
        `Cloud only` prosi o `OLLAMA_API_KEY` i sugeruje domyślne modele chmurowe. `Cloud + Local` oraz `Local only` proszą o bazowy URL Ollama, wykrywają dostępne modele i automatycznie wykonują pull wybranego modelu lokalnego, jeśli nie jest jeszcze dostępny. `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu chmurowego.
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Tryb nieinteraktywny

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    Opcjonalnie podaj niestandardowy base URL lub model:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Konfiguracja ręczna">
    **Najlepsze dla:** pełnej kontroli nad konfiguracją cloud lub local.

    <Steps>
      <Step title="Wybierz cloud lub local">
        - **Cloud + Local**: zainstaluj Ollama, zaloguj się przez `ollama signin` i kieruj żądania chmurowe przez ten host
        - **Cloud only**: użyj `https://ollama.com` z `OLLAMA_API_KEY`
        - **Local only**: zainstaluj Ollama z [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Pobierz model lokalny (tylko local)">
        ```bash
        ollama pull gemma4
        # lub
        ollama pull gpt-oss:20b
        # lub
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Włącz Ollama dla OpenClaw">
        Dla `Cloud only` użyj prawdziwego `OLLAMA_API_KEY`. Dla konfiguracji opartych na hoście działa dowolna wartość zastępcza:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Tylko local
        export OLLAMA_API_KEY="ollama-local"

        # Albo skonfiguruj w pliku konfiguracyjnym
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź i ustaw model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Lub ustaw wartość domyślną w konfiguracji:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Modele chmurowe

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` używa osiągalnego hosta Ollama jako punktu sterowania zarówno dla modeli lokalnych, jak i chmurowych. To preferowany przez Ollama przepływ hybrydowy.

    Użyj **Cloud + Local** podczas konfiguracji. OpenClaw prosi o bazowy URL Ollama, wykrywa modele lokalne z tego hosta i sprawdza, czy host jest zalogowany do dostępu chmurowego przez `ollama signin`. Gdy host jest zalogowany, OpenClaw sugeruje też domyślne modele hostowane w chmurze, takie jak `kimi-k2.5:cloud`, `minimax-m2.7:cloud` i `glm-5.1:cloud`.

    Jeśli host nie jest jeszcze zalogowany, OpenClaw utrzymuje konfigurację tylko lokalną, dopóki nie uruchomisz `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` działa względem hostowanego API Ollama pod `https://ollama.com`.

    Użyj **Cloud only** podczas konfiguracji. OpenClaw prosi o `OLLAMA_API_KEY`, ustawia `baseUrl: "https://ollama.com"` i inicjalizuje listę hostowanych modeli chmurowych. Ta ścieżka **nie** wymaga lokalnego serwera Ollama ani `ollama signin`.

    Lista modeli chmurowych pokazywana podczas `openclaw onboard` jest wypełniana na żywo z `https://ollama.com/api/tags`, z limitem do 500 wpisów, więc selektor odzwierciedla bieżący katalog hostowany zamiast statycznej listy początkowej. Jeśli `ollama.com` jest nieosiągalne albo nie zwraca modeli w czasie konfiguracji, OpenClaw wraca awaryjnie do poprzednich twardo zakodowanych sugestii, aby onboarding nadal mógł się zakończyć.

  </Tab>

  <Tab title="Local only">
    W trybie tylko lokalnym OpenClaw wykrywa modele z skonfigurowanej instancji Ollama. Ta ścieżka jest przeznaczona dla lokalnych lub self-hosted serwerów Ollama.

    OpenClaw obecnie sugeruje `gemma4` jako lokalny model domyślny.

  </Tab>
</Tabs>

## Wykrywanie modeli (provider niejawny)

Gdy ustawisz `OLLAMA_API_KEY` (lub profil uwierzytelniania) i **nie** zdefiniujesz `models.providers.ollama`, OpenClaw wykrywa modele z lokalnej instancji Ollama pod `http://127.0.0.1:11434`.

| Zachowanie           | Szczegóły                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zapytanie katalogu   | Odpytuje `/api/tags`                                                                                                                                               |
| Wykrywanie możliwości | Używa mechanizmu best-effort przez `/api/show`, aby odczytać `contextWindow` i wykryć możliwości (w tym vision)                                                  |
| Modele vision        | Modele z możliwością `vision` zgłaszaną przez `/api/show` są oznaczane jako obsługujące obrazy (`input: ["text", "image"]`), więc OpenClaw automatycznie wstrzykuje obrazy do promptu |
| Wykrywanie reasoning | Oznacza `reasoning` heurystyką nazwy modelu (`r1`, `reasoning`, `think`)                                                                                           |
| Limity tokenów       | Ustawia `maxTokens` na domyślny limit maksymalnych tokenów Ollama używany przez OpenClaw                                                                           |
| Koszty               | Ustawia wszystkie koszty na `0`                                                                                                                                     |

Pozwala to uniknąć ręcznych wpisów modeli, a jednocześnie utrzymać zgodność katalogu z lokalną instancją Ollama.

```bash
# Zobacz, jakie modele są dostępne
ollama list
openclaw models list
```

Aby dodać nowy model, po prostu pobierz go przez Ollama:

```bash
ollama pull mistral
```

Nowy model zostanie automatycznie wykryty i będzie dostępny do użycia.

<Note>
Jeśli jawnie ustawisz `models.providers.ollama`, automatyczne wykrywanie zostanie pominięte i modele trzeba będzie zdefiniować ręcznie. Zobacz sekcję jawnej konfiguracji poniżej.
</Note>

## Vision i opis obrazów

Bundled plugin Ollama rejestruje Ollama jako providera media-understanding obsługującego obrazy. Dzięki temu OpenClaw może kierować jawne żądania opisu obrazów oraz skonfigurowane domyślne modele obrazów przez lokalne lub hostowane modele vision Ollama.

Dla lokalnego vision pobierz model obsługujący obrazy:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Następnie zweryfikuj to przez infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` musi być pełnym refem `<provider/model>`. Gdy jest ustawione, `openclaw infer image describe` uruchamia ten model bezpośrednio zamiast pomijać opis, ponieważ model obsługuje natywny vision.

Aby Ollama było domyślnym modelem media-understanding dla przychodzących mediów, skonfiguruj `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Jeśli definiujesz `models.providers.ollama.models` ręcznie, oznacz modele vision jako obsługujące wejście obrazu:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw odrzuca żądania opisu obrazów dla modeli, które nie są oznaczone jako obsługujące obrazy. Przy wykrywaniu niejawnym OpenClaw odczytuje to z Ollama, gdy `/api/show` zgłasza możliwość vision.

## Konfiguracja

<Tabs>
  <Tab title="Podstawowa (wykrywanie niejawne)">
    Najprostsza ścieżka włączenia tylko lokalnego odbywa się przez zmienną środowiskową:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jeśli ustawiono `OLLAMA_API_KEY`, możesz pominąć `apiKey` we wpisie providera, a OpenClaw uzupełni je podczas sprawdzania dostępności.
    </Tip>

  </Tab>

  <Tab title="Jawna (ręczne modele)">
    Użyj jawnej konfiguracji, gdy chcesz hostowanej konfiguracji cloud, Ollama działa na innym hoście/porcie, chcesz wymusić określone okna kontekstu lub listy modeli albo potrzebujesz w pełni ręcznych definicji modeli.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Niestandardowy base URL">
    Jeśli Ollama działa na innym hoście lub porcie (jawna konfiguracja wyłącza automatyczne wykrywanie, więc modele trzeba zdefiniować ręcznie):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Bez /v1 - użyj natywnego URL-a API Ollama
            api: "ollama", // Ustaw jawnie, aby zagwarantować natywne zachowanie wywoływania narzędzi
          },
        },
      },
    }
    ```

    <Warning>
    Nie dodawaj `/v1` do URL-a. Ścieżka `/v1` używa trybu zgodnego z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne. Użyj bazowego URL-a Ollama bez sufiksu ścieżki.
    </Warning>

  </Tab>
</Tabs>

### Wybór modelu

Po skonfigurowaniu wszystkie Twoje modele Ollama są dostępne:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw obsługuje **Ollama Web Search** jako bundled providera `web_search`.

| Właściwość | Szczegóły                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Host       | Używa skonfigurowanego hosta Ollama (`models.providers.ollama.baseUrl`, jeśli ustawione, w przeciwnym razie `http://127.0.0.1:11434`) |
| Uwierzytelnianie | Bez klucza                                                                                                   |
| Wymaganie  | Ollama musi działać i być zalogowane przez `ollama signin`                                                          |

Wybierz **Ollama Web Search** podczas `openclaw onboard` lub `openclaw configure --section web`, albo ustaw:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Pełne szczegóły konfiguracji i działania znajdziesz w [Ollama Web Search](/pl/tools/ollama-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Starszy tryb zgodny z OpenAI">
    <Warning>
    **Wywoływanie narzędzi nie jest niezawodne w trybie zgodnym z OpenAI.** Używaj tego trybu tylko wtedy, gdy potrzebujesz formatu OpenAI dla proxy i nie zależy Ci na natywnym zachowaniu wywoływania narzędzi.
    </Warning>

    Jeśli zamiast tego musisz używać endpointu zgodnego z OpenAI (na przykład za proxy, które obsługuje tylko format OpenAI), ustaw jawnie `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // domyślnie: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Ten tryb może nie obsługiwać jednocześnie streamingu i wywoływania narzędzi. Może być konieczne wyłączenie streamingu przez `params: { streaming: false }` w konfiguracji modelu.

    Gdy z Ollama używane jest `api: "openai-completions"`, OpenClaw domyślnie wstrzykuje `options.num_ctx`, aby Ollama nie wracało po cichu do okna kontekstu 4096. Jeśli Twoje proxy/upstream odrzuca nieznane pola `options`, wyłącz to zachowanie:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Okna kontekstu">
    Dla modeli wykrywanych automatycznie OpenClaw używa okna kontekstu zgłaszanego przez Ollama, jeśli jest dostępne, a w przeciwnym razie wraca do domyślnego okna kontekstu Ollama używanego przez OpenClaw.

    Możesz nadpisać `contextWindow` i `maxTokens` w jawnej konfiguracji providera:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Modele reasoning">
    OpenClaw domyślnie traktuje modele o nazwach takich jak `deepseek-r1`, `reasoning` lub `think` jako obsługujące reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nie jest potrzebna żadna dodatkowa konfiguracja -- OpenClaw oznacza je automatycznie.

  </Accordion>

  <Accordion title="Koszty modeli">
    Ollama jest darmowe i działa lokalnie, więc wszystkie koszty modeli są ustawione na $0. Dotyczy to zarówno modeli wykrywanych automatycznie, jak i definiowanych ręcznie.
  </Accordion>

  <Accordion title="Embeddingi pamięci">
    Bundled plugin Ollama rejestruje providera embedding pamięci dla
    [wyszukiwania pamięci](/pl/concepts/memory). Używa skonfigurowanego base URL
    i klucza API Ollama.

    | Właściwość    | Wartość             |
    | ------------- | ------------------- |
    | Model domyślny | `nomic-embed-text` |
    | Auto-pull     | Tak — model embedding jest pobierany automatycznie, jeśli nie jest obecny lokalnie |

    Aby wybrać Ollama jako providera embedding wyszukiwania pamięci:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfiguracja streamingu">
    Integracja OpenClaw z Ollama domyślnie używa **natywnego API Ollama** (`/api/chat`), które w pełni obsługuje jednocześnie streaming i wywoływanie narzędzi. Nie jest potrzebna żadna specjalna konfiguracja.

    <Tip>
    Jeśli musisz używać endpointu zgodnego z OpenAI, zobacz sekcję „Starszy tryb zgodny z OpenAI” powyżej. W tym trybie streaming i wywoływanie narzędzi mogą nie działać jednocześnie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Nie wykryto Ollama">
    Upewnij się, że Ollama działa oraz że ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania), a także że **nie** zdefiniowano jawnego wpisu `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Sprawdź, czy API jest dostępne:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Brak dostępnych modeli">
    Jeśli model nie jest widoczny na liście, pobierz go lokalnie albo zdefiniuj jawnie w `models.providers.ollama`.

    ```bash
    ollama list  # Zobacz, co jest zainstalowane
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Albo inny model
    ```

  </Accordion>

  <Accordion title="Połączenie odrzucone">
    Sprawdź, czy Ollama działa na poprawnym porcie:

    ```bash
    # Sprawdź, czy Ollama działa
    ps aux | grep ollama

    # Albo uruchom Ollama ponownie
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Troubleshooting](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Providerzy modeli" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich providerów, model refów i zachowania failover.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Ollama Web Search" href="/pl/tools/ollama-search" icon="magnifying-glass">
    Pełne szczegóły konfiguracji i działania wyszukiwania w sieci opartego na Ollama.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja referencyjna konfiguracji.
  </Card>
</CardGroup>
