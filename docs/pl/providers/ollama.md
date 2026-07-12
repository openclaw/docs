---
read_when:
    - Chcesz uruchomić OpenClaw z modelami chmurowymi lub lokalnymi za pośrednictwem Ollama
    - Potrzebujesz wskazówek dotyczących instalacji i konfiguracji Ollama
    - Chcesz używać modeli wizyjnych Ollama do rozumienia obrazów
summary: Uruchamianie OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T15:33:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw komunikuje się z natywnym API Ollama (`/api/chat`), a nie z punktem końcowym
`/v1` zgodnym z OpenAI. Obsługiwane są trzy tryby:

| Tryb                   | Używane zasoby                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Chmura + lokalnie      | Osiągalny host Ollama udostępniający modele lokalne oraz — po zalogowaniu — modele `:cloud`     |
| Tylko chmura           | Bezpośrednio `https://ollama.com`, bez lokalnego demona                                         |
| Tylko lokalnie         | Osiągalny host Ollama, wyłącznie modele lokalne                                                 |

Informacje o konfiguracji wyłącznie chmurowej z dedykowanym identyfikatorem dostawcy `ollama-cloud` znajdziesz w sekcji
[Ollama Cloud](/pl/providers/ollama-cloud). Używaj odwołań `ollama-cloud/<model>`, jeśli
chcesz oddzielić trasowanie chmurowe od lokalnego dostawcy `ollama`.

<Warning>
Nie używaj adresu URL `/v1` zgodnego z OpenAI (`http://host:11434/v1`). Powoduje on nieprawidłowe działanie wywołań narzędzi, a modele mogą zwracać nieprzetworzony kod JSON wywołania narzędzia jako zwykły tekst. Używaj natywnego adresu URL: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

Kanonicznym kluczem konfiguracji jest `baseUrl`. Akceptowany jest również klucz `baseURL`
na potrzeby przykładów w stylu zestawu SDK OpenAI, ale nowa konfiguracja powinna używać `baseUrl`.

## Reguły uwierzytelniania

<AccordionGroup>
  <Accordion title="Hosty lokalne i w sieci LAN">
    Adresy URL Ollama wskazujące local loopback, sieć prywatną, domenę `.local` lub samą nazwę hosta nie wymagają prawdziwego tokenu okaziciela. OpenClaw używa dla nich znacznika `ollama-local`.
  </Accordion>
  <Accordion title="Hosty zdalne i Ollama Cloud">
    Publiczne hosty zdalne oraz `https://ollama.com` wymagają prawdziwych danych uwierzytelniających: `OLLAMA_API_KEY`, profilu uwierzytelniania lub właściwości `apiKey` dostawcy. Do bezpośredniego korzystania z usługi hostowanej preferuj dostawcę `ollama-cloud`.
  </Accordion>
  <Accordion title="Niestandardowe identyfikatory dostawców">
    Niestandardowy dostawca z ustawieniem `api: "ollama"` podlega tym samym regułom. Na przykład dostawca `ollama-remote` wskazujący prywatny host w sieci LAN może używać `apiKey: "ollama-local"`; podagenty rozwiązują ten znacznik za pośrednictwem haka dostawcy Ollama, zamiast traktować go jako brakujące dane uwierzytelniające. `agents.defaults.memorySearch.provider` może również wskazywać identyfikator niestandardowego dostawcy, aby osadzenia korzystały z tego punktu końcowego Ollama.
  </Accordion>
  <Accordion title="Profile uwierzytelniania">
    Plik `auth-profiles.json` przechowuje dane uwierzytelniające dla identyfikatora dostawcy; ustawienia punktu końcowego (`baseUrl`, `api`, modele, nagłówki, limity czasu) umieść w `models.providers.<id>`. Starsze płaskie pliki, takie jak `{ "ollama-windows": { "apiKey": "ollama-local" } }`, nie są formatem używanym w czasie działania; polecenie `openclaw doctor --fix` przepisuje je do kanonicznego profilu klucza API `ollama-windows:default`, tworząc kopię zapasową. Wartość `baseUrl` w takim starszym pliku jest zbędna i powinna zostać przeniesiona do konfiguracji dostawcy.
  </Accordion>
  <Accordion title="Zakres osadzeń pamięci">
    Uwierzytelnianie okazicielem dla osadzeń pamięci Ollama jest ograniczone do hosta, dla którego je zadeklarowano:

    - Klucz na poziomie dostawcy jest wysyłany wyłącznie do hosta tego dostawcy.
    - `agents.*.memorySearch.remote.apiKey` jest wysyłany wyłącznie do zdalnego hosta osadzeń.
    - Sama wartość zmiennej środowiskowej `OLLAMA_API_KEY` jest traktowana zgodnie z konwencją Ollama Cloud i domyślnie nie jest wysyłana do hostów lokalnych ani samodzielnie hostowanych.

  </Accordion>
</AccordionGroup>

## Pierwsze kroki

