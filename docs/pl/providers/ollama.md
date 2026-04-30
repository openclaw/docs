---
read_when:
    - Chcesz uruchomić OpenClaw z modelami chmurowymi lub lokalnymi za pomocą Ollama
    - Potrzebujesz wskazówek dotyczących instalacji i konfiguracji Ollama
    - Chcesz używać modeli wizyjnych Ollama do rozumienia obrazów
summary: Uruchamianie OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T10:14:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw integruje się z natywnym API Ollama (`/api/chat`) dla hostowanych modeli w chmurze oraz lokalnych/samodzielnie hostowanych serwerów Ollama. Ollama można używać w trzech trybach: `Cloud + Local` przez osiągalny host Ollama, `Cloud only` z `https://ollama.com` albo `Local only` z osiągalnym hostem Ollama.

<Warning>
**Użytkownicy zdalnego Ollama**: Nie używaj zgodnego z OpenAI adresu URL `/v1` (`http://host:11434/v1`) z OpenClaw. Psuje to wywoływanie narzędzi, a modele mogą wypisywać surowy JSON narzędzi jako zwykły tekst. Zamiast tego użyj natywnego adresu URL API Ollama: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

Konfiguracja providera Ollama używa `baseUrl` jako klucza kanonicznego. OpenClaw akceptuje też `baseURL` dla zgodności z przykładami w stylu OpenAI SDK, ale nowa konfiguracja powinna preferować `baseUrl`.

## Reguły uwierzytelniania

<AccordionGroup>
  <Accordion title="Hosty lokalne i LAN">
    Lokalne i LAN-owe hosty Ollama nie potrzebują prawdziwego tokena bearer. OpenClaw używa lokalnego znacznika `ollama-local` tylko dla adresów URL bazowych Ollama typu loopback, sieci prywatnej, `.local` oraz samych nazw hostów.
  </Accordion>
  <Accordion title="Hosty zdalne i Ollama Cloud">
    Zdalne hosty publiczne oraz Ollama Cloud (`https://ollama.com`) wymagają prawdziwych danych uwierzytelniających przez `OLLAMA_API_KEY`, profil uwierzytelniania albo `apiKey` providera.
  </Accordion>
  <Accordion title="Niestandardowe identyfikatory providerów">
    Niestandardowe identyfikatory providerów, które ustawiają `api: "ollama"`, stosują te same reguły. Na przykład provider `ollama-remote`, który wskazuje na prywatny host LAN Ollama, może używać `apiKey: "ollama-local"`, a podagenci rozwiążą ten znacznik przez hook providera Ollama zamiast traktować go jako brakujące dane uwierzytelniające. Wyszukiwanie w pamięci może też ustawić `agents.defaults.memorySearch.provider` na ten niestandardowy identyfikator providera, aby embeddingi używały pasującego endpointu Ollama.
  </Accordion>
  <Accordion title="Profile uwierzytelniania">
    `auth-profiles.json` przechowuje dane uwierzytelniające dla identyfikatora providera. Ustawienia endpointu (`baseUrl`, `api`, identyfikatory modeli, nagłówki, limity czasu) umieść w `models.providers.<id>`. Starsze płaskie pliki profili uwierzytelniania, takie jak `{ "ollama-windows": { "apiKey": "ollama-local" } }`, nie są formatem runtime; uruchom `openclaw doctor --fix`, aby przepisać je do kanonicznego profilu klucza API `ollama-windows:default` z kopią zapasową. `baseUrl` w tym pliku to szum zgodności i należy go przenieść do konfiguracji providera.
  </Accordion>
  <Accordion title="Zakres embeddingów pamięci">
    Gdy Ollama jest używana do embeddingów pamięci, uwierzytelnianie bearer jest ograniczone do hosta, na którym zostało zadeklarowane:

    - Klucz na poziomie providera jest wysyłany tylko do hosta Ollama tego providera.
    - `agents.*.memorySearch.remote.apiKey` jest wysyłany tylko do swojego zdalnego hosta embeddingów.
    - Czysta wartość env `OLLAMA_API_KEY` jest traktowana jako konwencja Ollama Cloud i domyślnie nie jest wysyłana do hostów lokalnych ani samodzielnie hostowanych.

  </Accordion>
</AccordionGroup>

## Pierwsze kroki

Wybierz preferowaną metodę konfiguracji i tryb.

