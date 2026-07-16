---
read_when:
    - Chcesz uruchomić OpenClaw z modelami chmurowymi lub lokalnymi za pośrednictwem Ollama
    - Potrzebujesz wskazówek dotyczących instalacji i konfiguracji Ollama
    - Potrzebujesz modeli wizyjnych Ollama do rozpoznawania obrazów
summary: Uruchamianie OpenClaw z Ollama (modele chmurowe i lokalne)
title: Ollama
x-i18n:
    generated_at: "2026-07-16T19:04:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw komunikuje się z natywnym API Ollama (`/api/chat`), a nie z kompatybilnym z OpenAI
punktem końcowym `/v1`. Obsługiwane są trzy tryby:

| Tryb          | Czego używa                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| Chmura + lokalnie | Osiągalny host Ollama udostępniający modele lokalne oraz (po zalogowaniu) modele `:cloud` |
| Tylko chmura    | Bezpośrednio `https://ollama.com`, bez lokalnego demona                                   |
| Tylko lokalnie    | Osiągalny host Ollama, wyłącznie modele lokalne                                       |

Informacje o konfiguracji wyłącznie chmurowej z dedykowanym identyfikatorem dostawcy `ollama-cloud` zawiera
strona [Ollama Cloud](/pl/providers/ollama-cloud). Odwołań `ollama-cloud/<model>` należy używać, gdy
routing chmurowy ma pozostać oddzielony od lokalnego dostawcy `ollama`.

<Warning>
Nie należy używać kompatybilnego z OpenAI adresu URL `/v1` (`http://host:11434/v1`). Powoduje on nieprawidłowe wywoływanie narzędzi, a modele mogą emitować nieprzetworzony kod JSON wywołania narzędzia jako zwykły tekst. Należy użyć natywnego adresu URL: `baseUrl: "http://host:11434"` (bez `/v1`).
</Warning>

Kanonicznym kluczem konfiguracji jest `baseUrl`. Klucz `baseURL` jest również akceptowany w
przykładach zgodnych ze stylem OpenAI SDK, ale w nowej konfiguracji należy używać `baseUrl`.

## Reguły uwierzytelniania

<AccordionGroup>
  <Accordion title="Hosty lokalne i w sieci LAN">
    Adresy URL Ollama wskazujące pętlę zwrotną, sieć prywatną, `.local` lub samą nazwę hosta nie wymagają prawdziwego tokenu bearer. OpenClaw używa dla nich znacznika `ollama-local`.
  </Accordion>
  <Accordion title="Hosty zdalne i Ollama Cloud">
    Publiczne hosty zdalne i `https://ollama.com` wymagają prawdziwych danych uwierzytelniających: `OLLAMA_API_KEY`, profilu uwierzytelniania lub wartości `apiKey` dostawcy. Do bezpośredniego korzystania z usługi hostowanej zalecany jest dostawca `ollama-cloud`.
  </Accordion>
  <Accordion title="Niestandardowe identyfikatory dostawców">
    Niestandardowy dostawca z `api: "ollama"` podlega tym samym regułom. Na przykład dostawca `ollama-remote` wskazujący prywatny host w sieci LAN może używać `apiKey: "ollama-local"`; subagenty rozwiązują ten znacznik za pośrednictwem haka dostawcy Ollama, zamiast traktować go jako brakujące dane uwierzytelniające. `agents.defaults.memorySearch.provider` może również wskazywać niestandardowy identyfikator dostawcy, dzięki czemu osadzenia korzystają z tego punktu końcowego Ollama.
  </Accordion>
  <Accordion title="Profile uwierzytelniania">
    `auth-profiles.json` przechowuje dane uwierzytelniające dla identyfikatora dostawcy; ustawienia punktu końcowego (`baseUrl`, `api`, modele, nagłówki i limity czasu) należy umieścić w `models.providers.<id>`. Starsze płaskie pliki, takie jak `{ "ollama-windows": { "apiKey": "ollama-local" } }`, nie są formatem środowiska uruchomieniowego; `openclaw doctor --fix` przepisuje je do kanonicznego profilu klucza API `ollama-windows:default` i tworzy kopię zapasową. Wartość `baseUrl` w takim starszym pliku jest zbędna i należy przenieść ją do konfiguracji dostawcy.
  </Accordion>
  <Accordion title="Zakres osadzania pamięci">
    Uwierzytelnianie bearer dla osadzeń pamięci Ollama jest ograniczone do hosta, dla którego zostało zadeklarowane:

    - Klucz na poziomie dostawcy jest wysyłany wyłącznie do hosta tego dostawcy.
    - `agents.*.memorySearch.remote.apiKey` jest wysyłany wyłącznie do zdalnego hosta osadzeń.
    - Sama wartość środowiskowa `OLLAMA_API_KEY` jest traktowana zgodnie z konwencją Ollama Cloud i domyślnie nie jest wysyłana do hostów lokalnych ani hostowanych samodzielnie.

  </Accordion>
</AccordionGroup>

## Pierwsze kroki

