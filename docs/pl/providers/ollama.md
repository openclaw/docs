---
read_when:
    - Chcesz uruchomić OpenClaw z modelami chmurowymi lub lokalnymi przez Ollama
    - Potrzebujesz wskazówek dotyczących konfiguracji i setupu Ollama
    - Chcesz używać modeli vision Ollama do rozumienia obrazów
summary: Uruchom OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T09:28:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw integruje się z natywnym API Ollama (`/api/chat`) dla hostowanych modeli chmurowych i lokalnych/samohostowanych serwerów Ollama. Możesz używać Ollama w trzech trybach: `Cloud + Local` przez osiągalny host Ollama, `Cloud only` względem `https://ollama.com` lub `Local only` względem osiągalnego hosta Ollama.

<Warning>
**Użytkownicy zdalnego Ollama**: Nie używaj z OpenClaw zgodnego z OpenAI URL `/v1` (`http://host:11434/v1`). To psuje wywoływanie narzędzi i modele mogą wypisywać surowy JSON narzędzi jako zwykły tekst. Użyj zamiast tego natywnego URL API Ollama: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

## Szybki start

Wybierz preferowaną metodę konfiguracji i tryb.

<Tabs>
  <Tab title="Onboarding (zalecane)">
    **Najlepsze dla:** najszybszej ścieżki do działającej konfiguracji chmurowej lub lokalnej Ollama.

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
        `Cloud only` prosi o `OLLAMA_API_KEY` i sugeruje domyślne modele chmurowe. `Cloud + Local` i `Local only` pytają o base URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, jeśli nie jest jeszcze dostępny. `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu chmurowego.
      </Step>
      <Step title="Zweryfikuj, że model jest dostępny">
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
    **Najlepsze dla:** pełnej kontroli nad konfiguracją chmurową lub lokalną.

    <Steps>
      <Step title="Wybierz chmurę lub lokalnie">
        - **Cloud + Local**: zainstaluj Ollama, zaloguj się przez `ollama signin` i kieruj żądania chmurowe przez ten host
        - **Cloud only**: użyj `https://ollama.com` z `OLLAMA_API_KEY`
        - **Local only**: zainstaluj Ollama z [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Pobierz model lokalny (tylko lokalnie)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Włącz Ollama dla OpenClaw">
        Dla `Cloud only` użyj prawdziwego `OLLAMA_API_KEY`. Dla konfiguracji opartych na hoście działa dowolna wartość zastępcza:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź i ustaw model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Lub ustaw domyślny w konfiguracji:

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
    `Cloud + Local` używa osiągalnego hosta Ollama jako punktu sterowania zarówno dla modeli lokalnych, jak i chmurowych. To preferowany hybrydowy przepływ Ollama.

    Użyj **Cloud + Local** podczas konfiguracji. OpenClaw pyta o base URL Ollama, wykrywa lokalne modele z tego hosta i sprawdza, czy host jest zalogowany do dostępu chmurowego przez `ollama signin`. Gdy host jest zalogowany, OpenClaw sugeruje też hostowane domyślne modele chmurowe, takie jak `kimi-k2.5:cloud`, `minimax-m2.7:cloud` i `glm-5.1:cloud`.

    Jeśli host nie jest jeszcze zalogowany, OpenClaw utrzymuje konfigurację jako local-only, dopóki nie uruchomisz `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` działa względem hostowanego API Ollama pod `https://ollama.com`.

    Użyj **Cloud only** podczas konfiguracji. OpenClaw pyta o `OLLAMA_API_KEY`, ustawia `baseUrl: "https://ollama.com"` i inicjalizuje listę hostowanych modeli chmurowych. Ta ścieżka **nie** wymaga lokalnego serwera Ollama ani `ollama signin`.

    Lista modeli chmurowych wyświetlana podczas `openclaw onboard` jest pobierana na żywo z `https://ollama.com/api/tags`, ograniczona do 500 wpisów, więc selektor odzwierciedla aktualny hostowany katalog zamiast statycznej listy. Jeśli `ollama.com` jest nieosiągalne albo nie zwraca modeli w czasie setupu, OpenClaw wraca do poprzednich hardkodowanych sugestii, dzięki czemu onboarding nadal się kończy.

  </Tab>

  <Tab title="Local only">
    W trybie local-only OpenClaw wykrywa modele ze skonfigurowanej instancji Ollama. Ta ścieżka jest przeznaczona dla lokalnych lub samohostowanych serwerów Ollama.

    OpenClaw obecnie sugeruje `gemma4` jako domyślny model lokalny.

  </Tab>
</Tabs>

## Wykrywanie modeli (provider niejawny)

Gdy ustawisz `OLLAMA_API_KEY` (lub profil auth) i **nie** zdefiniujesz `models.providers.ollama`, OpenClaw wykrywa modele z lokalnej instancji Ollama pod `http://127.0.0.1:11434`.

| Zachowanie            | Szczegóły                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zapytanie katalogowe  | Odpytuje `/api/tags`                                                                                                                                                 |
| Wykrywanie możliwości | Używa best-effort wyszukiwań `/api/show`, aby odczytać `contextWindow` i wykryć możliwości (w tym vision)                                                         |
| Modele vision         | Modele z możliwością `vision` raportowaną przez `/api/show` są oznaczane jako zdolne do obrazów (`input: ["text", "image"]`), więc OpenClaw automatycznie wstrzykuje obrazy do promptu |
| Wykrywanie rozumowania | Oznacza `reasoning` heurystyką nazwy modelu (`r1`, `reasoning`, `think`)                                                                                           |
| Limity tokenów        | Ustawia `maxTokens` na domyślny limit max-token Ollama używany przez OpenClaw                                                                                       |
| Koszty                | Ustawia wszystkie koszty na `0`                                                                                                                                      |

Pozwala to uniknąć ręcznych wpisów modeli, jednocześnie utrzymując katalog zgodny z lokalną instancją Ollama.

```bash
# See what models are available
ollama list
openclaw models list
```

Aby dodać nowy model, po prostu pobierz go przez Ollama:

```bash
ollama pull mistral
```

Nowy model zostanie automatycznie wykryty i będzie gotowy do użycia.

<Note>
Jeśli ustawisz `models.providers.ollama` jawnie, automatyczne wykrywanie jest pomijane i musisz ręcznie zdefiniować modele. Zobacz sekcję jawnej konfiguracji poniżej.
</Note>

## Vision i opis obrazów

Dołączony Plugin Ollama rejestruje Ollama jako providera rozumienia multimediów zdolnego do obsługi obrazów. Dzięki temu OpenClaw może kierować jawne żądania opisu obrazów i skonfigurowane domyślne modele obrazów przez lokalne lub hostowane modele vision Ollama.

Dla lokalnego vision pobierz model, który obsługuje obrazy:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Następnie zweryfikuj przez infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` musi być pełną referencją `<provider/model>`. Gdy jest ustawione, `openclaw infer image describe` uruchamia ten model bezpośrednio zamiast pomijać opis, ponieważ model obsługuje natywny vision.

Aby ustawić Ollama jako domyślny model rozumienia obrazów dla przychodzących multimediów, skonfiguruj `agents.defaults.imageModel`:

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

Jeśli ręcznie definiujesz `models.providers.ollama.models`, oznacz modele vision jako obsługujące wejście obrazów:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw odrzuca żądania opisu obrazów dla modeli, które nie są oznaczone jako zdolne do obsługi obrazów. Przy niejawanym wykrywaniu OpenClaw odczytuje to z Ollama, gdy `/api/show` raportuje możliwość vision.

## Konfiguracja

<Tabs>
  <Tab title="Podstawowa (niejawne wykrywanie)">
    Najprostsza ścieżka włączenia local-only to zmienna środowiskowa:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jeśli ustawiono `OLLAMA_API_KEY`, możesz pominąć `apiKey` we wpisie providera, a OpenClaw uzupełni je podczas sprawdzania dostępności.
    </Tip>

  </Tab>

  <Tab title="Jawna (ręczne modele)">
    Użyj jawnej konfiguracji, gdy chcesz hostowaną konfigurację chmurową, Ollama działa na innym hoście/porcie, chcesz wymusić określone okna kontekstu lub listy modeli albo chcesz w pełni ręcznie definiować modele.

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
    Jeśli Ollama działa na innym hoście lub porcie (jawna konfiguracja wyłącza automatyczne wykrywanie, więc zdefiniuj modele ręcznie):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    Nie dodawaj `/v1` do URL-a. Ścieżka `/v1` używa trybu zgodnego z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne. Użyj bazowego URL Ollama bez sufiksu ścieżki.
    </Warning>

  </Tab>
</Tabs>

### Wybór modelu

Po konfiguracji wszystkie Twoje modele Ollama są dostępne:

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

OpenClaw obsługuje **Ollama Web Search** jako dołączonego providera `web_search`.

| Właściwość  | Szczegóły                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| Host        | Używa Twojego skonfigurowanego hosta Ollama (`models.providers.ollama.baseUrl`, gdy ustawione, w przeciwnym razie `http://127.0.0.1:11434`) |
| Auth        | Bez klucza                                                                                                     |
| Wymaganie   | Ollama musi działać i być zalogowane przez `ollama signin`                                                     |

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
Pełne szczegóły konfiguracji i zachowania znajdziesz w [Ollama Web Search](/pl/tools/ollama-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Starszy tryb zgodny z OpenAI">
    <Warning>
    **Wywoływanie narzędzi nie jest niezawodne w trybie zgodnym z OpenAI.** Używaj tego trybu tylko wtedy, gdy potrzebujesz formatu OpenAI dla proxy i nie zależy Ci na natywnym zachowaniu wywoływania narzędzi.
    </Warning>

    Jeśli zamiast tego musisz używać punktu końcowego zgodnego z OpenAI (na przykład za proxy obsługującym tylko format OpenAI), ustaw jawnie `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Ten tryb może nie obsługiwać jednocześnie strumieniowania i wywoływania narzędzi. Może być konieczne wyłączenie strumieniowania przez `params: { streaming: false }` w konfiguracji modelu.

    Gdy z Ollama używane jest `api: "openai-completions"`, OpenClaw domyślnie wstrzykuje `options.num_ctx`, aby Ollama nie wrócił po cichu do okna kontekstu 4096. Jeśli Twoje proxy/upstream odrzuca nieznane pola `options`, wyłącz to zachowanie:

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
    Dla modeli wykrywanych automatycznie OpenClaw używa okna kontekstu raportowanego przez Ollama, gdy jest dostępne, a w przeciwnym razie wraca do domyślnego okna kontekstu Ollama używanego przez OpenClaw.

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

  <Accordion title="Modele rozumujące">
    OpenClaw domyślnie traktuje modele o nazwach takich jak `deepseek-r1`, `reasoning` lub `think` jako zdolne do rozumowania.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nie jest potrzebna żadna dodatkowa konfiguracja — OpenClaw oznacza je automatycznie.

  </Accordion>

  <Accordion title="Koszty modeli">
    Ollama jest darmowy i działa lokalnie, więc koszty wszystkich modeli są ustawione na $0. Dotyczy to zarówno modeli wykrywanych automatycznie, jak i definiowanych ręcznie.
  </Accordion>

  <Accordion title="Embeddingi memory">
    Dołączony Plugin Ollama rejestruje providera embeddingów memory dla
    [wyszukiwania memory](/pl/concepts/memory). Używa skonfigurowanego base URL
    i klucza API Ollama.

    | Właściwość    | Wartość              |
    | -------------- | -------------------- |
    | Model domyślny | `nomic-embed-text`   |
    | Auto-pull      | Tak — model embeddingów jest automatycznie pobierany, jeśli nie jest obecny lokalnie |

    Aby wybrać Ollama jako providera embeddingów wyszukiwania memory:

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

  <Accordion title="Konfiguracja strumieniowania">
    Integracja Ollama w OpenClaw domyślnie używa **natywnego API Ollama** (`/api/chat`), które w pełni obsługuje jednocześnie strumieniowanie i wywoływanie narzędzi. Nie jest potrzebna żadna specjalna konfiguracja.

    Dla natywnych żądań `/api/chat` OpenClaw przekazuje też sterowanie myśleniem bezpośrednio do Ollama: `/think off` i `openclaw agent --thinking off` wysyłają top-level `think: false`, a poziomy myślenia inne niż `off` wysyłają `think: true`.

    <Tip>
    Jeśli musisz używać punktu końcowego zgodnego z OpenAI, zobacz sekcję „Starszy tryb zgodny z OpenAI” powyżej. W tym trybie strumieniowanie i wywoływanie narzędzi mogą nie działać jednocześnie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Ollama nie wykryto">
    Upewnij się, że Ollama działa, że ustawiono `OLLAMA_API_KEY` (lub profil auth), i że **nie** zdefiniowano jawnego wpisu `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Zweryfikuj, że API jest dostępne:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Brak dostępnych modeli">
    Jeśli Twojego modelu nie ma na liście, pobierz go lokalnie albo zdefiniuj jawnie w `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Sprawdź, czy Ollama działa na poprawnym porcie:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich providerów, referencji modeli i zachowania failover.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Ollama Web Search" href="/pl/tools/ollama-search" icon="magnifying-glass">
    Pełne szczegóły konfiguracji i zachowania dla wyszukiwania web opartego na Ollama.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
