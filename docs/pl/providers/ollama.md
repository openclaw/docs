---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami chmurowymi lub lokalnymi za pośrednictwem Ollama
    - Potrzebujesz wskazówek dotyczących instalacji i konfiguracji Ollama
    - Chcesz używać modeli wizyjnych Ollama do rozumienia obrazów
summary: Uruchom OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-06-27T18:13:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw integruje się z natywnym API Ollama (`/api/chat`) dla hostowanych modeli chmurowych oraz lokalnych/samodzielnie hostowanych serwerów Ollama. Możesz używać Ollama w trzech trybach: `Cloud + Local` przez osiągalny host Ollama, `Cloud only` względem `https://ollama.com` albo `Local only` względem osiągalnego hosta Ollama.

OpenClaw rejestruje także `ollama-cloud` jako pełnoprawny identyfikator hostowanego dostawcy do bezpośredniego użycia Ollama Cloud. Używaj odwołań takich jak `ollama-cloud/kimi-k2.5:cloud`, gdy chcesz routingu wyłącznie przez chmurę bez współdzielenia lokalnego identyfikatora dostawcy `ollama`.

Dedykowaną stronę konfiguracji tylko dla chmury znajdziesz w [Ollama Cloud](/pl/providers/ollama-cloud).

<Warning>
**Użytkownicy zdalnego Ollama**: Nie używaj zgodnego z OpenAI adresu URL `/v1` (`http://host:11434/v1`) z OpenClaw. Psuje to wywoływanie narzędzi i modele mogą wypisywać surowy JSON narzędzi jako zwykły tekst. Zamiast tego użyj natywnego adresu URL API Ollama: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

Konfiguracja dostawcy Ollama używa `baseUrl` jako klucza kanonicznego. OpenClaw akceptuje też `baseURL` dla zgodności z przykładami w stylu OpenAI SDK, ale nowa konfiguracja powinna preferować `baseUrl`.

## Reguły uwierzytelniania

<AccordionGroup>
  <Accordion title="Hosty lokalne i LAN">
    Lokalne i LAN-owe hosty Ollama nie potrzebują prawdziwego tokena bearer. OpenClaw używa lokalnego znacznika `ollama-local` tylko dla adresów URL bazowych Ollama typu loopback, sieć prywatna, `.local` oraz sama nazwa hosta.
  </Accordion>
  <Accordion title="Hosty zdalne i Ollama Cloud">
    Zdalne hosty publiczne i Ollama Cloud (`https://ollama.com`) wymagają prawdziwych danych uwierzytelniających przez `OLLAMA_API_KEY`, profil uwierzytelniania albo `apiKey` dostawcy. Do bezpośredniego użycia hostowanego preferuj dostawcę `ollama-cloud`.
  </Accordion>
  <Accordion title="Niestandardowe identyfikatory dostawców">
    Niestandardowe identyfikatory dostawców, które ustawiają `api: "ollama"`, podlegają tym samym regułom. Na przykład dostawca `ollama-remote`, który wskazuje na prywatny host Ollama w LAN, może użyć `apiKey: "ollama-local"`, a podagenci rozwiążą ten znacznik przez hook dostawcy Ollama zamiast traktować go jako brakujące dane uwierzytelniające. Wyszukiwanie pamięci może też ustawić `agents.defaults.memorySearch.provider` na ten niestandardowy identyfikator dostawcy, aby embeddingi używały odpowiadającego mu punktu końcowego Ollama.
  </Accordion>
  <Accordion title="Profile uwierzytelniania">
    `auth-profiles.json` przechowuje dane uwierzytelniające dla identyfikatora dostawcy. Ustawienia punktu końcowego (`baseUrl`, `api`, identyfikatory modeli, nagłówki, limity czasu) umieść w `models.providers.<id>`. Starsze płaskie pliki profili uwierzytelniania, takie jak `{ "ollama-windows": { "apiKey": "ollama-local" } }`, nie są formatem runtime; uruchom `openclaw doctor --fix`, aby przepisać je do kanonicznego profilu klucza API `ollama-windows:default` z kopią zapasową. `baseUrl` w tym pliku to szum zgodności i należy przenieść go do konfiguracji dostawcy.
  </Accordion>
  <Accordion title="Zakres embeddingów pamięci">
    Gdy Ollama jest używana do embeddingów pamięci, uwierzytelnianie bearer jest ograniczone do hosta, przy którym zostało zadeklarowane:

    - Klucz na poziomie dostawcy jest wysyłany tylko do hosta Ollama tego dostawcy.
    - `agents.*.memorySearch.remote.apiKey` jest wysyłany tylko do jego zdalnego hosta embeddingów.
    - Czysta wartość env `OLLAMA_API_KEY` jest traktowana jako konwencja Ollama Cloud i domyślnie nie jest wysyłana do hostów lokalnych ani samodzielnie hostowanych.

  </Accordion>