<Tabs>
  <Tab title="Wprowadzenie (zalecane)">
    <Steps>
      <Step title="Uruchom wprowadzenie">
        ```bash
        openclaw onboard
        ```

        Wybierz **Ollama**, a następnie tryb: **Chmura + lokalnie**, **Tylko chmura** lub **Tylko lokalnie**.
      </Step>
      <Step title="Wybierz model">
        Tryb `Tylko chmura` prosi o `OLLAMA_API_KEY` i sugeruje domyślne modele hostowane w chmurze. Tryby `Chmura + lokalnie` i `Tylko lokalnie` proszą o bazowy adres URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, jeśli go brakuje. Zainstalowany tag `:latest`, taki jak `gemma4:latest`, jest wyświetlany jednokrotnie, bez powielania pozycji `gemma4`. Tryb `Chmura + lokalnie` sprawdza również, czy host jest zalogowany i ma dostęp do chmury.
      </Step>
      <Step title="Zweryfikuj">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Tryb nieinteraktywny:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    Flagi `--custom-base-url` i `--custom-model-id` są opcjonalne; ich pominięcie powoduje użycie domyślnego hosta lokalnego i sugerowanego modelu `gemma4`.

  </Tab>

  <Tab title="Konfiguracja ręczna">
    <Steps>
      <Step title="Zainstaluj i uruchom Ollama">
        Pobierz ją z [ollama.com/download](https://ollama.com/download), a następnie pobierz model:

        ```bash
        ollama pull gemma4
        ```

        Aby uzyskać hybrydowy dostęp do chmury, uruchom `ollama signin` na tym samym hoście.
      </Step>
      <Step title="Ustaw dane uwierzytelniające">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host lokalny/LAN, działa dowolna wartość
        export OLLAMA_API_KEY="your-real-key"   # wyłącznie https://ollama.com
        ```

        Alternatywnie w konfiguracji: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Wybierz model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Alternatywnie w konfiguracji:

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

## Modele chmurowe za pośrednictwem lokalnego hosta

Tryb `Chmura + lokalnie` trasuje zarówno modele lokalne, jak i modele `:cloud` przez jeden osiągalny
host Ollama — jest to hybrydowy przepływ Ollama i tryb, który należy wybrać podczas konfiguracji,
jeśli potrzebujesz obu rodzajów modeli.

OpenClaw prosi o bazowy adres URL, wykrywa modele lokalne i sprawdza stan
`ollama signin`. Po zalogowaniu sugeruje domyślne modele hostowane
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Jeśli
host nie jest zalogowany, konfiguracja pozostaje wyłącznie lokalna do czasu uruchomienia `ollama signin`.

Aby korzystać wyłącznie z chmury bez lokalnego demona, użyj `openclaw onboard --auth-choice ollama-cloud` i zapoznaj się z sekcją [Ollama Cloud](/pl/providers/ollama-cloud) — ta ścieżka nie wymaga polecenia `ollama signin` ani działającego serwera:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Lista modeli chmurowych wyświetlana podczas `openclaw onboard` jest pobierana na żywo z
`https://ollama.com/api/tags` i ograniczona do 500 pozycji, dzięki czemu selektor odzwierciedla
bieżący katalog hostowany. Jeśli `ollama.com` jest nieosiągalne lub podczas konfiguracji nie zwraca
żadnych modeli, OpenClaw korzysta z zapasowej, zakodowanej na stałe listy sugestii, aby
proces wprowadzenia nadal mógł się zakończyć.

## Wykrywanie modeli (dostawca niejawny)

Gdy ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania), a nie zdefiniowano ani
`models.providers.ollama`, ani innego niestandardowego dostawcy z ustawieniem `api: "ollama"`,
OpenClaw wykrywa modele z `http://127.0.0.1:11434`:

| Zachowanie               | Szczegóły                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zapytanie do katalogu    | `/api/tags`                                                                                                                                                                                                                                                                                                                                     |
| Wykrywanie możliwości    | Odczyt `/api/show` w trybie najlepszej próby pobiera `contextWindow`, parametry `num_ctx` pliku Modelfile oraz możliwości (obsługa obrazu/narzędzi/rozumowania)                                                                                                                                                                                     |
| Modele wizyjne           | Możliwość `vision` zwrócona przez `/api/show` oznacza model jako obsługujący obrazy (`input: ["text", "image"]`)                                                                                                                                                                                                                                  |
| Wykrywanie rozumowania   | Używa możliwości `thinking` z `/api/show`, gdy jest dostępna; gdy Ollama pomija możliwości, stosuje heurystykę nazwy (`r1`, `reason`, `reasoning`, `think`). Modele `glm-5.2:cloud` i `deepseek-v4-flash\|pro:cloud` są zawsze traktowane jako modele rozumujące, niezależnie od zgłoszonych możliwości. |
| Limity tokenów           | `maxTokens` domyślnie przyjmuje maksymalny limit tokenów Ollama określony przez OpenClaw                                                                                                                                                                                                                                                         |
| Koszty                   | Wszystkie koszty wynoszą `0`                                                                                                                                                                                                                                                                                                                    |

```bash
ollama list
openclaw models list
```