<Tabs>
  <Tab title="Onboarding (zalecane)">
    **Najlepsze dla:** najszybszej drogi do działającej konfiguracji Ollama w chmurze lub lokalnie.

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
        `Cloud only` prosi o `OLLAMA_API_KEY` i sugeruje domyślne wartości dla hostowanej chmury. `Cloud + Local` i `Local only` proszą o bazowy adres URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, jeśli nie jest jeszcze dostępny. Gdy Ollama zgłosi zainstalowany tag `:latest`, taki jak `gemma4:latest`, konfiguracja pokazuje ten zainstalowany model raz, zamiast pokazywać zarówno `gemma4`, jak i `gemma4:latest` albo ponownie pobierać goły alias. `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu do chmury.
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

    Opcjonalnie podaj niestandardowy bazowy adres URL lub model:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Konfiguracja ręczna">
    **Najlepsze dla:** pełnej kontroli nad konfiguracją w chmurze lub lokalną.

    <Steps>
      <Step title="Wybierz chmurę albo lokalnie">
        - **Cloud + Local**: zainstaluj Ollama, zaloguj się przez `ollama signin` i routuj żądania chmurowe przez ten host
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
        Dla `Cloud only` użyj swojego prawdziwego `OLLAMA_API_KEY`. W konfiguracjach opartych na hoście działa dowolna wartość zastępcza:

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

        Albo ustaw wartość domyślną w konfiguracji:

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

    Użyj **Cloud + Local** podczas konfiguracji. OpenClaw prosi o bazowy adres URL Ollama, wykrywa modele lokalne z tego hosta i sprawdza, czy host jest zalogowany do dostępu do chmury przez `ollama signin`. Gdy host jest zalogowany, OpenClaw sugeruje też domyślne hostowane modele chmurowe, takie jak `kimi-k2.5:cloud`, `minimax-m2.7:cloud` i `glm-5.1:cloud`.

    Jeśli host nie jest jeszcze zalogowany, OpenClaw utrzymuje konfigurację jako tylko lokalną, dopóki nie uruchomisz `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` działa z hostowanym API Ollama pod `https://ollama.com`.

    Użyj **Cloud only** podczas konfiguracji. OpenClaw prosi o `OLLAMA_API_KEY`, ustawia `baseUrl: "https://ollama.com"` i inicjuje listę hostowanych modeli chmurowych. Ta ścieżka **nie** wymaga lokalnego serwera Ollama ani `ollama signin`.

    Lista modeli chmurowych pokazywana podczas `openclaw onboard` jest wypełniana na żywo z `https://ollama.com/api/tags`, z limitem 500 pozycji, więc selektor odzwierciedla bieżący hostowany katalog, a nie statyczny zestaw startowy. Jeśli `ollama.com` jest nieosiągalne lub nie zwróci żadnych modeli w czasie konfiguracji, OpenClaw wraca do poprzednich zakodowanych sugestii, aby onboarding nadal mógł się zakończyć.

  </Tab>

  <Tab title="Local only">
    W trybie tylko lokalnym OpenClaw wykrywa modele ze skonfigurowanej instancji Ollama. Ta ścieżka jest przeznaczona dla lokalnych lub samodzielnie hostowanych serwerów Ollama.

    OpenClaw obecnie sugeruje `gemma4` jako lokalną wartość domyślną.

  </Tab>
</Tabs>

## Wykrywanie modeli (provider niejawny)

Gdy ustawisz `OLLAMA_API_KEY` (albo profil uwierzytelniania) i **nie** zdefiniujesz `models.providers.ollama` ani innego niestandardowego zdalnego providera z `api: "ollama"`, OpenClaw wykrywa modele z lokalnej instancji Ollama pod `http://127.0.0.1:11434`.

| Zachowanie           | Szczegóły                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zapytanie katalogu   | Wysyła zapytanie do `/api/tags`                                                                                                                                      |
| Wykrywanie możliwości | Używa najlepszej dostępnej metody z zapytaniami `/api/show`, aby odczytać `contextWindow`, rozwinięte parametry Modelfile `num_ctx` oraz możliwości, w tym vision/tools |
| Modele wizyjne       | Modele z możliwością `vision` zgłoszoną przez `/api/show` są oznaczane jako obsługujące obrazy (`input: ["text", "image"]`), więc OpenClaw automatycznie wstrzykuje obrazy do promptu |
| Wykrywanie rozumowania | Używa możliwości z `/api/show`, gdy są dostępne, w tym `thinking`; wraca do heurystyki nazwy modelu (`r1`, `reasoning`, `think`), gdy Ollama pomija możliwości |
| Limity tokenów       | Ustawia `maxTokens` na domyślny limit maksymalnej liczby tokenów Ollama używany przez OpenClaw                                                                       |
| Koszty               | Ustawia wszystkie koszty na `0`                                                                                                                                      |

