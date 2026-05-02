---
read_when:
    - Chcesz korzystać z modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania za pomocą subskrypcji Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agenta GPT-5
summary: Używaj OpenAI w OpenClaw za pomocą kluczy API lub subskrypcji Codex
title: OpenAI
x-i18n:
    generated_at: "2026-05-02T10:01:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0caf43895c1bc8494b1a0d4aeef98e575bb31aca047430a63156875bed3bb112
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia API deweloperskie dla modeli GPT, a Codex jest też dostępny jako
agent programistyczny w ramach planu ChatGPT za pośrednictwem klientów Codex od OpenAI. OpenClaw utrzymuje te
powierzchnie oddzielnie, aby konfiguracja pozostawała przewidywalna.

OpenClaw obsługuje trzy trasy z rodziny OpenAI. Większość subskrybentów ChatGPT/Codex,
którzy chcą działania Codex, powinna używać natywnego środowiska uruchomieniowego serwera aplikacji Codex.
Prefiks modelu wybiera nazwę dostawcy/modelu; osobne ustawienie środowiska uruchomieniowego wybiera,
kto wykonuje osadzoną pętlę agenta:

- **Klucz API** - bezpośredni dostęp do OpenAI Platform z rozliczeniem według użycia (modele `openai/*`)
- **Subskrypcja Codex z natywnym środowiskiem uruchomieniowym Codex** - logowanie ChatGPT/Codex plus wykonywanie przez serwer aplikacji Codex (modele `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)
- **Subskrypcja Codex przez PI** - logowanie ChatGPT/Codex z normalnym runnerem OpenClaw PI (modele `openai-codex/*`)

OpenAI jawnie obsługuje użycie OAuth subskrypcji w zewnętrznych narzędziach i przepływach pracy, takich jak OpenClaw.

Dostawca, model, środowisko uruchomieniowe i kanał to osobne warstwy. Jeśli te etykiety są
ze sobą mylone, przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) przed
zmianą konfiguracji.

## Szybki wybór

| Cel                                                  | Użyj                                             | Uwagi                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Zalecana konfiguracja Codex dla większości użytkowników. Zaloguj się uwierzytelnianiem `openai-codex`. |
| Bezpośrednie rozliczanie kluczem API                 | `openai/gpt-5.5`                                 | Ustaw `OPENAI_API_KEY` albo uruchom wdrożenie klucza API OpenAI.                    |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez PI  | `openai-codex/gpt-5.5`                           | Używaj tylko wtedy, gdy celowo chcesz normalnego runnera PI.                |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                             | Działa z `OPENAI_API_KEY` albo OpenAI Codex OAuth.                 |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                           | Użyj `outputFormat=png` albo `webp` oraz `openai.background=transparent`.     |

## Mapa nazw

Nazwy są podobne, ale nie są wymienne:

| Nazwa, którą widzisz               | Warstwa           | Znaczenie                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefiks dostawcy  | Bezpośrednia trasa API OpenAI Platform.                                                                 |
| `openai-codex`                     | Prefiks dostawcy  | Trasa OpenAI Codex OAuth/subskrypcji przez normalnego runnera OpenClaw PI.                      |
| Plugin `codex`                     | Plugin            | Dołączony Plugin OpenClaw, który zapewnia natywne środowisko uruchomieniowe serwera aplikacji Codex i kontrolki czatu `/codex`. |
| `agentRuntime.id: codex`           | Środowisko uruchomieniowe agenta | Wymusza natywny mechanizm serwera aplikacji Codex dla osadzonych tur.                                     |
| `/codex ...`                       | Zestaw poleceń czatu | Powiąż/kontroluj wątki serwera aplikacji Codex z rozmowy.                                        |
| `runtime: "acp", agentId: "codex"` | Trasa sesji ACP   | Jawna ścieżka awaryjna, która uruchamia Codex przez ACP/acpx.                                          |

Oznacza to, że konfiguracja może celowo zawierać zarówno `openai-codex/*`, jak i
Plugin `codex`. Jest to prawidłowe, gdy chcesz Codex OAuth przez PI i jednocześnie chcesz mieć
dostępne natywne kontrolki czatu `/codex`. `openclaw doctor` ostrzega o takiej
kombinacji, aby można było potwierdzić, że jest celowa; nie przepisuje jej.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API OpenAI Platform, jak i
trasy subskrypcji/OAuth. Dla subskrypcji ChatGPT/Codex plus natywnego wykonywania Codex
użyj `openai/gpt-5.5` z `agentRuntime.id: "codex"`. Używaj
`openai-codex/gpt-5.5` tylko dla Codex OAuth przez PI albo `openai/gpt-5.5`
bez nadpisania środowiska uruchomieniowego Codex dla bezpośredniego ruchu `OPENAI_API_KEY`.
</Note>

<Note>
Włączenie Plugin OpenAI albo wybranie modelu `openai-codex/*` nie
włącza dołączonego Plugin serwera aplikacji Codex. OpenClaw włącza ten Plugin tylko
wtedy, gdy jawnie wybierzesz natywny mechanizm Codex przez
`agentRuntime.id: "codex"` albo użyjesz starszej referencji modelu `codex/*`.
Jeśli dołączony Plugin `codex` jest włączony, ale `openai-codex/*` nadal jest rozwiązywany
przez PI, `openclaw doctor` ostrzega i pozostawia trasę bez zmian.
</Note>

## Pokrycie funkcji OpenClaw

| Możliwość OpenAI          | Powierzchnia OpenClaw                                      | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses          | dostawca modelu `openai/<model>`                           | Tak                                                    |
| Modele subskrypcji Codex  | `openai-codex/<model>` z OAuth `openai-codex`              | Tak                                                    |
| Mechanizm serwera aplikacji Codex | `openai/<model>` z `agentRuntime.id: codex`             | Tak                                                    |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses                               | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
| Obrazy                    | `image_generate`                                           | Tak                                                    |
| Wideo                     | `video_generate`                                           | Tak                                                    |
| Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts`                  | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie multimediów                  | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`                  | Tak                                                    |
| Głos w czasie rzeczywistym | Voice Call `realtime.provider: "openai"` / Control UI Talk | Tak                                                    |
| Embeddingi                | dostawca embeddingów pamięci                               | Tak                                                    |

## Embeddingi pamięci

OpenClaw może używać OpenAI albo punktu końcowego embeddingów zgodnego z OpenAI do
indeksowania `memory_search` i embeddingów zapytań:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

W przypadku punktów końcowych zgodnych z OpenAI, które wymagają asymetrycznych etykiet embeddingów, ustaw
`queryInputType` i `documentInputType` w `memorySearch`. OpenClaw przekazuje
je jako specyficzne dla dostawcy pola żądania `input_type`: embeddingi zapytań używają
`queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Pełny przykład znajduje się w [Dokumentacji konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu do API i rozliczania według użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz lub skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom wdrożenie">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Referencja modelu      | Konfiguracja środowiska uruchomieniowego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | pominięto / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | pominięto / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Mechanizm serwera aplikacji Codex | Serwer aplikacji Codex |

    <Note>
    `openai/*` to bezpośrednia trasa klucza API OpenAI, chyba że jawnie wymusisz
    mechanizm serwera aplikacji Codex. Użyj `openai-codex/*` dla Codex OAuth przez
    domyślnego runnera PI albo użyj `openai/gpt-5.5` z
    `agentRuntime.id: "codex"` dla natywnego wykonywania przez serwer aplikacji Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Rzeczywiste żądania API OpenAI odrzucają ten model, a obecny katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex z natywnym wykonywaniem przez serwer aplikacji Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bez interfejsu graficznego lub nieobsługujących wywołań zwrotnych dodaj `--device-code`, aby zalogować się za pomocą przepływu kodu urządzenia ChatGPT zamiast zwrotnego wywołania przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Użyj natywnego środowiska uruchomieniowego Codex">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex","fallback":"none"}' --strict-json
        ```
      </Step>
      <Step title="Sprawdź, czy uwierzytelnianie Codex jest dostępne">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Po uruchomieniu gateway wyślij `/codex status` albo `/codex models`
        na czacie, aby sprawdzić natywne środowisko uruchomieniowe serwera aplikacji.
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Referencja modelu | Konfiguracja środowiska uruchomieniowego | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Natywny mechanizm serwera aplikacji Codex | Logowanie Codex albo wybrany profil `openai-codex` |
    | `openai-codex/gpt-5.5` | pominięto / `runtime: "pi"` | ChatGPT/Codex OAuth przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.4-mini` | pominięto / `runtime: "pi"` | ChatGPT/Codex OAuth przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nadal PI, chyba że Plugin jawnie zgłosi obsługę `openai-codex` | Logowanie Codex |

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń auth/profile.
    Prefiks modelu `openai-codex/*` jest też jawną trasą PI dla Codex OAuth.
    Nie wybiera ani nie włącza automatycznie dołączonego szkieletu app-server Codex. Dla
    typowej konfiguracji z subskrypcją i natywnym środowiskiem uruchomieniowym zaloguj się przez
    `openai-codex`, ale pozostaw referencję modelu jako `openai/gpt-5.5` i ustaw
    `agentRuntime.id: "codex"`.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex", fallback: "none" },
        },
      },
    }
    ```

    Aby zamiast tego zachować Codex OAuth na normalnym runnerze PI, użyj
    `openai-codex/gpt-5.5` i pomiń nadpisanie środowiska uruchomieniowego Codex.

    <Note>
    Onboarding nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez powyższy przepływ z kodem urządzenia — OpenClaw zarządza uzyskanymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Wskaźnik stanu

    Czatowe `/status` pokazuje, które środowisko uruchomieniowe modelu jest aktywne dla bieżącej sesji.
    Domyślny szkielet PI pojawia się jako `Runtime: OpenClaw Pi Default`. Gdy
    wybrany jest dołączony szkielet app-server Codex, `/status` pokazuje
    `Runtime: OpenAI Codex`. Istniejące sesje zachowują zapisany identyfikator szkieletu, więc użyj
    `/new` lub `/reset` po zmianie `agentRuntime`, jeśli chcesz, aby `/status`
    odzwierciedlał nowy wybór PI/Codex.

    ### Ostrzeżenie narzędzia doctor

    Jeśli dołączony Plugin `codex` jest włączony, a wybrana jest trasa `openai-codex/*`,
    `openclaw doctor` ostrzega, że model nadal jest rozwiązywany przez PI.
    Pozostaw konfigurację bez zmian tylko wtedy, gdy ta trasa uwierzytelniania subskrypcji PI
    jest zamierzona. Przełącz na `openai/<model>` oraz `agentRuntime.id: "codex"`, gdy
    chcesz natywnego wykonywania przez app-server Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu środowiska uruchomieniowego jako oddzielne wartości.

    Dla `openai-codex/gpt-5.5` przez Codex OAuth:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit środowiska uruchomieniowego `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce zapewnia lepszą latencję i jakość. Nadpisz go za pomocą `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Użyj `contextWindow`, aby zadeklarować natywne metadane modelu. Użyj `contextTokens`, aby ograniczyć budżet kontekstu środowiska uruchomieniowego.
    </Note>

    ### Odzyskiwanie katalogu

    OpenClaw używa metadanych katalogu upstream Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie live Codex pomija wiersz `openai-codex/gpt-5.5`, gdy
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, sub-agentów i skonfigurowanego modelu domyślnego nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie app-server Codex

Natywny szkielet app-server Codex używa referencji modeli `openai/*` oraz
`agentRuntime.id: "codex"`, ale jego uwierzytelnianie nadal opiera się na koncie. OpenClaw
wybiera uwierzytelnianie w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw `openai-codex` powiązany z agentem.
2. Istniejące konto app-server, takie jak lokalne logowanie Codex CLI ChatGPT.
3. Tylko dla lokalnych uruchomień app-server przez stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy app-server nie zgłasza konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcyjne ChatGPT/Codex nie jest zastępowane tylko
dlatego, że proces Gateway ma też `OPENAI_API_KEY` dla bezpośrednich modeli
OpenAI lub embeddings. Rezerwowy klucz API z env jest używany tylko w lokalnej ścieżce stdio bez konta;
nie jest wysyłany do połączeń WebSocket app-server. Gdy wybrany jest profil Codex
w stylu subskrypcyjnym, OpenClaw również usuwa `CODEX_API_KEY` i `OPENAI_API_KEY`
z uruchamianego procesu potomnego app-server stdio i wysyła wybrane poświadczenia
przez RPC logowania app-server.

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów przez klucz API OpenAI, jak i generowanie obrazów przez
Codex OAuth przez tę samą referencję modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referencja modelu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie                      | `OPENAI_API_KEY`                   | Logowanie OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Maksymalna liczba obrazów na żądanie    | 4                                  | 4                                    |
| Tryb edycji                 | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych)   |
| Nadpisania rozmiaru            | Obsługiwane, w tym rozmiary 2K/4K   | Obsługiwane, w tym rozmiary 2K/4K     |
| Proporcje / rozdzielczość | Nieprzekazywane do OpenAI Images API | Mapowane na obsługiwany rozmiar, gdy jest to bezpieczne |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

`gpt-image-2` jest domyślny zarówno dla generowania obrazów z tekstu OpenAI, jak i dla
edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają dostępne jako
jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia PNG/WebP
z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca
`background: "transparent"`.

W przypadku żądania z przezroczystym tłem agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` albo `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni też publiczne trasy OpenAI i
OpenAI Codex OAuth, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI zachowują
skonfigurowane nazwy wdrożeń/modeli.

To samo ustawienie jest dostępne dla bezgłowych uruchomień CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

Użyj tych samych flag `--output-format` i `--background` z
`openclaw infer image edit`, gdy zaczynasz od pliku wejściowego.
`--openai-background` pozostaje dostępne jako alias specyficzny dla OpenAI.

Dla instalacji Codex OAuth zachowaj tę samą referencję `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje zapisany token dostępu
OAuth i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw
`OPENAI_API_KEY` ani po cichu nie przełącza się na klucz API dla tego
żądania. Skonfiguruj `models.providers.openai` jawnie z kluczem API,
niestandardowym bazowym URL-em albo punktem końcowym Azure, gdy chcesz użyć bezpośredniej trasy
OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/adresie prywatnym, ustaw też
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw pozostawia
prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI zablokowane, chyba że ta zgoda
jest obecna.

Generuj:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Generuj przezroczysty PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Edytuj:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Dołączony Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość       | Wartość                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny    | `openai/sora-2`                                                                   |
| Tryby            | Tekst-do-wideo, obraz-do-wideo, edycja pojedynczego wideo                                  |
| Dane referencyjne | 1 obraz albo 1 wideo                                                                |
| Nadpisania rozmiaru   | Obsługiwane                                                                         |
| Inne nadpisania  | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje wspólny wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 u różnych dostawców. Stosuje się według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne referencje GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny szkielet Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje developerskie app-server Codex, więc sesje `openai/gpt-5.x` wymuszone przez `agentRuntime.id: "codex"` zachowują te same wskazówki dotyczące doprowadzania zadań do końca i proaktywnego Heartbeat, mimo że Codex jest właścicielem reszty promptu szkieletu.

Wkład GPT-5 dodaje oznaczony tagami kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału oraz zachowanie cichych wiadomości pozostają we wspólnym prompcie systemowym OpenClaw i polityce dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Warstwa przyjaznego stylu interakcji jest oddzielna i konfigurowalna.

| Wartość                  | Efekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącz warstwę przyjaznego stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                      |
| `"off"`                | Wyłącz tylko warstwę przyjaznego stylu       |

<Tabs>
  <Tab title="Konfiguracja">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Wartości nie uwzględniają wielkości liter w czasie działania, więc zarówno `"Off"`, jak i `"off"` wyłączają warstwę przyjaznego stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako rezerwowa zgodność, gdy wspólne ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Używa awaryjnie `OPENAI_API_KEY` |
    | Bazowy URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Dodatkowe body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nieustawione) |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z JSON żądania `/audio/speech` po polach wygenerowanych przez OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypu są ignorowane.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy API czatu.
    </Note>

  </Accordion>

  <Accordion title="Mowa na tekst">
    Wbudowany Plugin `openai` rejestruje wsadową transkrypcję mowy na tekst przez
    powierzchnię transkrypcji rozumienia multimediów OpenClaw.

    - Domyślny model: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmenty kanałów głosowych Discord i załączniki
      audio kanałów

    Aby wymusić OpenAI dla transkrypcji przychodzącego audio:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy są dostarczone przez
    współdzieloną konfigurację multimediów audio lub żądanie transkrypcji dla pojedynczego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Wbudowany Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Używa awaryjnie `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki wsadowej transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Wbudowany Plugin `openai` rejestruje głos w czasie rzeczywistym dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Używa awaryjnie `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment` dla backendowych mostów czasu rzeczywistego. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk używa sesji czasu rzeczywistego OpenAI w przeglądarce z tymczasowym
    sekretem klienta wybitym przez Gateway oraz bezpośrednią wymianą WebRTC SDP w przeglądarce z
    OpenAI Realtime API. Weryfikacja na żywo dla opiekunów jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    część OpenAI wybija sekret klienta w Node, generuje ofertę SDP przeglądarki
    z fałszywym medium mikrofonu, wysyła ją do OpenAI i stosuje odpowiedź SDP
    bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Wbudowany dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie bazowego URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądania Azure.

<Note>
Głos w czasie rzeczywistym używa oddzielnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i `models.providers.openai.baseUrl` nie ma na niego wpływu. Zobacz akordeon **Głos w czasie
rzeczywistym** w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia
Azure.
</Note>

Używaj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę korporacyjną Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub mechanizmów zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch wewnątrz istniejącej dzierżawy Azure

### Konfiguracja

Dla generowania obrazów Azure przez wbudowanego dostawcę `openai` wskaż
`models.providers.openai.baseUrl` na swój zasób Azure i ustaw `apiKey` na
klucz Azure OpenAI (nie klucz OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw rozpoznaje te sufiksy hostów Azure dla trasy generowania obrazów
Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek ograniczonych do wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów Azure.
  Wartości `timeoutMs` dla pojedynczych wywołań nadal nadpisują tę wartość domyślną.

Inne bazowe URL-e (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazu OpenAI.

<Note>
Trasowanie Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i zakończą się niepowodzeniem wobec wdrożeń
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję zapoznawczą Azure lub wersję GA
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślna wartość to `2024-12-01-preview`, gdy zmienna jest nieustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
trasowanych przez wbudowanego dostawcę `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów trasowanych przez
wbudowanego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w podzbiorze regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia sprawdź bieżącą listę regionów Microsoftu
i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, które publiczne OpenAI dopuszcza (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko w określonych wersjach
modelu. Te różnice pochodzą z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure zakończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne kontra zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu wdrożeniowego lub dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie przejmuje kształtu API/uwierzytelniania Azure. Istnieje oddzielny
dostawca `azure-openai-responses/*`; zobacz akordeon kompakcji po stronie serwera poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket kontra SSE)">
    OpenClaw używa przede wszystkim WebSocket z awaryjnym SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przełączeniem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas okresu schładzania
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień oraz ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślne) | Najpierw WebSocket, awaryjnie SSE |
    | `"sse"` | Wymuś tylko SSE |
    | `"websocket"` | Wymuś tylko WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Powiązana dokumentacja OpenAI:
    - [Realtime API z WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Odpowiedzi API strumieniowania (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Rozgrzewka WebSocket">
    OpenClaw domyślnie włącza rozgrzewkę WebSocket dla `openai/*` i `openai-codex/*`, aby zmniejszyć opóźnienie pierwszej tury.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Tryb szybki">
    OpenClaw udostępnia współdzielony przełącznik trybu szybkiego dla `openai/*` i `openai-codex/*`:

    - **Czat/UI:** `/fast status|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na przetwarzanie priorytetowe OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w UI sesji przywraca sesję do skonfigurowanej wartości domyślnej.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je dla każdego modelu w OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Obsługiwane wartości: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` jest przekazywany tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    W przypadku bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) opakowanie strumienia Pi-harness Plugin OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślne `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki harnessa Pi oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany osobno za pomocą `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych punktów końcowych, takich jak Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Niestandardowy próg">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Wyłącz">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` kontroluje tylko wstrzykiwanie `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Tryb GPT strict-agentic">
    W przypadku uruchomień rodziny GPT-5 na `openai/*` OpenClaw może używać bardziej rygorystycznego kontraktu osadzonego wykonywania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Z `strict-agentic` OpenClaw:
    - Nie traktuje już tury zawierającej wyłącznie plan jako udanego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę z nakierowaniem na natychmiastowe działanie
    - Automatycznie włącza `update_plan` dla większych prac
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 w OpenAI i Codex. Inni dostawcy oraz starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne kontra trasy zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących wysiłek OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań specyficzne dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki cache promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają `store` Completions z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowany przekaz JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków wyłącznie natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego używania poświadczeń.
  </Card>
</CardGroup>