</AccordionGroup>

## Pierwsze kroki

Wybierz preferowaną metodę konfiguracji i tryb.

<Tabs>
  <Tab title="Onboarding (zalecane)">
    **Najlepsze dla:** najszybszej ścieżki do działającej konfiguracji Ollama w chmurze lub lokalnie.

    <Steps>
      <Step title="Uruchom onboarding">
        ```bash
        openclaw onboard
        ```

        Wybierz **Ollama** z listy dostawców.
      </Step>
      <Step title="Wybierz tryb">
        - **Chmura + lokalnie** — lokalny host Ollama oraz modele chmurowe routowane przez ten host
        - **Tylko chmura** — hostowane modele Ollama przez `https://ollama.com`
        - **Tylko lokalnie** — tylko modele lokalne

      </Step>
      <Step title="Wybierz model">
        `Cloud only` prosi o `OLLAMA_API_KEY` i sugeruje hostowane domyślne modele chmurowe. `Cloud + Local` i `Local only` proszą o bazowy adres URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, jeśli nie jest jeszcze dostępny. Gdy Ollama zgłasza zainstalowany tag `:latest`, taki jak `gemma4:latest`, konfiguracja pokazuje ten zainstalowany model raz zamiast pokazywać zarówno `gemma4`, jak i `gemma4:latest` albo ponownie pobierać sam alias. `Cloud + Local` sprawdza też, czy ten host Ollama jest zalogowany do dostępu chmurowego.
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
    **Najlepsze dla:** pełnej kontroli nad konfiguracją chmurową lub lokalną.

    <Steps>
      <Step title="Wybierz chmurę lub lokalnie">
        - **Chmura + lokalnie**: zainstaluj Ollama, zaloguj się przez `ollama signin` i routuj żądania chmurowe przez ten host
        - **Tylko chmura**: użyj `https://ollama.com` z `OLLAMA_API_KEY`
        - **Tylko lokalnie**: zainstaluj Ollama z [ollama.com/download](https://ollama.com/download)

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

        Albo ustaw domyślny model w konfiguracji:

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
  <Tab title="Chmura + lokalnie">
    `Cloud + Local` używa osiągalnego hosta Ollama jako punktu sterowania zarówno dla modeli lokalnych, jak i chmurowych. To preferowany przez Ollama przepływ hybrydowy.

    Użyj **Chmura + lokalnie** podczas konfiguracji. OpenClaw pyta o bazowy adres URL Ollama, wykrywa lokalne modele z tego hosta i sprawdza, czy host jest zalogowany do dostępu chmurowego przez `ollama signin`. Gdy host jest zalogowany, OpenClaw sugeruje też hostowane domyślne modele chmurowe, takie jak `kimi-k2.5:cloud`, `minimax-m2.7:cloud` i `glm-5.1:cloud`.

    Jeśli host nie jest jeszcze zalogowany, OpenClaw utrzymuje konfigurację tylko lokalną, dopóki nie uruchomisz `ollama signin`.

  </Tab>

  <Tab title="Tylko chmura">
    `Cloud only` działa względem hostowanego API Ollama pod `https://ollama.com`.

    Użyj **Tylko chmura** podczas konfiguracji. OpenClaw prosi o `OLLAMA_API_KEY`, ustawia `baseUrl: "https://ollama.com"` i zasila listę hostowanych modeli chmurowych. Ta ścieżka **nie** wymaga lokalnego serwera Ollama ani `ollama signin`.

    Lista modeli chmurowych pokazywana podczas `openclaw onboard` jest wypełniana na żywo z `https://ollama.com/api/tags`, z limitem 500 pozycji, więc wybór odzwierciedla bieżący hostowany katalog zamiast statycznego zestawu początkowego. Jeśli `ollama.com` jest nieosiągalne albo nie zwraca modeli podczas konfiguracji, OpenClaw wraca do poprzednich zakodowanych sugestii, aby onboarding nadal się zakończył.

    Możesz też skonfigurować pełnoprawnego dostawcę chmurowego bezpośrednio:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Tylko lokalnie">
    W trybie tylko lokalnym OpenClaw wykrywa modele ze skonfigurowanej instancji Ollama. Ta ścieżka jest przeznaczona dla lokalnych lub samodzielnie hostowanych serwerów Ollama.

    OpenClaw obecnie sugeruje `gemma4` jako lokalną wartość domyślną.

  </Tab>
</Tabs>

## Wykrywanie modeli (dostawca niejawny)

Gdy ustawisz `OLLAMA_API_KEY` (albo profil uwierzytelniania) i **nie** zdefiniujesz `models.providers.ollama` ani innego niestandardowego zdalnego dostawcy z `api: "ollama"`, OpenClaw wykrywa modele z lokalnej instancji Ollama pod `http://127.0.0.1:11434`.

| Zachowanie           | Szczegół                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zapytanie katalogu   | Wysyła zapytanie do `/api/tags`                                                                                                                                      |
| Wykrywanie możliwości | Używa prób best-effort `/api/show`, aby odczytać `contextWindow`, rozszerzone parametry Modelfile `num_ctx` oraz możliwości, w tym vision/tools                       |
| Modele wizyjne       | Modele z możliwością `vision` zgłoszoną przez `/api/show` są oznaczane jako obsługujące obrazy (`input: ["text", "image"]`), więc OpenClaw automatycznie wstrzykuje obrazy do promptu |
| Wykrywanie rozumowania | Używa możliwości z `/api/show`, gdy są dostępne, w tym `thinking`; wraca do heurystyki po nazwie modelu (`r1`, `reasoning`, `think`), gdy Ollama pomija możliwości |
| Limity tokenów       | Ustawia `maxTokens` na domyślny limit maksymalnej liczby tokenów Ollama używany przez OpenClaw                                                                       |
| Koszty               | Ustawia wszystkie koszty na `0`                                                                                                                                      |

Pozwala to uniknąć ręcznych wpisów modeli, jednocześnie utrzymując katalog zgodny z lokalną instancją Ollama. Możesz użyć pełnego odwołania, takiego jak `ollama/<pulled-model>:latest`, w lokalnym `infer model run`; OpenClaw rozwiązuje ten zainstalowany model z katalogu live Ollama bez wymagania ręcznie napisanego wpisu `models.json`.

Dla zalogowanych hostów Ollama niektóre modele `:cloud` mogą być używalne przez `/api/chat` i `/api/show`, zanim pojawią się w `/api/tags`. Gdy jawnie wybierzesz pełne odwołanie `ollama/<model>:cloud`, OpenClaw waliduje dokładnie ten brakujący model przez `/api/show` i dodaje go do katalogu runtime tylko wtedy, gdy Ollama potwierdzi metadane modelu. Literówki nadal kończą się błędem nieznanych modeli zamiast automatycznie tworzyć model.

```bash
# See what models are available
ollama list
openclaw models list
```

Do wąskiego testu smoke generowania tekstu, który omija pełną powierzchnię narzędzi agenta, użyj lokalnego `infer model run` z pełnym odwołaniem do modelu Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Ta ścieżka nadal używa skonfigurowanego dostawcy OpenClaw, uwierzytelniania i natywnego transportu Ollama, ale nie rozpoczyna tury agenta czatu ani nie ładuje kontekstu MCP/narzędzi. Jeśli to się powiedzie, a normalne odpowiedzi agenta zawodzą, w następnej kolejności rozwiąż problemy z promptem agenta i pojemnością narzędzi modelu.

Do wąskiego testu smoke modelu wizyjnego na tej samej lekkiej ścieżce dodaj jeden lub więcej plików obrazów do `infer model run`. Wysyła to prompt i obraz bezpośrednio do wybranego modelu wizyjnego Ollama bez ładowania narzędzi czatu, pamięci ani wcześniejszego kontekstu sesji:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` akceptuje pliki wykryte jako `image/*`, w tym typowe dane wejściowe PNG,
JPEG i WebP. Pliki niebędące obrazami są odrzucane przed wywołaniem Ollama.
Do rozpoznawania mowy użyj zamiast tego `openclaw infer audio transcribe`.

Gdy przełączysz rozmowę za pomocą `/model ollama/<model>`, OpenClaw traktuje
to jako dokładny wybór użytkownika. Jeśli skonfigurowany `baseUrl` Ollama jest
nieosiągalny, następna odpowiedź zakończy się błędem dostawcy zamiast po cichu
odpowiedzieć z innego skonfigurowanego modelu zapasowego.

Izolowane zadania Cron wykonują jedno dodatkowe lokalne sprawdzenie bezpieczeństwa przed rozpoczęciem
tury agenta. Jeśli wybrany model rozwiązuje się do lokalnego, prywatnosieciowego lub `.local`
dostawcy Ollama, a `/api/tags` jest nieosiągalne, OpenClaw zapisuje to uruchomienie Cron
jako `skipped` z wybranym `ollama/<model>` w tekście błędu. Wstępne sprawdzenie
punktu końcowego jest buforowane przez 5 minut, więc wiele zadań Cron wskazujących na tego samego
zatrzymanego demona Ollama nie uruchamia wszystkich nieudanych żądań modelu.

Zweryfikuj na żywo lokalną ścieżkę tekstową, natywną ścieżkę strumieniowania i osadzenia względem
lokalnego Ollama za pomocą:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

W przypadku testów dymnych klucza API Ollama Cloud skieruj test na żywo do `https://ollama.com`
i wybierz hostowany model z bieżącego katalogu:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Test dymny chmury uruchamia tekst, natywne strumieniowanie i wyszukiwanie w sieci. Domyślnie pomija osadzenia dla
`https://ollama.com`, ponieważ klucze API Ollama Cloud mogą nie autoryzować
`/api/embed`. Ustaw `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, gdy wyraźnie chcesz,
aby test na żywo zakończył się niepowodzeniem, jeśli skonfigurowany klucz chmurowy nie może użyć punktu końcowego embed.

Aby dodać nowy model, po prostu pobierz go za pomocą Ollama:

```bash
ollama pull mistral
```

Nowy model zostanie automatycznie wykryty i będzie dostępny do użycia.

<Note>
Jeśli ustawisz `models.providers.ollama` jawnie albo skonfigurujesz niestandardowego dostawcę zdalnego, takiego jak `models.providers.ollama-cloud` z `api: "ollama"`, automatyczne wykrywanie zostanie pominięte i musisz zdefiniować modele ręcznie. Niestandardowi dostawcy loopback, tacy jak `http://127.0.0.2:11434`, nadal są traktowani jako lokalni. Zobacz sekcję jawnej konfiguracji poniżej.
</Note>

## Wizja i opis obrazu

Wbudowany Plugin Ollama rejestruje Ollama jako dostawcę rozumienia mediów obsługującego obrazy. Pozwala to OpenClaw kierować jawne żądania opisu obrazu oraz skonfigurowane domyślne modele obrazów przez lokalne lub hostowane modele wizyjne Ollama.

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

`--model` musi być pełnym odwołaniem `<provider/model>`. Gdy jest ustawiony, `openclaw infer image describe` uruchamia ten model bezpośrednio zamiast pomijać opis, ponieważ model obsługuje natywną wizję.

Użyj `infer image describe`, gdy chcesz użyć przepływu dostawcy rozumienia obrazów OpenClaw, skonfigurowanego `agents.defaults.imageModel` i kształtu danych wyjściowych opisu obrazu. Użyj `infer model run --file`, gdy chcesz wykonać surową sondę modelu multimodalnego z niestandardowym promptem i jednym lub większą liczbą obrazów.

Aby ustawić Ollama jako domyślny model rozumienia obrazów dla przychodzących mediów, skonfiguruj `agents.defaults.imageModel`:

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

Preferuj pełne odwołanie `ollama/<model>`. Jeśli ten sam model jest wymieniony w `models.providers.ollama.models` z `input: ["text", "image"]` i żaden inny skonfigurowany dostawca obrazów nie udostępnia tego gołego identyfikatora modelu, OpenClaw normalizuje również gołe odwołanie `imageModel`, takie jak `qwen2.5vl:7b`, do `ollama/qwen2.5vl:7b`. Jeśli więcej niż jeden skonfigurowany dostawca obrazów ma ten sam goły identyfikator, użyj jawnie prefiksu dostawcy.

Powolne lokalne modele wizyjne mogą potrzebować dłuższego limitu czasu rozumienia obrazów niż modele chmurowe. Mogą też ulec awarii lub zatrzymać się, gdy Ollama próbuje przydzielić pełny reklamowany kontekst wizyjny na ograniczonym sprzęcie. Ustaw limit czasu możliwości i ogranicz `num_ctx` we wpisie modelu, gdy potrzebujesz tylko zwykłej tury opisu obrazu:

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

Ten limit czasu dotyczy rozumienia obrazów przychodzących oraz jawnego narzędzia `image`, które agent może wywołać podczas tury. `models.providers.ollama.timeoutSeconds` na poziomie dostawcy nadal kontroluje bazową osłonę żądania HTTP Ollama dla zwykłych wywołań modelu.

Zweryfikuj na żywo jawne narzędzie obrazu względem lokalnego Ollama za pomocą:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jeśli definiujesz `models.providers.ollama.models` ręcznie, oznacz modele wizyjne jako obsługujące wejście obrazu:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw odrzuca żądania opisu obrazu dla modeli, które nie są oznaczone jako obsługujące obrazy. Przy niejawnym wykrywaniu OpenClaw odczytuje to z Ollama, gdy `/api/show` zgłasza możliwość wizyjną.

## Konfiguracja

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Najprostsza ścieżka włączenia tylko lokalnie prowadzi przez zmienną środowiskową:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jeśli `OLLAMA_API_KEY` jest ustawiony, możesz pominąć `apiKey` we wpisie dostawcy, a OpenClaw uzupełni go do sprawdzeń dostępności.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Użyj jawnej konfiguracji, gdy chcesz skonfigurować hostowaną chmurę, Ollama działa na innym hoście/porcie, chcesz wymusić konkretne okna kontekstu lub listy modeli albo chcesz w pełni ręczne definicje modeli.

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

  <Tab title="Custom base URL">
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
  <Accordion title="Local model with auto-discovery">
    Użyj tego, gdy Ollama działa na tej samej maszynie co Gateway i chcesz, aby OpenClaw automatycznie wykrył zainstalowane modele.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Ta ścieżka utrzymuje konfigurację na minimalnym poziomie. Nie dodawaj bloku `models.providers.ollama`, chyba że chcesz definiować modele ręcznie.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` to budżet kontekstu po stronie OpenClaw. `params.num_ctx` jest wysyłany do Ollama dla żądania. Utrzymuj je zgodne, gdy twój sprzęt nie może uruchomić pełnego reklamowanego kontekstu modelu.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Użyj tego, gdy nie uruchamiasz lokalnego demona i chcesz bezpośrednio używać hostowanych modeli Ollama.

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    Użyj tego, gdy lokalny lub LAN demon Ollama jest zalogowany za pomocą `ollama signin` i ma obsługiwać zarówno modele lokalne, jak i modele `:cloud`.

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

  <Accordion title="Multiple Ollama hosts">
    Używaj niestandardowych identyfikatorów dostawców, gdy masz więcej niż jeden serwer Ollama. Każdy dostawca otrzymuje własny host, modele, uwierzytelnianie, limit czasu i odwołania do modeli.

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

    Gdy OpenClaw wysyła żądanie, aktywny prefiks dostawcy jest usuwany, więc `ollama-large/qwen3.5:27b` trafia do Ollama jako `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Odchudzony profil modelu lokalnego">
    Niektóre modele lokalne potrafią odpowiadać na proste prompty, ale mają trudności z pełną powierzchnią narzędzi agenta. Zacznij od ograniczenia narzędzi i kontekstu, zanim zmienisz globalne ustawienia środowiska uruchomieniowego.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    Używaj `compat.supportsTools: false` tylko wtedy, gdy model lub serwer niezawodnie zawodzi na schematach narzędzi. Ogranicza to możliwości agenta na rzecz stabilności.
    `localModelLean` usuwa przeglądarkę, Cron i narzędzia wiadomości z bezpośredniej powierzchni agenta oraz domyślnie umieszcza większe katalogi za ustrukturyzowanymi kontrolkami Tool Search, z wyjątkiem sytuacji, gdy uruchomienie musi zachować semantykę bezpośredniego dostarczania wiadomości, ale nie zmienia kontekstu środowiska uruchomieniowego Ollama ani trybu myślenia. Połącz to z jawnymi `params.num_ctx` i `params.thinking: false` w przypadku małych modeli myślących w stylu Qwen, które zapętlają się lub zużywają budżet odpowiedzi na ukryte rozumowanie.

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

Obsługiwane są również niestandardowe identyfikatory dostawców Ollama. Gdy odwołanie do modelu używa aktywnego
prefiksu dostawcy, na przykład `ollama-spark/qwen3:32b`, OpenClaw usuwa tylko ten
prefiks przed wywołaniem Ollama, aby serwer otrzymał `qwen3:32b`.

W przypadku wolnych modeli lokalnych preferuj dostrajanie żądań w zakresie dostawcy, zanim zwiększysz
limit czasu całego środowiska uruchomieniowego agenta:

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

`timeoutSeconds` dotyczy żądania HTTP modelu, w tym nawiązywania połączenia,
nagłówków, strumieniowania treści i całkowitego chronionego przerwania pobierania. `params.keep_alive`
jest przekazywane do Ollama jako najwyższego poziomu `keep_alive` w natywnych żądaniach `/api/chat`;
ustawiaj je dla modelu, gdy wąskim gardłem jest czas ładowania pierwszej tury.

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

W przypadku hostów zdalnych zastąp `127.0.0.1` hostem użytym w `baseUrl`. Jeśli `curl` działa, ale OpenClaw nie, sprawdź, czy Gateway działa na innej maszynie, w kontenerze lub na innym koncie usługi.

## Ollama Web Search

OpenClaw obsługuje **Ollama Web Search** jako wbudowanego dostawcę `web_search`.

| Właściwość  | Szczegół                                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | Używa skonfigurowanego hosta Ollama (`models.providers.ollama.baseUrl`, gdy jest ustawiony, w przeciwnym razie `http://127.0.0.1:11434`); `https://ollama.com` używa bezpośrednio hostowanego API |
| Uwierzytelnianie | Bez klucza dla zalogowanych lokalnych hostów Ollama; `OLLAMA_API_KEY` lub skonfigurowane uwierzytelnianie dostawcy dla bezpośredniego wyszukiwania przez `https://ollama.com` albo hostów chronionych uwierzytelnianiem |
| Wymaganie   | Hosty lokalne/samodzielnie hostowane muszą działać i być zalogowane za pomocą `ollama signin`; bezpośrednie wyszukiwanie hostowane wymaga `baseUrl: "https://ollama.com"` oraz prawdziwego klucza API Ollama |

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

Dla bezpośredniego wyszukiwania hostowanego przez Ollama Cloud:

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
Pełną konfigurację i szczegóły zachowania znajdziesz w [Ollama Web Search](/pl/tools/ollama-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Starszy tryb zgodny z OpenAI">
    <Warning>
    **Wywoływanie narzędzi nie jest niezawodne w trybie zgodnym z OpenAI.** Używaj tego trybu tylko wtedy, gdy potrzebujesz formatu OpenAI dla proxy i nie zależysz od natywnego zachowania wywoływania narzędzi.
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

    Ten tryb może nie obsługiwać jednocześnie strumieniowania i wywoływania narzędzi. Może być konieczne wyłączenie strumieniowania za pomocą `params: { streaming: false }` w konfiguracji modelu.

    Gdy `api: "openai-completions"` jest używane z Ollama, OpenClaw domyślnie wstrzykuje `options.num_ctx`, aby Ollama nie wróciła po cichu do okna kontekstu 4096. Jeśli Twoje proxy/upstream odrzuca nieznane pola `options`, wyłącz to zachowanie:

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
    W przypadku automatycznie wykrytych modeli OpenClaw używa okna kontekstu zgłoszonego przez Ollama, gdy jest dostępne, w tym większych wartości `PARAMETER num_ctx` z niestandardowych Modelfile. W przeciwnym razie wraca do domyślnego okna kontekstu Ollama używanego przez OpenClaw.

    Możesz ustawić domyślne wartości `contextWindow`, `contextTokens` i `maxTokens` na poziomie dostawcy dla każdego modelu u tego dostawcy Ollama, a następnie nadpisywać je dla poszczególnych modeli, gdy jest to potrzebne. `contextWindow` to budżet promptu i Compaction w OpenClaw. Natywne żądania Ollama pozostawiają `options.num_ctx` nieustawione, chyba że jawnie skonfigurujesz `params.num_ctx`, dzięki czemu Ollama może zastosować własny model, `OLLAMA_CONTEXT_LENGTH` lub domyślną wartość opartą na VRAM. Aby ograniczyć lub wymusić kontekst środowiska uruchomieniowego Ollama dla pojedynczego żądania bez przebudowywania Modelfile, ustaw `params.num_ctx`; wartości nieprawidłowe, zerowe, ujemne i nieskończone są ignorowane. Jeśli zaktualizowałeś starszą konfigurację, która używała tylko `contextWindow` lub `maxTokens`, aby wymusić kontekst natywnego żądania Ollama, uruchom `openclaw doctor --fix`, aby skopiować te jawne budżety dostawcy lub modelu do `params.num_ctx`. Adapter Ollama zgodny z OpenAI nadal domyślnie wstrzykuje `options.num_ctx` ze skonfigurowanego `params.num_ctx` lub `contextWindow`; wyłącz to za pomocą `injectNumCtxForOpenAICompat: false`, jeśli upstream odrzuca `options`.

    Natywne wpisy modeli Ollama akceptują również typowe opcje środowiska uruchomieniowego Ollama pod `params`, w tym `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` i `use_mmap`. OpenClaw przekazuje tylko klucze żądań Ollama, więc parametry środowiska uruchomieniowego OpenClaw, takie jak `streaming`, nie są ujawniane Ollama. Użyj `params.think` lub `params.thinking`, aby wysłać najwyższego poziomu `think` Ollama; `false` wyłącza myślenie na poziomie API dla modeli myślących w stylu Qwen.

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

    Działa również `agents.defaults.models["ollama/<model>"].params.num_ctx` dla pojedynczego modelu. Jeśli skonfigurowano oba ustawienia, jawny wpis modelu dostawcy ma pierwszeństwo przed domyślnym ustawieniem agenta.

  </Accordion>

  <Accordion title="Sterowanie myśleniem">
    W przypadku natywnych modeli Ollama OpenClaw przekazuje sterowanie myśleniem tak, jak oczekuje tego Ollama: najwyższego poziomu `think`, a nie `options.think`. Automatycznie wykryte modele, których odpowiedź `/api/show` zawiera możliwość `thinking`, udostępniają `/think low`, `/think medium`, `/think high` i `/think max`; modele niemyślące udostępniają tylko `/think off`.

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

    `params.think` lub `params.thinking` dla pojedynczego modelu może wyłączyć albo wymusić myślenie API Ollama dla konkretnego skonfigurowanego modelu. OpenClaw zachowuje te jawne parametry modelu, gdy aktywne uruchomienie ma tylko niejawne domyślne `off`; polecenia środowiska uruchomieniowego inne niż `off`, takie jak `/think medium`, nadal nadpisują aktywne uruchomienie.

  </Accordion>

  <Accordion title="Modele rozumujące">
    OpenClaw domyślnie traktuje modele o nazwach takich jak `deepseek-r1`, `reasoning` lub `think` jako zdolne do rozumowania.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Nie jest wymagana dodatkowa konfiguracja. OpenClaw oznacza je automatycznie.

  </Accordion>

  <Accordion title="Koszty modeli">
    Ollama jest bezpłatna i działa lokalnie, więc wszystkie koszty modeli są ustawione na $0. Dotyczy to zarówno modeli automatycznie wykrytych, jak i zdefiniowanych ręcznie.
  </Accordion>

  <Accordion title="Embeddingi pamięci">
    Dołączony Plugin Ollama rejestruje dostawcę embeddingów pamięci dla
    [wyszukiwania w pamięci](/pl/concepts/memory). Używa skonfigurowanego bazowego adresu URL
    Ollama oraz klucza API, wywołuje bieżący endpoint Ollama `/api/embed` i, gdy to możliwe,
    grupuje wiele fragmentów pamięci w jedno żądanie `input`.

    Gdy `proxy.enabled=true`, żądania embeddingów pamięci Ollama do dokładnego
    źródła host-local loopback wyprowadzonego ze skonfigurowanego `baseUrl` używają
    chronionej bezpośredniej ścieżki OpenClaw zamiast zarządzanego proxy przekazującego.
    Skonfigurowana nazwa hosta sama musi być `localhost` albo literalnym adresem IP loopback;
    nazwy DNS, które jedynie rozwiązują się do loopback, nadal używają zarządzanej ścieżki proxy.
    Hosty Ollama w sieci LAN, tailnet, sieci prywatnej i publiczne również pozostają na
    zarządzanej ścieżce proxy. Przekierowania do innego hosta lub portu nie dziedziczą zaufania.
    Operatorzy nadal mogą ustawić globalne ustawienie `proxy.loopbackMode: "proxy"`, aby
    wysyłać ruch loopback przez proxy, albo `proxy.loopbackMode: "block"`, aby
    odmawiać połączeń loopback przed otwarciem połączenia; zobacz
    [Zarządzane proxy](/pl/security/network-proxy#gateway-loopback-mode), aby poznać
    wpływ tego ustawienia na cały proces.

    | Właściwość      | Wartość               |
    | ------------- | ------------------- |
    | Domyślny model | `nomic-embed-text`  |
    | Automatyczne pobieranie     | Tak — model embeddingów jest pobierany automatycznie, jeśli nie jest obecny lokalnie |

    Embeddingi w czasie zapytania używają prefiksów pobierania dla modeli, które ich wymagają lub je zalecają, w tym `nomic-embed-text`, `qwen3-embedding` i `mxbai-embed-large`. Partie dokumentów pamięci pozostają surowe, więc istniejące indeksy nie wymagają migracji formatu.

    Aby wybrać Ollama jako dostawcę embeddingów wyszukiwania w pamięci:

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

  <Accordion title="Konfiguracja strumieniowania">
    Integracja Ollama w OpenClaw domyślnie używa **natywnego API Ollama** (`/api/chat`), które w pełni obsługuje jednocześnie strumieniowanie i wywoływanie narzędzi. Nie jest wymagana żadna specjalna konfiguracja.

    Dla natywnych żądań `/api/chat` OpenClaw przekazuje także sterowanie myśleniem bezpośrednio do Ollama: `/think off` i `openclaw agent --thinking off` wysyłają najwyższego poziomu `think: false`, chyba że skonfigurowano jawną wartość modelu `params.think`/`params.thinking`, natomiast `/think low|medium|high` wysyłają odpowiadający ciąg wysiłku `think` najwyższego poziomu. `/think max` mapuje się na najwyższy natywny wysiłek Ollama, `think: "high"`.

    <Tip>
    Jeśli musisz użyć endpointu zgodnego z OpenAI, zobacz sekcję „Starszy tryb zgodny z OpenAI” powyżej. Strumieniowanie i wywoływanie narzędzi mogą nie działać jednocześnie w tym trybie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pętla awarii WSL2 (powtarzające się restarty)">
    W WSL2 z NVIDIA/CUDA oficjalny instalator Ollama dla Linux tworzy jednostkę systemd `ollama.service` z `Restart=always`. Jeśli ta usługa uruchamia się automatycznie i ładuje model wspierany przez GPU podczas rozruchu WSL2, Ollama może przypiąć pamięć hosta podczas ładowania modelu. Odzyskiwanie pamięci Hyper-V nie zawsze może odzyskać te przypięte strony, więc Windows może zakończyć maszynę wirtualną WSL2, systemd ponownie uruchamia Ollama, a pętla się powtarza.

    Typowe dowody:

    - powtarzające się restarty lub zakończenia WSL2 po stronie Windows
    - wysokie użycie CPU w `app.slice` lub `ollama.service` krótko po starcie WSL2
    - SIGTERM od systemd zamiast zdarzenia Linux OOM-killer

    OpenClaw zapisuje ostrzeżenie startowe, gdy wykryje WSL2, włączone `ollama.service` z `Restart=always` oraz widoczne znaczniki CUDA.

    Ograniczenie problemu:

    ```bash
    sudo systemctl disable ollama
    ```

    Dodaj to do `%USERPROFILE%\.wslconfig` po stronie Windows, a następnie uruchom `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ustaw krótszy czas utrzymania aktywności w środowisku usługi Ollama albo uruchamiaj Ollama ręcznie tylko wtedy, gdy go potrzebujesz:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Zobacz [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama nie wykryto">
    Upewnij się, że Ollama działa i że ustawiono `OLLAMA_API_KEY` (albo profil uwierzytelniania) oraz że **nie** zdefiniowano jawnego wpisu `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Sprawdź, czy API jest dostępne:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Brak dostępnych modeli">
    Jeśli model nie jest widoczny na liście, pobierz model lokalnie albo zdefiniuj go jawnie w `models.providers.ollama`.

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
    Sprawdź z tej samej maszyny i środowiska uruchomieniowego, które uruchamia Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Typowe przyczyny:

    - `baseUrl` wskazuje na `localhost`, ale Gateway działa w Dockerze lub na innym hoście.
    - URL używa `/v1`, co wybiera zachowanie zgodne z OpenAI zamiast natywnego Ollama.
    - Zdalny host wymaga zmian zapory lub wiązania LAN po stronie Ollama.
    - Model jest obecny w demonie na laptopie, ale nie w zdalnym demonie.

  </Accordion>

  <Accordion title="Model wypisuje JSON narzędzia jako tekst">
    Zwykle oznacza to, że dostawca używa trybu zgodnego z OpenAI albo model nie potrafi obsługiwać schematów narzędzi.

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

    Jeśli mały model lokalny nadal zawodzi na schematach narzędzi, ustaw `compat.supportsTools: false` w tym wpisie modelu i przetestuj ponownie.

  </Accordion>

  <Accordion title="Kimi lub GLM zwraca zniekształcone symbole">
    Hostowane odpowiedzi Kimi/GLM, które są długimi, niejęzykowymi ciągami symboli, są traktowane jako nieudane wyjście dostawcy zamiast poprawnej odpowiedzi asystenta. Dzięki temu normalne ponawianie, fallback lub obsługa błędów może przejąć działanie bez utrwalania uszkodzonego tekstu w sesji.

    Jeśli dzieje się to wielokrotnie, przechwyć surową nazwę modelu, bieżący plik sesji oraz informację, czy uruchomienie używało `Cloud + Local` czy `Cloud only`, a następnie spróbuj świeżej sesji i modelu fallback:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Zimny model lokalny przekracza limit czasu">
    Duże modele lokalne mogą wymagać długiego pierwszego ładowania przed rozpoczęciem strumieniowania. Ogranicz limit czasu do dostawcy Ollama i opcjonalnie poproś Ollama o utrzymywanie modelu załadowanego między turami:

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

    Jeśli sam host wolno akceptuje połączenia, `timeoutSeconds` wydłuża także chroniony limit czasu połączenia Undici dla tego dostawcy.

  </Accordion>

  <Accordion title="Model z dużym kontekstem jest zbyt wolny albo kończy mu się pamięć">
    Wiele modeli Ollama deklaruje konteksty większe, niż Twój sprzęt może komfortowo obsłużyć. Natywne Ollama używa własnej domyślnej wartości kontekstu środowiska uruchomieniowego Ollama, chyba że ustawisz `params.num_ctx`. Ogranicz zarówno budżet OpenClaw, jak i kontekst żądania Ollama, gdy chcesz przewidywalnego opóźnienia do pierwszego tokenu:

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

    Najpierw obniż `contextWindow`, jeśli OpenClaw wysyła zbyt dużo promptu. Obniż `params.num_ctx`, jeśli Ollama ładuje kontekst środowiska uruchomieniowego zbyt duży dla tej maszyny. Obniż `maxTokens`, jeśli generowanie trwa zbyt długo.

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [FAQ](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, referencji modeli i zachowania failover.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Wyszukiwanie w sieci Ollama" href="/pl/tools/ollama-search" icon="magnifying-glass">
    Pełna konfiguracja i szczegóły zachowania wyszukiwania w sieci obsługiwanego przez Ollama.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