Ustawienie `models.providers.ollama` z jawną tablicą `models` albo
niestandardowego dostawcy z `api: "ollama"` i wartością `baseUrl` inną niż local loopback wyłącza
automatyczne wykrywanie; modele trzeba wówczas zdefiniować ręcznie (zobacz
[Konfiguracja](#configuration)). Wpis `models.providers.ollama` wskazujący
hostowane `https://ollama.com` również pomija wykrywanie, ponieważ modelami Ollama Cloud
zarządza dostawca. Niestandardowi dostawcy local loopback, tacy jak
`http://127.0.0.2:11434`, nadal są uznawani za lokalnych i zachowują automatyczne wykrywanie.

Możesz użyć pełnego odwołania, takiego jak `ollama/<pulled-model>:latest`, bez
ręcznie utworzonego wpisu w `models.json`; OpenClaw rozwiązuje je na żywo. W przypadku zalogowanych
hostów wybranie niewymienionego odwołania `ollama/<model>:cloud` powoduje sprawdzenie dokładnie tego
modelu za pomocą `/api/show` i dodanie go do katalogu środowiska uruchomieniowego tylko wtedy, gdy Ollama
potwierdzi metadane — literówki nadal powodują błąd nieznanego modelu.

### Testy dymne

Aby wykonać wąską próbę tekstową z pominięciem pełnego zestawu narzędzi agenta:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Odpowiedz dokładnie: pong" \
    --json
```

Dodaj `--file` z obrazem, aby wykonać uproszczoną próbę modelu wizyjnego (obsługiwane są formaty PNG/JPEG/WebP;
pliki niebędące obrazami są odrzucane przed wywołaniem Ollama — do dźwięku użyj
`openclaw infer audio transcribe`):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Opisz ten obraz jednym zdaniem." \
    --file ./photo.jpg \
    --json
```

Żadna z tych ścieżek nie ładuje narzędzi czatu, pamięci ani kontekstu sesji. Jeśli próba się powiedzie,
ale zwykłe odpowiedzi agenta nadal zawodzą, problem prawdopodobnie dotyczy zdolności modelu do obsługi
narzędzi lub agenta, a nie punktu końcowego.

Wybór modelu za pomocą `/model ollama/<model>` jest dokładnym wyborem użytkownika: jeśli
skonfigurowany `baseUrl` jest nieosiągalny, następna odpowiedź zakończy się błędem dostawcy,
zamiast po cichu przełączyć się na inny skonfigurowany model.

Izolowane zadania Cron wykonują jedno lokalne sprawdzenie bezpieczeństwa przed rozpoczęciem tury agenta:
jeśli wybrany model zostanie rozwiązany do dostawcy Ollama w sieci lokalnej, prywatnej lub `.local`,
a `/api/tags` jest nieosiągalne, OpenClaw zapisuje to uruchomienie jako
`skipped`, umieszczając model w tekście błędu. Wynik sprawdzenia punktu końcowego jest buforowany przez
5 minut dla każdego hosta, dzięki czemu powtarzające się zadania Cron skierowane do zatrzymanego demona
nie uruchamiają wszystkich żądań skazanych na niepowodzenie.

Weryfikacja na żywo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

W przypadku Ollama Cloud skieruj ten sam test na żywo do hostowanego punktu końcowego (domyślnie pomija
osadzenia; wymuś je za pomocą `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, ponieważ
klucz chmurowy może nie zezwalać na dostęp do `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Aby dodać model, pobierz go, a zostanie wykryty automatycznie:

```bash
ollama pull mistral
```

## Wnioskowanie lokalne na węźle

Agenci mogą delegować krótkie zadanie do modelu Ollama na sparowanym komputerze
stacjonarnym lub węźle serwerowym. Monit i odpowiedź przechodzą przez istniejące
uwierzytelnione połączenie Gateway/węzeł; żądanie jest wykonywane we własnym
punkcie końcowym local loopback Ollama węzła (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connect the node host">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Zatwierdź urządzenie i jego polecenia węzła na hoście Gateway, a następnie zweryfikuj:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Pierwsze połączenie lub aktualizacja dodająca polecenia Ollama może uruchomić
    zatwierdzanie poleceń węzła. Jeśli węzeł łączy się bez ogłaszania
    `ollama.models` i `ollama.chat`, ponownie sprawdź `openclaw nodes pending`.

  </Step>
  <Step title="Use it from an agent">
    Dołączony plugin Ollama udostępnia narzędzie `node_inference`. Agenci najpierw
    wywołują `action: "discover"`, a następnie `action: "run"` z węzłem i modelem
    z uzyskanego wyniku (`run` może pominąć węzeł, gdy połączony jest dokładnie
    jeden węzeł obsługujący tę funkcję). Na przykład: „Wykryj modele Ollama na
    moich węzłach, a następnie użyj najszybszego załadowanego modelu, aby
    podsumować ten tekst”.
  </Step>
</Steps>

Wykrywanie odczytuje `/api/tags`, sprawdza możliwości za pomocą `/api/show`
i używa `/api/ps`, gdy jest dostępne, aby umieścić już załadowane modele na
początku rankingu. Zwraca wyłącznie modele lokalne, które Ollama zgłasza jako
obsługujące czat (możliwość `completion`) — wiersze Ollama Cloud i modele
przeznaczone wyłącznie do osadzeń są wykluczane. Każde uruchomienie wyłącza
myślenie modelu i domyślnie ogranicza dane wyjściowe do 512 tokenów (twardy
limit 8192), chyba że wywołanie narzędzia zażąda innej wartości `maxTokens`;
niektóre modele (na przykład GPT-OSS) nie obsługują wyłączania myślenia i nadal
mogą emitować tokeny rozumowania.

Aby pozostawić Ollama uruchomioną na węźle bez udostępniania jej agentom:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Uruchom ponownie węzeł (`openclaw node restart` albo zatrzymaj i ponownie
uruchom `openclaw node run` w przypadku sesji pierwszoplanowej). Węzeł przestanie
ogłaszać `ollama.models` i `ollama.chat`; sama Ollama oraz dostawca Ollama
w Gateway pozostaną bez zmian. Ustaw wartość z powrotem na `true` i uruchom
ponownie, aby ponownie włączyć tę funkcję; zmieniony zestaw poleceń może po
ponownym połączeniu ponownie wymagać zatwierdzenia przez `openclaw nodes pending`.

Zweryfikuj polecenia węzła bezpośrednio, bez tury agenta:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` ogranicza czas, przez jaki węzeł może wykonywać polecenie;
`--timeout` ogranicza całkowity czas wywołania Gateway i powinien być dłuższy.

Wnioskowanie lokalne na węźle zawsze używa własnego punktu końcowego local loopback
węzła — nie używa ponownie skonfigurowanego zdalnego lub chmurowego
`models.providers.ollama.baseUrl`. Polecenia węzła są domyślnie dostępne na
hostach węzłów z systemami macOS, Linux i Windows oraz nadal podlegają zwykłym
zasadom parowania węzłów i wykonywania poleceń.

## Rozpoznawanie obrazu i opisywanie obrazów

Dołączony plugin Ollama rejestruje Ollama jako dostawcę rozumienia multimediów
obsługującego obrazy, dzięki czemu OpenClaw może kierować jawne żądania opisu
obrazu oraz skonfigurowane domyślne modele obrazów do lokalnych lub hostowanych
modeli wizyjnych Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` musi być pełnym odwołaniem `<provider/model>`; gdy jest ustawione,
`infer image describe` najpierw próbuje użyć tego modelu, zamiast pomijać opis
w przypadku modeli, które już natywnie obsługują rozpoznawanie obrazu. Jeśli
wywołanie się nie powiedzie, OpenClaw może kontynuować przy użyciu
`agents.defaults.imageModel.fallbacks`; błędy przygotowania pliku lub adresu URL
powodują niepowodzenie przed podjęciem próby użycia wariantu rezerwowego. Użyj
`infer image describe` dla przepływu rozumienia obrazów OpenClaw i skonfigurowanego
`imageModel`; użyj `infer model run --file` do bezpośredniego testu
multimodalnego z niestandardowym monitem.

Aby ustawić Ollama jako domyślnego dostawcę rozumienia obrazów dla przychodzących
multimediów:

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

Preferuj pełne odwołanie `ollama/<model>`. Odwołanie `imageModel` bez prefiksu,
takie jak `qwen2.5vl:7b`, jest normalizowane do `ollama/qwen2.5vl:7b` tylko wtedy,
gdy dokładnie ten model znajduje się na liście `models.providers.ollama.models`
z ustawieniem `input: ["text", "image"]` i żaden inny skonfigurowany dostawca
obrazów nie udostępnia tego samego identyfikatora bez prefiksu; w przeciwnym
razie jawnie użyj prefiksu dostawcy.

Powolne lokalne modele wizyjne mogą wymagać dłuższego limitu czasu rozumienia
obrazów niż modele chmurowe i mogą ulegać awarii na sprzęcie o ograniczonych
zasobach, jeśli Ollama spróbuje przydzielić pełny deklarowany kontekst wizyjny
modelu. Ustaw limit czasu możliwości i ogranicz `num_ctx`:

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

Ten limit czasu dotyczy rozumienia przychodzących obrazów oraz jawnego narzędzia
`image`. `models.providers.ollama.timeoutSeconds` nadal kontroluje bazowe
zabezpieczenie limitu czasu żądania HTTP do Ollama dla zwykłych wywołań modelu.

Weryfikacja na żywo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jeśli definiujesz `models.providers.ollama.models` ręcznie, jawnie oznacz modele
wizyjne:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw odrzuca żądania opisu obrazu dla modeli, które nie zostały oznaczone
jako obsługujące obrazy. W przypadku niejawnego wykrywania informacja ta pochodzi
z możliwości rozpoznawania obrazu zwracanej przez `/api/show`.

## Konfiguracja

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jeśli ustawiono `OLLAMA_API_KEY`, możesz pominąć `apiKey` we wpisie dostawcy; OpenClaw uzupełni tę wartość na potrzeby sprawdzania dostępności.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Użyj jawnej konfiguracji w przypadku hostowanej konfiguracji chmurowej,
    niestandardowego hosta lub portu, wymuszonych okien kontekstu albo w pełni
    ręcznych list modeli:

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
    Jawna konfiguracja wyłącza automatyczne wykrywanie, dlatego modele muszą
    zostać wymienione:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
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
    Nie dodawaj `/v1`. Ta ścieżka wybiera tryb zgodny z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne.
    </Warning>

  </Tab>
</Tabs>

## Typowe konfiguracje

Zastąp identyfikatory modeli dokładnymi nazwami z `ollama list` lub
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama na tej samej maszynie co Gateway, wykrywana automatycznie:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Nie dodawaj bloku `models.providers.ollama`, chyba że potrzebujesz modeli
    definiowanych ręcznie.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` to budżet kontekstu OpenClaw; `params.num_ctx` jest wysyłane
    do Ollama. Zachowaj zgodność tych wartości, gdy sprzęt nie jest w stanie
    obsłużyć pełnego deklarowanego kontekstu modelu.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Bez lokalnego demona, bezpośrednio hostowane modele:

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

    Aby zamiast tej struktury użyć dedykowanego identyfikatora dostawcy
    `ollama-cloud`, zobacz [Ollama Cloud](/pl/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
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
    Niestandardowe identyfikatory dostawców przy uruchamianiu więcej niż jednego serwera Ollama; każdy ma
    własny host, modele, uwierzytelnianie i limit czasu.

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

    OpenClaw usuwa prefiks aktywnego dostawcy (w razie potrzeby używając samego
    prefiksu `ollama/`) przed wywołaniem Ollama, dlatego `ollama-large/qwen3.5:27b`
    trafia do Ollama jako `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Odchudzony profil modelu lokalnego">
    Niektóre modele lokalne radzą sobie z prostymi poleceniami, ale mają trudności z pełnym zestawem
    narzędzi agenta. Ogranicz narzędzia i kontekst przed zmianą globalnych
    ustawień środowiska wykonawczego:

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

    Używaj `compat.supportsTools: false` tylko wtedy, gdy model lub serwer niezawodnie
    zawodzi przy schematach narzędzi — oznacza to rezygnację z części możliwości agenta na rzecz stabilności.
    `localModelLean` usuwa z bezpośredniego zestawu narzędzi agenta rozbudowane narzędzia
    przeglądarki, Cron, wiadomości, generowania multimediów, obsługi głosu i plików PDF,
    chyba że są wyraźnie wymagane, a większe katalogi umieszcza za wyszukiwaniem narzędzi.
    Nie zmienia kontekstu środowiska wykonawczego ani trybu rozumowania Ollama. W przypadku małych modeli
    rozumujących w stylu Qwen, które wpadają w pętle lub zużywają budżet na ukryte rozumowanie,
    połącz tę opcję z `params.num_ctx` i `params.thinking: false`.

  </Accordion>
</AccordionGroup>

### Wybór modelu

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

Niestandardowe identyfikatory dostawców działają tak samo: w przypadku odwołania używającego prefiksu
aktywnego dostawcy, takiego jak `ollama-spark/qwen3:32b`, OpenClaw usuwa ten prefiks przed
wywołaniem Ollama i wysyła `qwen3:32b`.

W przypadku wolnych modeli lokalnych preferuj dostrajanie w zakresie dostawcy przed zwiększeniem limitu czasu
całego środowiska wykonawczego agenta:

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

`timeoutSeconds` obejmuje żądanie HTTP modelu: nawiązanie połączenia, nagłówki,
strumieniowanie treści oraz całkowite przerwanie chronionego pobierania. `params.keep_alive` jest
przekazywane jako `keep_alive` najwyższego poziomu w natywnych żądaniach `/api/chat`; ustaw tę opcję
osobno dla każdego modelu, gdy wąskim gardłem jest czas ładowania przy pierwszym wywołaniu.

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

W przypadku hostów zdalnych zastąp `127.0.0.1` hostem z `baseUrl`. Jeśli `curl`
działa, ale OpenClaw nie, sprawdź, czy Gateway działa na innym
komputerze, w innym kontenerze lub na innym koncie usługi.

## Wyszukiwanie internetowe Ollama

OpenClaw zawiera **wyszukiwanie internetowe Ollama** jako dostawcę `web_search`.

| Właściwość   | Szczegóły                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host         | `models.providers.ollama.baseUrl`, jeśli ustawiono; w przeciwnym razie `http://127.0.0.1:11434`; `https://ollama.com` korzysta bezpośrednio z hostowanego API |
| Uwierzytelnianie | Bez klucza dla zalogowanego hosta lokalnego; `OLLAMA_API_KEY` lub skonfigurowane uwierzytelnianie dostawcy do bezpośredniego wyszukiwania przez `https://ollama.com` albo hostów chronionych uwierzytelnianiem |
| Wymaganie    | Hosty lokalne/samodzielnie hostowane muszą działać i być zalogowane za pomocą `ollama signin`; bezpośrednie wyszukiwanie hostowane wymaga `baseUrl: "https://ollama.com"` oraz prawdziwego klucza API |

Wybierz tę opcję podczas `openclaw onboard` lub `openclaw configure --section web` albo ustaw:

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

W przypadku bezpośredniego wyszukiwania hostowanego przez Ollama Cloud:

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

W przypadku samodzielnie hostowanego hosta OpenClaw najpierw próbuje użyć lokalnego serwera proxy
`/api/experimental/web_search`, a następnie przechodzi do hostowanej ścieżki
`/api/web_search` na tym samym hoście; zalogowany lokalny demon zwykle odpowiada
za pośrednictwem lokalnego serwera proxy. Bezpośrednie wywołania `https://ollama.com` zawsze używają
hostowanego punktu końcowego `/api/web_search`.

<Note>
Pełny opis konfiguracji i działania znajdziesz w sekcji [Wyszukiwanie internetowe Ollama](/pl/tools/ollama-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Starszy tryb zgodny z OpenAI">
    <Warning>
    **Wywoływanie narzędzi nie jest niezawodne w tym trybie.** Używaj go tylko wtedy, gdy serwer proxy wymaga formatu OpenAI, a natywne wywoływanie narzędzi nie jest potrzebne.
    </Warning>

    Ustaw jawnie `api: "openai-completions"` dla serwera proxy dostępnego za
    `/v1/chat/completions`:

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

    Ten tryb może nie obsługiwać jednocześnie strumieniowania i wywoływania narzędzi;
    może być konieczne ustawienie `params: { streaming: false }` w modelu.

    OpenClaw domyślnie wstrzykuje w tym trybie `options.num_ctx`, aby Ollama
    nie przechodziła bez ostrzeżenia do kontekstu o długości 4096 tokenów. Jeśli serwer proxy odrzuca
    nieznane pola `options`, wyłącz tę funkcję:

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
    W przypadku automatycznie wykrytych modeli OpenClaw używa okna kontekstu zgłaszanego
    przez `/api/show`, w tym większych wartości `PARAMETER num_ctx` z niestandardowych
    plików Modelfile; w przeciwnym razie używa domyślnego okna kontekstu Ollama
    w OpenClaw.

    Opcje `contextWindow`, `contextTokens` i `maxTokens` na poziomie dostawcy ustawiają
    wartości domyślne dla każdego modelu tego dostawcy i mogą być nadpisane osobno
    dla każdego modelu. `contextWindow` jest własnym budżetem polecenia/Compaction OpenClaw.
    Natywne żądania `/api/chat` pozostawiają `options.num_ctx` bez ustawienia, chyba że
    jawnie ustawisz `params.num_ctx`, dzięki czemu Ollama stosuje własną wartość domyślną
    modelu, `OLLAMA_CONTEXT_LENGTH` lub wartość zależną od pamięci VRAM; nieprawidłowe,
    zerowe, ujemne lub nieskończone wartości `params.num_ctx` są ignorowane. Jeśli starsza
    konfiguracja używała tylko `contextWindow`/`maxTokens` do wymuszania kontekstu
    natywnego żądania, uruchom `openclaw doctor --fix`, aby skopiować te wartości do
    `params.num_ctx`. Adapter zgodny z OpenAI nadal domyślnie wstrzykuje
    `options.num_ctx` ze skonfigurowanego `params.num_ctx` lub `contextWindow`; wyłącz
    to za pomocą `injectNumCtxForOpenAICompat: false`, jeśli system nadrzędny odrzuca `options`.

    Natywne wpisy modeli przyjmują również typowe opcje środowiska wykonawczego Ollama w
    `params`, przekazywane jako natywne `options` żądania `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` i `num_thread`.
    Kilka kluczy (`format`, `keep_alive`, `truncate`, `shift`) jest przekazywanych jako
    pola żądania najwyższego poziomu zamiast zagnieżdżonych `options`. OpenClaw przekazuje
    tylko te klucze żądań Ollama, dlatego parametry dotyczące wyłącznie środowiska wykonawczego,
    takie jak `streaming`, nigdy nie są wysyłane do Ollama. Użyj `params.think` (lub
    `params.thinking`), aby ustawić `think` najwyższego poziomu; `false` wyłącza rozumowanie
    na poziomie API w modelach rozumujących w stylu Qwen.

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

    Opcja `agents.defaults.models["ollama/<model>"].params.num_ctx` dla poszczególnych modeli
    również działa; jawny wpis modelu dostawcy ma pierwszeństwo, jeśli ustawiono obie opcje.

  </Accordion>

  <Accordion title="Sterowanie rozumowaniem">
    OpenClaw przekazuje ustawienie rozumowania w sposób oczekiwany przez Ollama: jako `think`
    najwyższego poziomu, a nie `options.think`. Automatycznie wykryte modele, dla których
    `/api/show` zgłasza możliwość `thinking`, udostępniają `/think low`, `/think medium`,
    `/think high` i `/think max`; modele bez rozumowania udostępniają tylko `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Możesz też ustawić wartość domyślną modelu:

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

    Parametry `params.think`/`params.thinking` poszczególnych modeli mogą wyłączyć lub wymusić
    myślenie API dla konkretnego modelu. OpenClaw zachowuje tę jawną konfigurację,
    gdy aktywne uruchomienie ma tylko domyślną, niejawną wartość `off`; polecenie
    środowiska uruchomieniowego z wartością inną niż `off`, takie jak `/think medium`, nadal ma nad nią pierwszeństwo. Żądanie
    myślenia o wartości prawdziwej nigdy nie jest wysyłane do modelu jawnie oznaczonego
    jako `reasoning: false`; żądanie `think: false` jest zawsze wysyłane niezależnie od tego ustawienia.

  </Accordion>

  <Accordion title="Modele rozumujące">
    Modele o nazwach `deepseek-r1`, `reasoning`, `reason` lub `think` są domyślnie
    traktowane jako zdolne do rozumowania — nie jest wymagana dodatkowa konfiguracja:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Koszty modeli">
    Ollama działa lokalnie i jest bezpłatna, dlatego wszystkie koszty modeli wynoszą `0` zarówno
    dla modeli wykrytych automatycznie, jak i zdefiniowanych ręcznie.
  </Accordion>

  <Accordion title="Osadzenia pamięci">
    Dołączony plugin Ollama rejestruje dostawcę osadzeń pamięci dla
    [wyszukiwania w pamięci](/pl/concepts/memory). Używa skonfigurowanego bazowego adresu URL Ollama
    i klucza API, wywołuje `/api/embed` oraz, gdy jest to możliwe, grupuje wiele fragmentów pamięci
    w jedno żądanie `input`.

    Gdy `proxy.enabled=true`, żądania osadzeń kierowane dokładnie do lokalnego względem hosta
    źródła local loopback wyprowadzonego ze skonfigurowanego `baseUrl` korzystają z chronionej
    ścieżki bezpośredniej OpenClaw zamiast zarządzanego pośredniczącego serwera proxy. Skonfigurowana
    nazwa hosta musi sama być wartością `localhost` lub literałem adresu IP pętli zwrotnej — nazwy DNS,
    które jedynie wskazują na pętlę zwrotną, nadal korzystają z zarządzanej ścieżki proxy. Hosty Ollama
    w sieci LAN, tailnecie, sieci prywatnej i sieci publicznej zawsze pozostają na
    zarządzanej ścieżce proxy, a przekierowania do innego hosta lub portu nie dziedziczą
    zaufania. `proxy.loopbackMode: "proxy"` mimo to kieruje ruch pętli zwrotnej przez
    proxy; `proxy.loopbackMode: "block"` odrzuca go przed nawiązaniem połączenia —
    zobacz [Zarządzane proxy](/pl/security/network-proxy#gateway-loopback-mode).

    | Właściwość | Wartość |
    | --- | --- |
    | Model domyślny | `nomic-embed-text` |
    | Automatyczne pobieranie | Tak, jeśli nie jest dostępny lokalnie |
    | Domyślna współbieżność bez grupowania | 1 (inni dostawcy mają wyższą wartość domyślną; zwiększ ją za pomocą `nonBatchConcurrency`, jeśli host może ją obsłużyć) |

    Osadzenia wykonywane podczas zapytania używają prefiksów wyszukiwania w przypadku modeli, które ich wymagają
    lub je zalecają: `nomic-embed-text`, `qwen3-embedding` oraz
    `mxbai-embed-large`. Partie dokumentów pozostają niezmienione, więc istniejące indeksy nie wymagają
    migracji formatu.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Domyślna wartość dla Ollama. Zwiększ ją na wydajniejszych hostach, jeśli ponowne indeksowanie jest zbyt wolne.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    W przypadku zdalnego hosta osadzeń ogranicz zakres uwierzytelniania do tego hosta:

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

  <Accordion title="Konfiguracja przesyłania strumieniowego">
    Ollama domyślnie używa **natywnego API** (`/api/chat`), które obsługuje
    jednocześnie przesyłanie strumieniowe i wywoływanie narzędzi — nie jest wymagana specjalna konfiguracja.

    W przypadku żądań natywnych sterowanie myśleniem jest przekazywane bezpośrednio: `/think off`
    i `openclaw agent --thinking off` wysyłają parametr najwyższego poziomu `think: false`, chyba że
    skonfigurowano jawną wartość `params.think`/`params.thinking`; `/think
    low|medium|high` wysyła odpowiadający ciąg poziomu intensywności; `/think max` jest mapowane na
    najwyższy poziom intensywności Ollama, `think: "high"`.

    <Tip>
    Aby zamiast tego użyć punktu końcowego zgodnego z OpenAI, zobacz sekcję „Starszy tryb zgodności z OpenAI” powyżej — przesyłanie strumieniowe i wywoływanie narzędzi mogą tam nie działać jednocześnie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pętla awarii WSL2 (powtarzające się ponowne uruchomienia)">
    W WSL2 z NVIDIA/CUDA oficjalny instalator Ollama dla systemu Linux tworzy
    jednostkę systemd `ollama.service` z ustawieniem `Restart=always`. Jeśli ta usługa
    uruchamia się automatycznie i ładuje model korzystający z GPU podczas rozruchu WSL2, Ollama może blokować
    pamięć hosta podczas ładowania; mechanizm odzyskiwania pamięci Hyper-V nie zawsze może odzyskać
    te strony, więc Windows może zakończyć maszynę wirtualną WSL2, systemd ponownie uruchamia
    Ollama i pętla się powtarza.

    Symptomy: powtarzające się ponowne uruchomienia lub zakończenia WSL2, wysokie użycie procesora przez `app.slice` albo
    `ollama.service` bezpośrednio po uruchomieniu WSL2 oraz sygnał SIGTERM od systemd, a nie
    od mechanizmu OOM systemu Linux.

    OpenClaw rejestruje ostrzeżenie podczas uruchamiania, gdy wykryje WSL2, włączoną usługę `ollama.service`
    z ustawieniem `Restart=always` oraz widoczne znaczniki CUDA.

    Sposób ograniczenia problemu:

    ```bash
    sudo systemctl disable ollama
    ```

    Po stronie Windows dodaj poniższy wpis do `%USERPROFILE%\.wslconfig`, a następnie uruchom
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Możesz też skrócić czas utrzymywania aktywności lub uruchamiać Ollama ręcznie tylko wtedy, gdy jest potrzebna:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Zobacz [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama nie została wykryta">
    Sprawdź, czy Ollama jest uruchomiona, ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania),
    a `models.providers.ollama` **nie** jest zdefiniowane jawnie:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Brak dostępnych modeli">
    Pobierz model lokalnie lub zdefiniuj go jawnie w
    `models.providers.ollama`:

    ```bash
    ollama list  # Sprawdź, co jest zainstalowane
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Lub inny model
    ```

  </Accordion>

  <Accordion title="Odrzucono połączenie">
    ```bash
    # Sprawdź, czy Ollama jest uruchomiona
    ps aux | grep ollama

    # Lub uruchom ponownie Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Zdalny host działa z curl, ale nie z OpenClaw">
    Sprawdź z tej samej maszyny i w tym samym środowisku uruchomieniowym, w którym działa Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Typowe przyczyny:

    - `baseUrl` wskazuje na `localhost`, ale Gateway działa w Dockerze lub na innym hoście.
    - Adres URL zawiera `/v1`, co wybiera zachowanie zgodne z OpenAI zamiast natywnego trybu Ollama.
    - Zdalny host wymaga zmian zapory sieciowej lub powiązania z siecią LAN.
    - Model znajduje się w demonie na laptopie, ale nie na hoście zdalnym.

  </Accordion>

  <Accordion title="Model zwraca kod JSON narzędzia jako tekst">
    Zwykle dostawca działa w trybie zgodności z OpenAI albo model nie potrafi
    obsługiwać schematów narzędzi. Preferuj tryb natywny:

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

    Jeśli mały model lokalny nadal nie radzi sobie ze schematami narzędzi, ustaw
    `compat.supportsTools: false` we wpisie tego modelu i przeprowadź test ponownie.

  </Accordion>

  <Accordion title="Kimi lub GLM zwraca zniekształcone symbole">
    Hostowane odpowiedzi Kimi/GLM składające się z długich, nielingwistycznych ciągów symboli są
    traktowane jako nieudane wywołanie dostawcy, a nie pomyślna odpowiedź, dzięki czemu
    uruchamiana jest standardowa obsługa ponowień, modeli rezerwowych lub błędów zamiast zapisywania
    uszkodzonego tekstu w sesji.

    Jeśli problem wystąpi ponownie, zapisz nazwę modelu, bieżący plik sesji oraz informację,
    czy uruchomienie używało trybu `Cloud + Local`, czy `Cloud only`, a następnie wypróbuj nową
    sesję i model rezerwowy:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Zimny model lokalny przekracza limit czasu">
    Duże modele lokalne mogą wymagać dużo czasu przy pierwszym ładowaniu. Ogranicz zakres limitu czasu do
    dostawcy Ollama i opcjonalnie pozostaw model załadowany między turami:

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

    Jeśli sam host wolno akceptuje połączenia, `timeoutSeconds` wydłuża również
    chroniony limit czasu nawiązania połączenia dla tego dostawcy.

  </Accordion>

  <Accordion title="Model z dużym kontekstem działa zbyt wolno lub wyczerpuje pamięć">
    Wiele modeli deklaruje konteksty większe, niż sprzęt jest w stanie
    komfortowo obsłużyć. Natywny tryb Ollama używa własnej wartości domyślnej środowiska uruchomieniowego, chyba że
    ustawiono `params.num_ctx`. Ogranicz zarówno budżet OpenClaw, jak i kontekst żądania
    Ollama, aby uzyskać przewidywalne opóźnienie pierwszego tokena:

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

    Zmniejsz `contextWindow`, jeśli OpenClaw wysyła zbyt długi prompt. Zmniejsz
    `params.num_ctx`, jeśli kontekst środowiska uruchomieniowego Ollama jest zbyt duży dla tej maszyny.
    Zmniejsz `maxTokens`, jeśli generowanie trwa zbyt długo.

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Często zadawane pytania](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/pl/providers/ollama-cloud" icon="cloud">
    Konfiguracja wyłącznie chmurowa z dedykowanym dostawcą `ollama-cloud`.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Omówienie wszystkich dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Jak wybierać i konfigurować modele.
  </Card>
  <Card title="Wyszukiwanie internetowe Ollama" href="/pl/tools/ollama-search" icon="magnifying-glass">
    Pełne informacje o konfiguracji i działaniu wyszukiwania internetowego obsługiwanego przez Ollama.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