Pozwala to uniknąć ręcznych wpisów modeli, jednocześnie utrzymując katalog zgodny z lokalną instancją Ollama. Możesz użyć pełnej referencji, takiej jak `ollama/<pulled-model>:latest`, w lokalnym `infer model run`; OpenClaw rozwiązuje ten zainstalowany model z katalogu live Ollama bez wymagania ręcznie napisanego wpisu `models.json`.

Dla zalogowanych hostów Ollama niektóre modele `:cloud` mogą być używalne przez `/api/chat`
i `/api/show`, zanim pojawią się w `/api/tags`. Gdy jawnie wybierzesz
pełną referencję `ollama/<model>:cloud`, OpenClaw waliduje dokładnie ten brakujący model przez
`/api/show` i dodaje go do katalogu runtime tylko wtedy, gdy Ollama potwierdzi metadane
modelu. Literówki nadal kończą się błędem nieznanego modelu, zamiast być automatycznie tworzone.

```bash
# See what models are available
ollama list
openclaw models list
```

Dla wąskiego testu dymnego generowania tekstu, który omija pełną powierzchnię narzędzi agenta,
użyj lokalnego `infer model run` z pełną referencją modelu Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Ta ścieżka nadal używa skonfigurowanego providera OpenClaw, uwierzytelniania i natywnego transportu Ollama,
ale nie rozpoczyna tury agenta czatu ani nie ładuje kontekstu MCP/narzędzi. Jeśli
to się powiedzie, a zwykłe odpowiedzi agenta zawodzą, następnie rozwiąż problemy z pojemnością promptu/narzędzi
agenta danego modelu.