<Tabs>
  <Tab title="Konfiguracja początkowa (zalecana)">
    <Steps>
      <Step title="Uruchom konfigurację początkową">
        ```bash
        openclaw onboard
        ```

        Należy wybrać **Ollama**, a następnie tryb: **Cloud + Local**, **Cloud only** lub **Local only**.

        Podczas nowej konfiguracji z przewodnikiem OpenClaw najpierw sprawdza domyślny lub skonfigurowany
        host Ollama. Jeśli zainstalowany model deklaruje obsługę narzędzi, wspólna
        sekwencja konfiguracji CLI/macOS natychmiast go proponuje i weryfikuje za pomocą rzeczywistego
        ukończenia. To automatyczne sprawdzenie nigdy nie pobiera modelu; jeśli nie istnieje
        odpowiedni zainstalowany model, konfiguracja początkowa przechodzi do standardowego selektora Ollama.
      </Step>
      <Step title="Wybierz model">
        `Cloud only` wyświetla monit o `OLLAMA_API_KEY` i sugeruje domyślne hostowane modele chmurowe. `Cloud + Local` i `Local only` wyświetlają monit o bazowy adres URL Ollama, wykrywają dostępne modele i automatycznie pobierają wybrany model lokalny, jeśli go brakuje. Zainstalowany tag `:latest`, taki jak `gemma4:latest`, jest wyświetlany jednokrotnie zamiast powielania `gemma4`. `Cloud + Local` sprawdza również, czy host jest zalogowany w celu uzyskania dostępu do chmury.
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

    `--custom-base-url` i `--custom-model-id` są opcjonalne; ich pominięcie powoduje użycie domyślnego hosta lokalnego i sugerowanego modelu `gemma4`.

  </Tab>

  <Tab title="Konfiguracja ręczna">
    <Steps>
      <Step title="Zainstaluj i uruchom Ollama">
        Instalator można pobrać ze strony [ollama.com/download](https://ollama.com/download), a następnie pobrać model:

        ```bash
        ollama pull gemma4
        ```

        Aby uzyskać hybrydowy dostęp do chmury, należy uruchomić `ollama signin` na tym samym hoście.
      </Step>
      <Step title="Ustaw dane uwierzytelniające">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # host lokalny/LAN, działa dowolna wartość
        export OLLAMA_API_KEY="your-real-key"   # tylko https://ollama.com
        ```

        Lub w konfiguracji: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Wybierz model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Lub w konfiguracji:

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

`Cloud + Local` kieruje zarówno modele lokalne, jak i modele `:cloud` przez jeden osiągalny
host Ollama — jest to hybrydowy przepływ Ollama i tryb, który należy wybrać podczas konfiguracji,
gdy potrzebne są oba rodzaje modeli.

OpenClaw wyświetla monit o bazowy adres URL, wykrywa modele lokalne i sprawdza
stan `ollama signin`. Po zalogowaniu sugeruje domyślne modele hostowane
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). W przypadku
braku zalogowania konfiguracja pozostaje wyłącznie lokalna do czasu uruchomienia `ollama signin`.

Aby korzystać wyłącznie z chmury bez lokalnego demona, należy użyć `openclaw onboard --auth-choice ollama-cloud` i zapoznać się ze stroną [Ollama Cloud](/pl/providers/ollama-cloud) — ta ścieżka nie wymaga `ollama signin` ani działającego serwera:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Lista modeli chmurowych wyświetlana podczas `openclaw onboard` jest uzupełniana na żywo z
`https://ollama.com/api/tags` i ograniczona do 500 pozycji, dzięki czemu selektor odzwierciedla
aktualny katalog modeli hostowanych. Jeśli `ollama.com` jest nieosiągalny lub podczas konfiguracji nie zwraca
żadnych modeli, OpenClaw używa awaryjnie zakodowanej na stałe listy sugerowanych modeli, aby
konfiguracja początkowa mogła zostać ukończona.

## Wykrywanie modeli (dostawca niejawny)

Gdy ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania), a nie zdefiniowano ani
`models.providers.ollama`, ani innego niestandardowego dostawcy z `api: "ollama"`,
OpenClaw wykrywa modele z `http://127.0.0.1:11434`:

| Zachowanie             | Szczegóły                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zapytanie do katalogu        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| Wykrywanie możliwości | Wykonywane w miarę możliwości odczyty `/api/show` pobierają `contextWindow`, parametry pliku Modelfile `num_ctx` oraz możliwości (obrazy/narzędzia/rozumowanie)                                                                                                                                                                       |
| Modele obsługujące obrazy        | Możliwość `vision` z `/api/show` oznacza model jako obsługujący obrazy (`input: ["text", "image"]`)                                                                                                                                                                                             |
| Wykrywanie rozumowania  | Używa możliwości `thinking` z `/api/show`, gdy jest dostępna; jeśli Ollama pomija możliwości, stosuje heurystykę nazwy (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` i `deepseek-v4-flash\|pro:cloud` są zawsze traktowane jako modele rozumujące niezależnie od zadeklarowanych możliwości. |
| Limity tokenów         | `maxTokens` domyślnie przyjmuje maksymalny limit tokenów Ollama w OpenClaw                                                                                                                                                                                                                                       |
| Koszty                | Wszystkie koszty wynoszą `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

Ustawienie `models.providers.ollama` z jawną tablicą `models` lub
niestandardowego dostawcy z `api: "ollama"` i adresem `baseUrl`, który nie wskazuje pętli zwrotnej, wyłącza
automatyczne wykrywanie; modele trzeba wówczas zdefiniować ręcznie (zobacz
[Konfiguracja](#configuration)). Wpis `models.providers.ollama` wskazujący hostowany
`https://ollama.com` również pomija wykrywanie, ponieważ modelami Ollama Cloud
zarządza dostawca. Niestandardowi dostawcy wskazujący pętlę zwrotną, tacy jak
`http://127.0.0.2:11434`, nadal są uznawani za lokalnych i zachowują automatyczne wykrywanie.

Można użyć pełnego odwołania, takiego jak `ollama/<pulled-model>:latest`, bez
ręcznie utworzonego wpisu `models.json`; OpenClaw rozwiązuje je na żywo. W przypadku zalogowanych
hostów wybranie niewymienionego odwołania `ollama/<model>:cloud` powoduje zweryfikowanie dokładnie tego
modelu za pomocą `/api/show` i dodanie go do katalogu środowiska uruchomieniowego tylko wtedy, gdy Ollama
potwierdzi metadane — literówki nadal powodują błąd nieznanego modelu.

### Testy dymne

Do wąskiego testu tekstowego, który pomija pełny zestaw narzędzi agenta:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Odpowiedz dokładnie: pong" \
    --json
```

Aby przeprowadzić lekki test modelu obsługującego obrazy, należy dodać `--file` z obrazem (akceptowane formaty to PNG/JPEG/WebP;
pliki niebędące obrazami są odrzucane przed wywołaniem Ollama — dla dźwięku należy użyć
`openclaw infer audio transcribe`):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Opisz ten obraz w jednym zdaniu." \
    --file ./photo.jpg \
    --json
```

Żadna z tych ścieżek nie ładuje narzędzi czatu, pamięci ani kontekstu sesji. Jeśli test kończy się powodzeniem,
a zwykłe odpowiedzi agenta zawodzą, problem prawdopodobnie dotyczy możliwości modelu w zakresie narzędzi lub agenta,
a nie punktu końcowego.

Wybranie modelu za pomocą `/model ollama/<model>` jest dokładnym wyborem użytkownika: jeśli
skonfigurowany `baseUrl` jest nieosiągalny, następna odpowiedź kończy się błędem dostawcy,
zamiast niejawnie przełączyć się na inny skonfigurowany model.

Izolowane zadania cron przed rozpoczęciem tury agenta wykonują dodatkową lokalną kontrolę bezpieczeństwa:
jeśli wybrany model wskazuje dostawcę Ollama działającego lokalnie, w sieci prywatnej lub pod adresem `.local`, a `/api/tags` jest nieosiągalny, OpenClaw rejestruje to uruchomienie jako
`skipped`, umieszczając model w treści błędu. Wynik tej kontroli punktu końcowego jest buforowany przez
5 minut dla każdego hosta, dzięki czemu powtarzające się zadania cron kierowane do zatrzymanego demona nie uruchamiają wszystkich żądań kończących się niepowodzeniem.

Weryfikacja na żywo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

W przypadku Ollama Cloud skieruj ten sam test na hostowany punkt końcowy (domyślnie pomija
osadzenia; wymuś je za pomocą `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, ponieważ
klucz chmurowy może nie autoryzować `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Aby dodać model, pobierz go, a zostanie automatycznie wykryty:

```bash
ollama pull mistral
```

## Wnioskowanie lokalne na Node

Agenci mogą delegować krótkie zadanie do modelu Ollama na sparowanym komputerze stacjonarnym lub
serwerowym Node. Monit i odpowiedź przechodzą przez istniejące uwierzytelnione
połączenie Gateway/Node; żądanie jest wykonywane przez punkt końcowy Ollama w interfejsie loopback
danego Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Uruchom Ollama na Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Połącz host Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Zatwierdź urządzenie i jego polecenia Node na hoście Gateway, a następnie zweryfikuj:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Pierwsze połączenie lub aktualizacja dodająca polecenia Ollama może wywołać
    zatwierdzanie poleceń Node. Jeśli Node łączy się bez ogłaszania
    `ollama.models` i `ollama.chat`, ponownie sprawdź `openclaw nodes pending`.

  </Step>
  <Step title="Użyj go z poziomu agenta">
    Dołączony plugin Ollama udostępnia narzędzie `node_inference`. Agenci najpierw wywołują
    `action: "discover"`, a następnie `action: "run"` z Node i modelem z
    uzyskanego wyniku (`run` może pominąć Node, gdy połączony jest
    dokładnie jeden Node o odpowiednich możliwościach). Na przykład: „Wykryj modele Ollama na moich Node, a następnie użyj
    najszybszego załadowanego modelu do podsumowania tego tekstu”.
  </Step>
</Steps>

Wykrywanie odczytuje `/api/tags`, sprawdza możliwości `/api/show` i używa
`/api/ps`, gdy jest dostępne, aby przy ustalaniu kolejności preferować już załadowane modele. Zwraca wyłącznie
lokalne modele zgłaszane przez Ollama jako obsługujące czat (możliwość `completion`) —
wiersze Ollama Cloud oraz modele przeznaczone wyłącznie do osadzeń są wykluczane. Każde uruchomienie wyłącza
myślenie modelu i domyślnie ogranicza wynik do 512 tokenów (twardy limit 8192), chyba że
wywołanie narzędzia zażąda innej wartości `maxTokens`; niektóre modele (na przykład GPT-OSS)
nie obsługują wyłączania myślenia i nadal mogą generować tokeny rozumowania.

Aby Ollama nadal działała na Node bez udostępniania jej agentom:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Uruchom ponownie Node (`openclaw node restart` albo zatrzymaj i ponownie uruchom `openclaw node run`
w przypadku sesji pierwszoplanowej). Node przestanie ogłaszać `ollama.models` i
`ollama.chat`; sama Ollama i dostawca Ollama w Gateway pozostaną bez zmian.
Ustaw wartość z powrotem na `true` i uruchom ponownie, aby ponownie włączyć tę funkcję; zmieniony zestaw poleceń
może po ponownym połączeniu wymagać kolejnego zatwierdzenia `openclaw nodes pending`.

Zweryfikuj polecenia Node bezpośrednio, bez tury agenta:

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

`--invoke-timeout` ogranicza czas, przez jaki Node może wykonywać polecenie;
`--timeout` ogranicza całkowity czas wywołania Gateway i powinien być większy.

Wnioskowanie lokalne na Node zawsze korzysta z punktu końcowego w interfejsie loopback tego Node — nie
używa ponownie skonfigurowanego zdalnego lub chmurowego `models.providers.ollama.baseUrl`. Polecenia
Node są domyślnie dostępne na hostach Node z systemami macOS, Linux i Windows
i nadal podlegają standardowym zasadom parowania Node i wykonywania poleceń.

## Widzenie i opisywanie obrazów

Dołączony plugin Ollama rejestruje Ollama jako dostawcę rozumienia multimediów
obsługującego obrazy, dzięki czemu OpenClaw może kierować jawne żądania opisu obrazów
oraz skonfigurowane domyślne modele obrazów do lokalnych lub hostowanych modeli wizyjnych
Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` musi być pełnym odwołaniem `<provider/model>`; gdy jest ustawione, `infer image
describe` najpierw próbuje użyć tego modelu, zamiast pomijać opis w przypadku modeli,
które już obsługują natywne widzenie. Jeśli wywołanie się nie powiedzie, OpenClaw może kontynuować
za pomocą `agents.defaults.imageModel.fallbacks`; błędy przygotowania pliku lub adresu URL
powodują niepowodzenie przed podjęciem próby użycia rozwiązania rezerwowego. Użyj `infer image describe` dla przepływu
rozumienia obrazów OpenClaw i skonfigurowanego `imageModel`; użyj `infer model run
--file` do wykonania surowego testu multimodalnego z niestandardowym monitem.

Aby ustawić Ollama jako domyślnego dostawcę rozumienia obrazów dla przychodzących multimediów:

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

Preferuj pełne odwołanie `ollama/<model>`. Odwołanie `imageModel` bez prefiksu, takie jak
`qwen2.5vl:7b`, jest normalizowane do `ollama/qwen2.5vl:7b` tylko wtedy, gdy dokładnie ten model
jest wymieniony w `models.providers.ollama.models` z
`input: ["text", "image"]` i żaden inny skonfigurowany dostawca obrazów nie udostępnia
tego samego identyfikatora bez prefiksu; w przeciwnym razie jawnie użyj prefiksu dostawcy.

Powolne lokalne modele wizyjne mogą wymagać dłuższego limitu czasu rozumienia obrazów niż
modele chmurowe i mogą ulec awarii na sprzęcie o ograniczonych zasobach, jeśli Ollama spróbuje
przydzielić pełny deklarowany kontekst wizyjny modelu. Ustaw limit czasu możliwości
i ogranicz `num_ctx`:

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

Ten limit czasu dotyczy rozumienia przychodzących obrazów oraz jawnego
narzędzia `image`. `models.providers.ollama.timeoutSeconds` nadal kontroluje
bazowe zabezpieczenie limitu czasu żądania HTTP Ollama dla zwykłych wywołań modelu.

Weryfikacja na żywo:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Jeśli ręcznie definiujesz `models.providers.ollama.models`, jawnie oznacz modele
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

OpenClaw odrzuca żądania opisu obrazów kierowane do modeli, które nie są oznaczone
jako obsługujące obrazy. Przy niejawnym wykrywaniu informacja ta pochodzi z możliwości wizyjnej
`/api/show`.

## Konfiguracja

<Tabs>
  <Tab title="Podstawowa (niejawne wykrywanie)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Jeśli ustawiono `OLLAMA_API_KEY`, można pominąć `apiKey` we wpisie dostawcy; OpenClaw uzupełni je na potrzeby kontroli dostępności.
    </Tip>

  </Tab>

  <Tab title="Jawna (modele ręczne)">
    Użyj jawnej konfiguracji w przypadku hostowanej konfiguracji chmurowej, niestandardowego hosta lub portu, wymuszonych
    okien kontekstu albo całkowicie ręcznych list modeli:

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

  <Tab title="Niestandardowy bazowy adres URL">
    Jawna konfiguracja wyłącza automatyczne wykrywanie, dlatego modele muszą być wymienione:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Bez /v1 — natywny adres URL API Ollama
            api: "ollama", // Jawne ustawienie: gwarantuje natywne wywoływanie narzędzi
            timeoutSeconds: 300, // Opcjonalne: dłuższy budżet połączenia i strumieniowania dla zimnych modeli lokalnych
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Opcjonalne: pozostaw model załadowany między turami
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Nie dodawaj `/v1`. Ta ścieżka wybiera tryb zgodności z OpenAI, w którym wywoływanie narzędzi nie jest niezawodne.
    </Warning>

  </Tab>
</Tabs>

## Typowe przepisy

Zastąp identyfikatory modeli dokładnymi nazwami z `ollama list` lub
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Model lokalny z automatycznym wykrywaniem">
    Ollama na tej samej maszynie co Gateway, wykrywana automatycznie:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Nie dodawaj bloku `models.providers.ollama`, chyba że potrzebne są modele ręczne.

  </Accordion>

  <Accordion title="Host Ollama w sieci LAN z modelami ręcznymi">
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

    `contextWindow` określa budżet kontekstu OpenClaw; `params.num_ctx` jest wysyłane do
    Ollama. Zachowaj ich zgodność, jeśli sprzęt nie jest w stanie obsłużyć pełnego
    deklarowanego kontekstu modelu.

  </Accordion>

  <Accordion title="Tylko Ollama Cloud">
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

    Dla dedykowanego identyfikatora dostawcy `ollama-cloud` zamiast tej struktury zobacz
    [Ollama Cloud](/pl/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Chmura i środowisko lokalne przez zalogowanego demona">
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
    Niestandardowe identyfikatory dostawców podczas uruchamiania więcej niż jednego serwera Ollama; każdy otrzymuje
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
    dociera do Ollama jako `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Odchudzony profil modelu lokalnego">
    Niektóre modele lokalne radzą sobie z prostymi poleceniami, ale mają problemy z pełnym
    zestawem narzędzi agenta. Przed zmianą globalnych ustawień środowiska uruchomieniowego
    ogranicz narzędzia i kontekst:

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
    zawodzi na schematach narzędzi — odbywa się to kosztem możliwości agenta na rzecz stabilności.
    `localModelLean` usuwa rozbudowane narzędzia przeglądarki, cron, wiadomości, generowania multimediów,
    głosu i plików PDF z bezpośredniego zestawu narzędzi agenta, chyba że są jawnie wymagane,
    oraz umieszcza większe katalogi za Tool Search. Nie zmienia kontekstu
    środowiska uruchomieniowego Ollama ani trybu myślenia. Połącz tę opcję z `params.num_ctx` i
    `params.thinking: false` w przypadku małych modeli myślących w stylu Qwen, które wpadają w pętle lub
    zużywają swój budżet na ukryte rozumowanie.

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

Niestandardowe identyfikatory dostawców działają tak samo: w przypadku odwołania używającego prefiksu aktywnego dostawcy,
takiego jak `ollama-spark/qwen3:32b`, OpenClaw usuwa ten prefiks przed
wywołaniem Ollama i wysyła `qwen3:32b`.

W przypadku wolnych modeli lokalnych preferuj dostrajanie na poziomie dostawcy, zanim zwiększysz limit czasu
całego środowiska uruchomieniowego agenta:

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
strumieniowanie treści i całkowite przerwanie chronionego pobierania. `params.keep_alive` jest
przekazywane jako `keep_alive` najwyższego poziomu w natywnych żądaniach `/api/chat`; ustawiaj je osobno dla
modelu, gdy wąskim gardłem jest czas ładowania przy pierwszym wywołaniu.

### Szybka weryfikacja

```bash
# Demon Ollama widoczny dla tego komputera
curl http://127.0.0.1:11434/api/tags

# Katalog OpenClaw i wybrany model
openclaw models list --provider ollama
openclaw models status

# Bezpośredni test kontrolny modelu
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Odpowiedz dokładnie: ok"
```

W przypadku hostów zdalnych zastąp `127.0.0.1` hostem `baseUrl`. Jeśli `curl`
działa, ale OpenClaw nie, sprawdź, czy Gateway działa na innym
komputerze, w kontenerze lub na innym koncie usługi.

## Ollama Web Search

OpenClaw zawiera **Ollama Web Search** jako dostawcę `web_search`.

| Właściwość  | Szczegóły                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host        | `models.providers.ollama.baseUrl`, gdy ustawiono, w przeciwnym razie `http://127.0.0.1:11434`; `https://ollama.com` korzysta bezpośrednio z hostowanego API                          |
| Uwierzytelnianie | Bez klucza w przypadku zalogowanego hosta lokalnego; `OLLAMA_API_KEY` lub skonfigurowane uwierzytelnianie dostawcy w przypadku bezpośredniego wyszukiwania `https://ollama.com` albo hostów chronionych uwierzytelnianiem |
| Wymaganie   | Hosty lokalne/samodzielnie hostowane muszą działać i być zalogowane za pomocą `ollama signin`; bezpośrednie wyszukiwanie hostowane wymaga `baseUrl: "https://ollama.com"` oraz prawdziwego klucza API |

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

W przypadku hosta samodzielnie hostowanego OpenClaw najpierw próbuje użyć lokalnego serwera proxy `/api/experimental/web_search`,
a następnie ścieżki hostowanej `/api/web_search` na tym samym hoście; zalogowany
demon lokalny zwykle odpowiada przez lokalny serwer proxy. Bezpośrednie
wywołania `https://ollama.com` zawsze używają hostowanego punktu końcowego `/api/web_search`.

<Note>
Pełną konfigurację i opis działania zawiera strona [Ollama Web Search](/pl/tools/ollama-search).
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Starszy tryb zgodny z OpenAI">
    <Warning>
    **Wywoływanie narzędzi nie jest niezawodne w tym trybie.** Używaj go tylko wtedy, gdy serwer proxy wymaga formatu OpenAI, a natywne wywoływanie narzędzi nie jest potrzebne.
    </Warning>

    Ustaw `api: "openai-completions"` jawnie dla serwera proxy działającego za
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // wartość domyślna: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Ten tryb może nie obsługiwać jednocześnie strumieniowania i wywoływania narzędzi;
    może być konieczne ustawienie `params: { streaming: false }` dla modelu.

    OpenClaw domyślnie wstrzykuje `options.num_ctx` w tym trybie, aby Ollama
    nie przełączała się po cichu na kontekst 4096 tokenów. Jeśli serwer proxy odrzuca
    nieznane pola `options`, wyłącz tę opcję:

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
    W przypadku modeli wykrytych automatycznie OpenClaw używa okna kontekstu zgłaszanego przez `/api/show`,
    w tym większych wartości `PARAMETER num_ctx` z niestandardowych
    plików Modelfile; w przeciwnym razie używa domyślnego okna kontekstu Ollama
    skonfigurowanego w OpenClaw.

    Ustawienia `contextWindow`, `contextTokens` i `maxTokens` na poziomie dostawcy określają
    wartości domyślne dla każdego modelu tego dostawcy i można je zastąpić osobno dla
    modelu. `contextWindow` jest własnym budżetem poleceń/Compaction OpenClaw. Natywne
    żądania `/api/chat` pozostawiają `options.num_ctx` bez wartości, chyba że
    `params.num_ctx` zostanie ustawione jawnie, dzięki czemu Ollama stosuje własną wartość domyślną
    modelu, `OLLAMA_CONTEXT_LENGTH` lub opartą na pamięci VRAM; nieprawidłowe, zerowe, ujemne
    lub nieskończone wartości `params.num_ctx` są ignorowane. Jeśli starsza konfiguracja używała
    tylko `contextWindow`/`maxTokens` do wymuszania kontekstu natywnego żądania, uruchom
    `openclaw doctor --fix`, aby skopiować je do `params.num_ctx`. Adapter
    zgodny z OpenAI nadal domyślnie wstrzykuje `options.num_ctx` na podstawie
    skonfigurowanego `params.num_ctx` lub `contextWindow`; wyłącz tę funkcję za pomocą
    `injectNumCtxForOpenAICompat: false`, jeśli system nadrzędny odrzuca `options`.

    Natywne wpisy modeli akceptują również typowe opcje środowiska uruchomieniowego Ollama w
    `params`, przekazywane jako natywne `/api/chat` `options`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` i `num_thread`.
    Kilka kluczy (`format`, `keep_alive`, `truncate`, `shift`) jest przekazywanych jako
    pola żądania najwyższego poziomu zamiast zagnieżdżonego `options`. OpenClaw przekazuje tylko
    te klucze żądań Ollama, dlatego parametry dotyczące wyłącznie środowiska uruchomieniowego, takie jak
    `streaming`, nigdy nie są wysyłane do Ollama. Użyj `params.think` (lub
    `params.thinking`), aby ustawić `think` najwyższego poziomu; `false` wyłącza
    myślenie na poziomie API w modelach myślących w stylu Qwen.

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

    Ustawienie `agents.defaults.models["ollama/<model>"].params.num_ctx` osobno dla modelu również
    działa; jawny wpis modelu dostawcy ma pierwszeństwo, jeśli ustawiono oba.

  </Accordion>

  <Accordion title="Sterowanie myśleniem">
    OpenClaw przekazuje ustawienie myślenia w sposób oczekiwany przez Ollama: jako `think` najwyższego poziomu, a nie
    `options.think`. Automatycznie wykryte modele, dla których `/api/show` zgłasza
    możliwość `thinking`, udostępniają `/think low`, `/think medium`, `/think high`
    i `/think max`; modele bez myślenia udostępniają tylko `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Lub ustaw domyślny model:

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

    Ustawienia `params.think`/`params.thinking` dla poszczególnych modeli mogą wyłączyć lub wymusić
    myślenie API dla konkretnego modelu. OpenClaw zachowuje tę jawną konfigurację,
    gdy aktywne uruchomienie ma tylko niejawne ustawienie domyślne `off`; polecenie środowiska
    wykonawczego inne niż wyłączające, takie jak `/think medium`, nadal ją zastępuje. Żądanie
    myślenia o wartości logicznej prawda nigdy nie jest wysyłane do modelu jawnie oznaczonego
    jako `reasoning: false`; żądanie `think: false` jest zawsze wysyłane niezależnie od tego.

  </Accordion>

  <Accordion title="Modele rozumujące">
    Modele o nazwach `deepseek-r1`, `reasoning`, `reason` lub `think` są domyślnie
    traktowane jako obsługujące rozumowanie — dodatkowa konfiguracja nie jest potrzebna:

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
    [wyszukiwania w pamięci](/pl/concepts/memory). Używa skonfigurowanego bazowego adresu URL
    i klucza API Ollama, wywołuje `/api/embed` oraz, gdy jest to możliwe, grupuje wiele fragmentów pamięci
    w jednym żądaniu `input`.

    Gdy ustawiono `proxy.enabled=true`, żądania osadzeń kierowane dokładnie do lokalnego
    źródła pętli zwrotnej hosta, wyprowadzonego ze skonfigurowanej wartości `baseUrl`, używają chronionej
    ścieżki bezpośredniej OpenClaw zamiast zarządzanego serwera proxy przekazującego. Skonfigurowana
    nazwa hosta musi sama być wartością `localhost` lub literałem adresu IP pętli zwrotnej — nazwy DNS,
    które jedynie są rozwiązywane na adres pętli zwrotnej, nadal używają zarządzanej ścieżki proxy. Hosty Ollama
    w sieci LAN, tailnet, sieci prywatnej i publicznej zawsze pozostają na
    zarządzanej ścieżce proxy, a przekierowania do innego hosta lub portu nie dziedziczą
    zaufania. `proxy.loopbackMode: "proxy"` mimo to kieruje ruch pętli zwrotnej przez
    proxy; `proxy.loopbackMode: "block"` odrzuca go przed nawiązaniem połączenia —
    zobacz [Zarządzany serwer proxy](/pl/security/network-proxy#gateway-loopback-mode).

    | Właściwość | Wartość |
    | --- | --- |
    | Model domyślny | `nomic-embed-text` |
    | Automatyczne pobieranie | Tak, jeśli model nie jest dostępny lokalnie |
    | Domyślna współbieżność bezpośrednia | 1 (inni dostawcy mają wyższą wartość domyślną; zwiększ za pomocą `nonBatchConcurrency`, jeśli host może ją obsłużyć) |

    Osadzenia wykonywane podczas zapytania używają prefiksów wyszukiwania w przypadku modeli, które ich wymagają lub
    je zalecają: `nomic-embed-text`, `qwen3-embedding` oraz
    `mxbai-embed-large`. Partie dokumentów pozostają niezmienione, więc istniejące indeksy nie wymagają
    migracji formatu.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Wartość domyślna dla Ollama. Zwiększ na większych hostach, jeśli ponowne indeksowanie jest zbyt wolne.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    W przypadku zdalnego hosta osadzeń ogranicz uwierzytelnianie do tego hosta:

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
    Ollama domyślnie używa **natywnego API** (`/api/chat`), które jednocześnie obsługuje
    strumieniowanie i wywoływanie narzędzi — specjalna konfiguracja nie jest potrzebna.

    W żądaniach natywnych sterowanie myśleniem jest przekazywane bezpośrednio: `/think off`
    i `openclaw agent --thinking off` wysyłają wartość najwyższego poziomu `think: false`, chyba że
    skonfigurowano jawne `params.think`/`params.thinking`; `/think
    low|medium|high` wysyłają odpowiadający im ciąg poziomu wysiłku; `/think max` jest mapowane na
    najwyższy poziom wysiłku Ollama, `think: "high"`.

    <Tip>
    Aby zamiast tego użyć punktu końcowego zgodnego z OpenAI, zobacz powyżej „Starszy tryb zgodny z OpenAI” — strumieniowanie i wywoływanie narzędzi mogą tam nie działać jednocześnie.
    </Tip>

  </Accordion>
</AccordionGroup>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Pętla awarii WSL2 (wielokrotne ponowne uruchomienia)">
    W systemie WSL2 z NVIDIA/CUDA oficjalny instalator Ollama dla systemu Linux tworzy
    jednostkę systemd `ollama.service` z ustawieniem `Restart=always`. Jeśli ta usługa
    uruchamia się automatycznie i ładuje model korzystający z GPU podczas uruchamiania WSL2, Ollama może zablokować
    pamięć hosta podczas ładowania; mechanizm odzyskiwania pamięci Hyper-V nie zawsze może odzyskać
    te strony, więc Windows może zakończyć maszynę wirtualną WSL2, systemd ponownie uruchomi
    Ollama, a pętla się powtórzy.

    Symptomy: wielokrotne ponowne uruchomienia lub zakończenia WSL2, wysokie użycie CPU przez `app.slice` albo
    `ollama.service` bezpośrednio po uruchomieniu WSL2 oraz sygnał SIGTERM od systemd, a nie
    od mechanizmu Linux OOM killer.

    OpenClaw rejestruje ostrzeżenie podczas uruchamiania, gdy wykryje WSL2, włączone `ollama.service`
    z ustawieniem `Restart=always` oraz widoczne znaczniki CUDA.

    Obejście:

    ```bash
    sudo systemctl disable ollama
    ```

    Po stronie Windows dodaj poniższe ustawienie do `%USERPROFILE%\.wslconfig`, a następnie uruchom
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Można też skrócić czas utrzymywania aktywności lub uruchamiać Ollama ręcznie tylko w razie potrzeby:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    Zobacz [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama nie została wykryta">
    Upewnij się, że Ollama działa, ustawiono `OLLAMA_API_KEY` (lub profil uwierzytelniania),
    a `models.providers.ollama` **nie** zdefiniowano jawnie:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Brak dostępnych modeli">
    Pobierz model lokalnie lub zdefiniuj go jawnie w
    `models.providers.ollama`:

    ```bash
    ollama list  # Zobacz, co jest zainstalowane
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Lub inny model
    ```

  </Accordion>

  <Accordion title="Odrzucono połączenie">
    ```bash
    # Sprawdź, czy Ollama działa
    ps aux | grep ollama

    # Lub uruchom ponownie Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Zdalny host działa z curl, ale nie z OpenClaw">
    Sprawdź na tej samej maszynie i w tym samym środowisku wykonawczym, w którym działa Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Typowe przyczyny:

    - `baseUrl` wskazuje na `localhost`, ale Gateway działa w Dockerze lub na innym hoście.
    - Adres URL używa `/v1`, wybierając zachowanie zgodne z OpenAI zamiast natywnego zachowania Ollama.
    - Zdalny host wymaga zmian zapory lub powiązania z siecią LAN.
    - Model znajduje się w demonie na laptopie, ale nie w zdalnym demonie.

  </Accordion>

  <Accordion title="Model zwraca kod JSON narzędzia jako tekst">
    Zwykle dostawca działa w trybie zgodnym z OpenAI albo model nie potrafi
    obsługiwać schematów narzędzi. Preferowany jest tryb natywny:

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

    Jeśli mały model lokalny nadal nie obsługuje schematów narzędzi, ustaw
    `compat.supportsTools: false` we wpisie tego modelu i przeprowadź test ponownie.

  </Accordion>

  <Accordion title="Kimi lub GLM zwraca zniekształcone symbole">
    Hostowane odpowiedzi Kimi/GLM będące długimi ciągami symboli bez znaczenia językowego są
    traktowane jako nieudane wywołanie dostawcy, a nie pomyślna odpowiedź, dzięki czemu
    zamiast utrwalenia uszkodzonego tekstu w sesji uruchamiana jest standardowa obsługa
    ponawiania prób, przełączania awaryjnego lub błędów.

    Jeśli problem się powtórzy, zapisz nazwę modelu, bieżący plik sesji i informację,
    czy uruchomienie używało `Cloud + Local`, czy `Cloud only`, a następnie wypróbuj nową
    sesję i model zapasowy:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Odpowiedz dokładnie: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Zimny model lokalny przekracza limit czasu">
    Duże modele lokalne mogą wymagać długiego czasu pierwszego ładowania. Ogranicz zakres limitu czasu do
    dostawcy Ollama i opcjonalnie pozostaw model załadowany pomiędzy turami:

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

    Jeśli sam host wolno akceptuje połączenia, `timeoutSeconds` również
    wydłuża chroniony limit czasu nawiązywania połączenia dla tego dostawcy.

  </Accordion>

  <Accordion title="Model o dużym kontekście działa zbyt wolno lub brakuje mu pamięci">
    Wiele modeli deklaruje konteksty większe, niż sprzęt jest w stanie
    komfortowo obsłużyć. Natywna Ollama używa własnej wartości domyślnej środowiska wykonawczego, chyba że
    ustawiono `params.num_ctx`. Ogranicz zarówno budżet OpenClaw, jak i kontekst żądania Ollama,
    aby uzyskać przewidywalne opóźnienie pierwszego tokenu:

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
    `params.num_ctx`, jeśli kontekst środowiska wykonawczego Ollama jest zbyt duży dla tej maszyny.
    Zmniejsz `maxTokens`, jeśli generowanie trwa zbyt długo.

  </Accordion>
</AccordionGroup>

<Note>
Więcej pomocy: [Rozwiązywanie problemów](/pl/help/troubleshooting) i [Często zadawane pytania](/pl/help/faq).
</Note>

## Powiązane

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/pl/providers/ollama-cloud" icon="cloud">
    Konfiguracja wyłącznie w chmurze z dedykowanym dostawcą `ollama-cloud`.
  </Card>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Przegląd wszystkich dostawców, odwołań do modeli i działania przełączania awaryjnego.
  </Card>
  <Card title="Wybór modelu" href="/pl/concepts/models" icon="brain">
    Sposób wyboru i konfigurowania modeli.
  </Card>
  <Card title="Wyszukiwanie internetowe Ollama" href="/pl/tools/ollama-search" icon="magnifying-glass">
    Pełne informacje o konfiguracji i działaniu wyszukiwania internetowego obsługiwanego przez Ollama.
  </Card>
  <Card title="Konfiguracja" href="/pl/gateway/configuration" icon="gear">
    Pełna dokumentacja konfiguracji.
  </Card>
</CardGroup>