Dla wąskiego testu dymnego modelu wizyjnego na tej samej lekkiej ścieżce dodaj jeden lub więcej
plików obrazów do `infer model run`. Wysyła to prompt i obraz bezpośrednio do
wybranego modelu wizyjnego Ollama bez ładowania narzędzi czatu, pamięci ani wcześniejszego
kontekstu sesji:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` akceptuje pliki wykryte jako `image/*`, w tym popularne wejścia PNG,
JPEG i WebP. Pliki niebędące obrazami są odrzucane przed wywołaniem Ollama.
Do rozpoznawania mowy użyj zamiast tego `openclaw infer audio transcribe`.

Gdy przełączysz rozmowę za pomocą `/model ollama/<model>`, OpenClaw traktuje
to jako dokładny wybór użytkownika. Jeśli skonfigurowany `baseUrl` Ollama jest
nieosiągalny, kolejna odpowiedź zakończy się błędem providera zamiast po cichu
odpowiedzieć z innego skonfigurowanego modelu fallback.

Izolowane zadania Cron wykonują jedno dodatkowe lokalne sprawdzenie bezpieczeństwa przed rozpoczęciem tury agenta. Jeśli wybrany model rozwiązuje się do lokalnego dostawcy Ollama, dostawcy w sieci prywatnej lub `.local`, a `/api/tags` jest nieosiągalne, OpenClaw zapisuje to uruchomienie Cron jako `skipped` z wybranym `ollama/<model>` w tekście błędu. Wstępne sprawdzenie endpointu jest buforowane przez 5 minut, więc wiele zadań Cron wskazujących na tego samego zatrzymanego demona Ollama nie uruchamia kolejno nieudanych żądań modelu.

Zweryfikuj na żywo lokalną ścieżkę tekstową, natywną ścieżkę strumieniowania i embeddingi względem lokalnego Ollama za pomocą:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Aby dodać nowy model, po prostu pobierz go przez Ollama:

```bash
ollama pull mistral
```

Nowy model zostanie automatycznie wykryty i będzie dostępny do użycia.

<Note>
Jeśli jawnie ustawisz `models.providers.ollama` albo skonfigurujesz niestandardowego zdalnego dostawcę, takiego jak `models.providers.ollama-cloud` z `api: "ollama"`, automatyczne wykrywanie zostanie pominięte i trzeba zdefiniować modele ręcznie. Niestandardowi dostawcy loopback, tacy jak `http://127.0.0.2:11434`, nadal są traktowani jako lokalni. Zobacz sekcję jawnej konfiguracji poniżej.
</Note>

## Wizja i opis obrazu

Dołączony Plugin Ollama rejestruje Ollama jako dostawcę rozumienia multimediów obsługującego obrazy. Pozwala to OpenClaw kierować jawne żądania opisu obrazu i skonfigurowane domyślne modele obrazu przez lokalne lub hostowane modele wizyjne Ollama.

Dla lokalnej wizji pobierz model obsługujący obrazy:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Następnie zweryfikuj za pomocą CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` musi być pełnym odwołaniem `<provider/model>`. Gdy jest ustawione, `openclaw infer image describe` uruchamia ten model bezpośrednio, zamiast pomijać opis, ponieważ model obsługuje natywną wizję.

Użyj `infer image describe`, gdy chcesz przepływu dostawcy rozumienia obrazu OpenClaw, skonfigurowanego `agents.defaults.imageModel` i kształtu danych wyjściowych opisu obrazu. Użyj `infer model run --file`, gdy chcesz surowej próby modelu multimodalnego z niestandardowym promptem i jednym lub wieloma obrazami.

Aby ustawić Ollama jako domyślny model rozumienia obrazu dla przychodzących multimediów, skonfiguruj `agents.defaults.imageModel`:

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

Preferuj pełne odwołanie `ollama/<model>`. Jeśli ten sam model jest wymieniony w `models.providers.ollama.models` z `input: ["text", "image"]` i żaden inny skonfigurowany dostawca obrazu nie udostępnia tego bazowego identyfikatora modelu, OpenClaw normalizuje też bazowe odwołanie `imageModel`, takie jak `qwen2.5vl:7b`, do `ollama/qwen2.5vl:7b`. Jeśli więcej niż jeden skonfigurowany dostawca obrazu ma ten sam bazowy identyfikator, jawnie użyj prefiksu dostawcy.

Wolne lokalne modele wizyjne mogą potrzebować dłuższego limitu czasu rozumienia obrazu niż modele chmurowe. Mogą też ulec awarii lub zatrzymać się, gdy Ollama próbuje przydzielić pełny deklarowany kontekst wizyjny na ograniczonym sprzęcie. Ustaw limit czasu zdolności i ogranicz `num_ctx` we wpisie modelu, gdy potrzebujesz tylko zwykłej tury opisu obrazu:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Ten limit czasu dotyczy przychodzącego rozumienia obrazu oraz jawnego narzędzia `image`, które agent może wywołać podczas tury. `models.providers.ollama.timeoutSeconds` na poziomie dostawcy nadal kontroluje bazową osłonę czasową żądania HTTP Ollama dla zwykłych wywołań modelu.

Zweryfikuj na żywo jawne narzędzie obrazu względem lokalnego Ollama za pomocą:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jeśli ręcznie definiujesz `models.providers.ollama.models`, oznacz modele wizyjne jako obsługujące wejście obrazu:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw odrzuca żądania opisu obrazu dla modeli, które nie są oznaczone jako obsługujące obrazy. Przy niejawnym wykrywaniu OpenClaw odczytuje to z Ollama, gdy `/api/show` zgłasza zdolność wizyjną.

## Konfiguracja

<Tabs>
  <Tab title="Podstawowa (niejawne wykrywanie)">
    Najprostsza ścieżka włączenia tylko lokalnie prowadzi przez zmienną środowiskową:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jeśli `OLLAMA_API_KEY` jest ustawione, możesz pominąć `apiKey` we wpisie dostawcy, a OpenClaw uzupełni je na potrzeby sprawdzeń dostępności.
    </Tip>

  </Tab>

  <Tab title="Jawna (ręczne modele)">
    Użyj jawnej konfiguracji, gdy chcesz skonfigurować hostowaną chmurę, Ollama działa na innym hoście/porcie, chcesz wymusić konkretne okna kontekstu lub listy modeli albo chcesz w pełni ręcznych definicji modeli.

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

  <Tab title="Niestandardowy bazowy URL">
    Jeśli Ollama działa na innym hoście lub porcie (jawna konfiguracja wyłącza automatyczne wykrywanie, więc zdefiniuj modele ręcznie):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Nie dodawaj `/v1` do adresu URL. Ścieżka `/v1` używa trybu zgodnego z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne. Użyj bazowego adresu URL Ollama bez sufiksu ścieżki.
    </Warning>

  </Tab>
</Tabs>

## Typowe przepisy

Użyj ich jako punktów wyjścia i zastąp identyfikatory modeli dokładnymi nazwami z `ollama list` lub `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Model lokalny z automatycznym wykrywaniem">
    Użyj tego, gdy Ollama działa na tej samej maszynie co Gateway i chcesz, aby OpenClaw automatycznie wykrywał zainstalowane modele.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Ta ścieżka utrzymuje konfigurację na minimalnym poziomie. Nie dodawaj bloku `models.providers.ollama`, chyba że chcesz definiować modele ręcznie.

  </Accordion>

  <Accordion title="Host Ollama w sieci LAN z ręcznymi modelami">
    Używaj natywnych adresów URL Ollama dla hostów LAN. Nie dodawaj `/v1`.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` to budżet kontekstu po stronie OpenClaw. `params.num_ctx` jest wysyłane do Ollama dla żądania. Utrzymuj je spójne, gdy Twój sprzęt nie może uruchomić pełnego deklarowanego kontekstu modelu.

  </Accordion>

  <Accordion title="Tylko Ollama Cloud">
    Użyj tego, gdy nie uruchamiasz lokalnego demona i chcesz bezpośrednio korzystać z hostowanych modeli Ollama.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

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
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Chmura plus lokalnie przez zalogowanego demona">
    Użyj tego, gdy lokalny demon Ollama lub demon Ollama w LAN jest zalogowany przez `ollama signin` i ma obsługiwać zarówno modele lokalne, jak i modele `:cloud`.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Wiele hostów Ollama">
    Użyj niestandardowych identyfikatorów dostawców, gdy masz więcej niż jeden serwer Ollama. Każdy dostawca otrzymuje własny host, modele, uwierzytelnianie, limit czasu i odwołania modeli.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Gdy OpenClaw wysyła żądanie, aktywny prefiks dostawcy jest usuwany, więc `ollama-large/qwen3.5:27b` dociera do Ollama jako `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Odchudzony profil modelu lokalnego">
    Niektóre modele lokalne potrafią odpowiadać na proste prompty, ale mają trudności z pełnym zakresem narzędzi agenta. Zacznij od ograniczenia narzędzi i kontekstu, zanim zmienisz globalne ustawienia środowiska uruchomieniowego.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Używaj `compat.supportsTools: false` tylko wtedy, gdy model lub serwer niezawodnie zawodzi na schematach narzędzi. Zamienia możliwości agenta na stabilność.
    `localModelLean` usuwa narzędzia przeglądarki, cron i wiadomości z powierzchni agenta, ale nie zmienia kontekstu wykonania ani trybu myślenia Ollama. Połącz to z jawnymi `params.num_ctx` i `params.thinking: false` dla małych modeli myślących w stylu Qwen, które wpadają w pętle lub zużywają budżet odpowiedzi na ukryte rozumowanie.

  </Accordion>
</AccordionGroup>

### Wybór modelu

Po skonfigurowaniu dostępne są wszystkie Twoje modele Ollama:

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

Obsługiwane są także niestandardowe identyfikatory dostawców Ollama. Gdy odwołanie do modelu używa aktywnego
prefiksu dostawcy, takiego jak `ollama-spark/qwen3:32b`, OpenClaw usuwa tylko ten
prefiks przed wywołaniem Ollama, aby serwer otrzymał `qwen3:32b`.

Dla wolnych modeli lokalnych preferuj dostrajanie żądań w zakresie dostawcy przed zwiększaniem
limitu czasu wykonania całego agenta:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` ma zastosowanie do żądania HTTP modelu, w tym konfiguracji połączenia,
nagłówków, strumieniowania treści i całkowitego przerwania chronionego pobierania. `params.keep_alive`
jest przekazywane do Ollama jako najwyższego poziomu `keep_alive` w natywnych żądaniach `/api/chat`;
ustawiaj je dla konkretnego modelu, gdy czas ładowania pierwszej tury jest wąskim gardłem.

### Szybka weryfikacja

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

W przypadku hostów zdalnych zastąp `127.0.0.1` hostem używanym w `baseUrl`. Jeśli `curl` działa, ale OpenClaw nie, sprawdź, czy Gateway działa na innej maszynie, w kontenerze lub na innym koncie usługi.

## Wyszukiwanie w sieci Ollama

OpenClaw obsługuje **Wyszukiwanie w sieci Ollama** jako wbudowanego dostawcę `web_search`.

| Właściwość    | Szczegóły                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Używa skonfigurowanego hosta Ollama (`models.providers.ollama.baseUrl`, gdy jest ustawione, w przeciwnym razie `http://127.0.0.1:11434`); `https://ollama.com` używa bezpośrednio hostowanego API |
| Uwierzytelnianie        | Bez klucza dla zalogowanych lokalnych hostów Ollama; `OLLAMA_API_KEY` lub skonfigurowane uwierzytelnianie dostawcy dla bezpośredniego wyszukiwania przez `https://ollama.com` albo hostów chronionych uwierzytelnianiem               |
| Wymaganie | Hosty lokalne/samodzielnie hostowane muszą być uruchomione i zalogowane przez `ollama signin`; bezpośrednie hostowane wyszukiwanie wymaga `baseUrl: "https://ollama.com"` oraz rzeczywistego klucza API Ollama |

Wybierz **Wyszukiwanie w sieci Ollama** podczas `openclaw onboard` lub `openclaw configure --section web`, albo ustaw:

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

Dla bezpośredniego hostowanego wyszukiwania przez Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

W przypadku zalogowanego lokalnego demona OpenClaw używa proxy demona `/api/experimental/web_search`. Dla `https://ollama.com` wywołuje bezpośrednio hostowany punkt końcowy `/api/web_search`.

<Note>
Pełną konfigurację i szczegóły działania znajdziesz w [Wyszukiwanie w sieci Ollama](/pl/tools/ollama-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Starszy tryb zgodny z OpenAI">
    <Warning>
    **Wywoływanie narzędzi nie jest niezawodne w trybie zgodnym z OpenAI.** Używaj tego trybu tylko wtedy, gdy potrzebujesz formatu OpenAI dla proxy i nie zależysz od natywnego działania wywoływania narzędzi.
    </Warning>

    Jeśli zamiast tego musisz użyć punktu końcowego zgodnego z OpenAI (na przykład za proxy, które obsługuje tylko format OpenAI), ustaw jawnie `api: "openai-completions"`:

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

    Gdy `api: "openai-completions"` jest używane z Ollama, OpenClaw domyślnie wstrzykuje `options.num_ctx`, aby Ollama nie wracała po cichu do okna kontekstu 4096. Jeśli Twoje proxy/upstream odrzuca nieznane pola `options`, wyłącz to zachowanie:

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
    Dla modeli wykrytych automatycznie OpenClaw używa okna kontekstu zgłoszonego przez Ollama, gdy jest dostępne, w tym większych wartości `PARAMETER num_ctx` z niestandardowych Modelfiles. W przeciwnym razie wraca do domyślnego okna kontekstu Ollama używanego przez OpenClaw.

    Możesz ustawić domyślne wartości `contextWindow`, `contextTokens` i `maxTokens` na poziomie dostawcy dla każdego modelu pod tym dostawcą Ollama, a następnie nadpisywać je dla poszczególnych modeli w razie potrzeby. `contextWindow` to budżet promptu i Compaction w OpenClaw. Natywne żądania Ollama pozostawiają `options.num_ctx` nieustawione, chyba że jawnie skonfigurujesz `params.num_ctx`, dzięki czemu Ollama może zastosować własny model, `OLLAMA_CONTEXT_LENGTH` lub domyślne ustawienie oparte na VRAM. Aby ograniczyć lub wymusić kontekst wykonania na żądanie Ollama bez przebudowywania Modelfile, ustaw `params.num_ctx`; wartości nieprawidłowe, zerowe, ujemne i nieskończone są ignorowane. Adapter Ollama zgodny z OpenAI nadal domyślnie wstrzykuje `options.num_ctx` ze skonfigurowanego `params.num_ctx` lub `contextWindow`; wyłącz to za pomocą `injectNumCtxForOpenAICompat: false`, jeśli upstream odrzuca `options`.

    Wpisy natywnych modeli Ollama akceptują także typowe opcje wykonania Ollama w `params`, w tym `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` i `use_mmap`. OpenClaw przekazuje tylko klucze żądań Ollama, więc parametry wykonania OpenClaw, takie jak `streaming`, nie są ujawniane Ollama. Użyj `params.think` lub `params.thinking`, aby wysłać najwyższego poziomu Ollama `think`; `false` wyłącza myślenie na poziomie API dla modeli myślących w stylu Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Działa też `agents.defaults.models["ollama/<model>"].params.num_ctx` dla konkretnego modelu. Jeśli skonfigurowano oba ustawienia, jawny wpis modelu dostawcy ma pierwszeństwo przed domyślnym ustawieniem agenta.

  </Accordion>

  <Accordion title="Sterowanie myśleniem">
    Dla natywnych modeli Ollama OpenClaw przekazuje sterowanie myśleniem tak, jak oczekuje tego Ollama: najwyższego poziomu `think`, a nie `options.think`. Modele wykryte automatycznie, których odpowiedź `/api/show` zawiera możliwość `thinking`, udostępniają `/think low`, `/think medium`, `/think high` i `/think max`; modele niemyślące udostępniają tylko `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Możesz też ustawić domyślną wartość modelu:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    `params.think` lub `params.thinking` dla konkretnego modelu może wyłączyć lub wymusić myślenie API Ollama dla konkretnego skonfigurowanego modelu. OpenClaw zachowuje te jawne parametry modelu, gdy aktywne uruchomienie ma tylko niejawne domyślne `off`; polecenia wykonania inne niż off, takie jak `/think medium`, nadal nadpisują aktywne uruchomienie.

  </Accordion>

  <Accordion title="Modele rozumujące">
    OpenClaw domyślnie traktuje modele o nazwach takich jak `deepseek-r1`, `reasoning` lub `think` jako zdolne do rozumowania.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nie jest potrzebna dodatkowa konfiguracja. OpenClaw oznacza je automatycznie.

  </Accordion>

  <Accordion title="Koszty modeli">
    Ollama jest bezpłatna i działa lokalnie, więc wszystkie koszty modeli są ustawione na $0. Dotyczy to zarówno modeli wykrytych automatycznie, jak i zdefiniowanych ręcznie.
  </Accordion>

  <Accordion title="Embeddings pamięci">
    Wbudowany Plugin Ollama rejestruje dostawcę embeddingów pamięci dla
    [wyszukiwania pamięci](/pl/concepts/memory). Używa skonfigurowanego bazowego adresu URL Ollama
    i klucza API, wywołuje bieżący punkt końcowy Ollama `/api/embed` oraz grupuje
    wiele fragmentów pamięci w jedno żądanie `input`, gdy to możliwe.

    | Właściwość      | Wartość               |
    | ------------- | ------------------- |
    | Model domyślny | `nomic-embed-text`  |
    | Automatyczne pobieranie     | Tak — model embeddingów jest pobierany automatycznie, jeśli nie występuje lokalnie |

    Embeddingi w czasie zapytania używają prefiksów pobierania dla modeli, które ich wymagają lub je zalecają, w tym `nomic-embed-text`, `qwen3-embedding` i `mxbai-embed-large`. Partie dokumentów pamięci pozostają surowe, więc istniejące indeksy nie wymagają migracji formatu.

    Aby wybrać Ollama jako dostawcę embeddingów wyszukiwania pamięci:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Dla zdalnego hosta embeddingów utrzymuj uwierzytelnianie ograniczone do tego hosta:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Konfiguracja streamingu">
    Integracja OpenClaw z Ollama domyślnie używa **natywnego API Ollama** (`/api/chat`), które w pełni obsługuje jednocześnie streaming i wywoływanie narzędzi. Nie jest wymagana żadna specjalna konfiguracja.

    W przypadku natywnych żądań `/api/chat` OpenClaw przekazuje też kontrolę thinking bezpośrednio do Ollama: `/think off` i `openclaw agent --thinking off` wysyłają `think: false` najwyższego poziomu, chyba że skonfigurowano jawną wartość modelu `params.think`/`params.thinking`, natomiast `/think low|medium|high` wysyłają odpowiadający ciąg effort `think` najwyższego poziomu. `/think max` mapuje się na najwyższy natywny effort Ollama, `think: "high"`.

    <Tip>
    Jeśli musisz użyć endpointu zgodnego z OpenAI, zobacz sekcję „Starszy tryb zgodny z OpenAI” powyżej. Streaming i wywoływanie narzędzi mogą w tym trybie nie działać jednocześnie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pętla awarii WSL2 (powtarzające się restarty)">
    W WSL2 z NVIDIA/CUDA oficjalny instalator Ollama dla Linuksa tworzy jednostkę systemd `ollama.service` z `Restart=always`. Jeśli ta usługa uruchamia się automatycznie i ładuje model wspierany przez GPU podczas startu WSL2, Ollama może przypiąć pamięć hosta w trakcie ładowania modelu. Odzyskiwanie pamięci Hyper-V nie zawsze może odzyskać te przypięte strony, więc Windows może zakończyć maszynę wirtualną WSL2, systemd ponownie uruchamia Ollama i pętla się powtarza.

    Typowe dowody:

    - powtarzające się restarty lub zakończenia WSL2 po stronie Windows
    - wysokie użycie CPU w `app.slice` lub `ollama.service` krótko po uruchomieniu WSL2
    - SIGTERM od systemd zamiast zdarzenia zabójcy OOM Linuksa

    OpenClaw rejestruje ostrzeżenie przy starcie, gdy wykryje WSL2, włączone `ollama.service` z `Restart=always` oraz widoczne znaczniki CUDA.

    Ograniczenie problemu:

    ```bash
    sudo systemctl disable ollama
    ```

    Dodaj to do `%USERPROFILE%\.wslconfig` po stronie Windows, a następnie uruchom `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ustaw krótszy keep-alive w środowisku usługi Ollama albo uruchamiaj Ollama ręcznie tylko wtedy, gdy jej potrzebujesz:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Zobacz [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama nie wykryto">
    Upewnij się, że Ollama działa, że ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania) oraz że **nie** zdefiniowano jawnego wpisu `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Sprawdź, czy API jest dostępne:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Brak dostępnych modeli">
    Jeśli Twojego modelu nie ma na liście, pobierz model lokalnie albo zdefiniuj go jawnie w `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Odmowa połączenia">
    Sprawdź, czy Ollama działa na właściwym porcie:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Zdalny host działa z curl, ale nie z OpenClaw">
    Zweryfikuj z tej samej maszyny i tego samego środowiska uruchomieniowego, w którym działa Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Typowe przyczyny:

    - `baseUrl` wskazuje na `localhost`, ale Gateway działa w Dockerze lub na innym hoście.
    - URL używa `/v1`, co wybiera zachowanie zgodne z OpenAI zamiast natywnego Ollama.
    - Zdalny host wymaga zmian w zaporze lub powiązaniu LAN po stronie Ollama.
    - Model jest obecny w demonie na Twoim laptopie, ale nie w zdalnym demonie.

  </Accordion>

  <Accordion title="Model zwraca JSON narzędzia jako tekst">
    Zwykle oznacza to, że dostawca używa trybu zgodnego z OpenAI albo model nie potrafi obsłużyć schematów narzędzi.

    Preferuj natywny tryb Ollama:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Jeśli mały model lokalny nadal nie radzi sobie ze schematami narzędzi, ustaw `compat.supportsTools: false` w tym wpisie modelu i przetestuj ponownie.

  </Accordion>

  <Accordion title="Kimi lub GLM zwraca zniekształcone symbole">
    Hostowane odpowiedzi Kimi/GLM, które są długimi, nielingwistycznymi ciągami symboli, są traktowane jako nieudane wyjście dostawcy zamiast udanej odpowiedzi asystenta. Dzięki temu normalna logika ponawiania, fallbacku lub obsługi błędów może przejąć działanie bez zapisywania uszkodzonego tekstu w sesji.

    Jeśli dzieje się to wielokrotnie, przechwyć surową nazwę modelu, bieżący plik sesji oraz informację, czy uruchomienie używało `Cloud + Local` czy `Cloud only`, a następnie spróbuj świeżej sesji i modelu fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Zimny model lokalny przekracza limit czasu">
    Duże modele lokalne mogą wymagać długiego pierwszego ładowania, zanim rozpocznie się streaming. Ogranicz limit czasu do dostawcy Ollama i opcjonalnie poproś Ollama o utrzymywanie modelu załadowanego między turami:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Jeśli sam host wolno akceptuje połączenia, `timeoutSeconds` rozszerza również chroniony limit czasu połączenia Undici dla tego dostawcy.

  </Accordion>

  <Accordion title="Model z dużym kontekstem jest zbyt wolny lub kończy mu się pamięć">
    Wiele modeli Ollama deklaruje konteksty większe, niż Twój sprzęt może komfortowo obsłużyć. Natywna Ollama używa własnej domyślnej wartości kontekstu środowiska uruchomieniowego Ollama, chyba że ustawisz `params.num_ctx`. Ogranicz zarówno budżet OpenClaw, jak i kontekst żądania Ollama, gdy chcesz przewidywalnego opóźnienia do pierwszego tokena:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Najpierw zmniejsz `contextWindow`, jeśli OpenClaw wysyła zbyt dużo promptu. Zmniejsz `params.num_ctx`, jeśli Ollama ładuje kontekst środowiska uruchomieniowego zbyt duży dla tej maszyny. Zmniejsz `maxTokens`, jeśli generowanie trwa zbyt długo.

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Ollama Web Search" href="/pl/tools/ollama-search" icon="magnifying-glass">
    Pełna konfiguracja i szczegóły zachowania wyszukiwania w internecie opartego na Ollama.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
