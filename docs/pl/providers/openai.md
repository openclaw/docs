---
read_when:
    - Chcesz korzystać z modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania przez subskrypcję Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania agentów GPT-5 podczas wykonywania zadań
summary: Korzystaj z OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T10:14:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: be0e2cd14990a53533c800cd8d305c9c50b0fa7131f6638e7b9d8dd9f2942fe8
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia deweloperskie API dla modeli GPT, a Codex jest też dostępny jako
agent programistyczny w planie ChatGPT przez klientów Codex firmy OpenAI. OpenClaw utrzymuje te
powierzchnie oddzielnie, aby konfiguracja pozostała przewidywalna.

OpenClaw obsługuje trzy ścieżki z rodziny OpenAI. Prefiks modelu wybiera
trasę dostawcy/uwierzytelniania; osobne ustawienie runtime wybiera, kto wykonuje
osadzoną pętlę agenta:

- **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem według użycia (modele `openai/*`)
- **Subskrypcja Codex przez PI** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (modele `openai-codex/*`)
- **Uprząż serwera aplikacji Codex** — natywne wykonywanie przez serwer aplikacji Codex (modele `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)

OpenAI jawnie obsługuje użycie OAuth subskrypcji w zewnętrznych narzędziach i przepływach pracy takich jak OpenClaw.

Dostawca, model, runtime i kanał są oddzielnymi warstwami. Jeśli te etykiety
zaczynają się mieszać, przeczytaj [Runtime agenta](/pl/concepts/agent-runtimes) przed
zmianą konfiguracji.

## Szybki wybór

| Cel                                           | Użyj                                             | Uwagi                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Bezpośrednie rozliczanie kluczem API          | `openai/gpt-5.5`                                 | Ustaw `OPENAI_API_KEY` albo uruchom wdrażanie klucza API OpenAI.             |
| GPT-5.5 z uwierzytelnianiem subskrypcji ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Domyślna trasa PI dla OAuth Codex. Najlepszy pierwszy wybór dla konfiguracji subskrypcyjnych. |
| GPT-5.5 z natywnym zachowaniem serwera aplikacji Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Wymusza uprząż serwera aplikacji Codex dla tego odwołania modelu.            |
| Generowanie lub edycja obrazów                | `openai/gpt-image-2`                             | Działa z `OPENAI_API_KEY` albo OpenAI Codex OAuth.                           |
| Obrazy z przezroczystym tłem                  | `openai/gpt-image-1.5`                           | Użyj `outputFormat=png` albo `webp` i `openai.background=transparent`.       |

## Mapa nazewnictwa

Nazwy są podobne, ale nie są zamienne:

| Nazwa, którą widzisz                | Warstwa           | Znaczenie                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefiks dostawcy  | Bezpośrednia trasa API OpenAI Platform.                                                           |
| `openai-codex`                     | Prefiks dostawcy  | Trasa OAuth/subskrypcji OpenAI Codex przez standardowy runner PI OpenClaw.                        |
| Plugin `codex`                     | Plugin            | Dołączony Plugin OpenClaw, który zapewnia natywny runtime serwera aplikacji Codex i kontrolki czatu `/codex`. |
| `agentRuntime.id: codex`           | Runtime agenta    | Wymuś natywną uprząż serwera aplikacji Codex dla osadzonych tur.                                  |
| `/codex ...`                       | Zestaw poleceń czatu | Powiąż/kontroluj wątki serwera aplikacji Codex z rozmowy.                                      |
| `runtime: "acp", agentId: "codex"` | Trasa sesji ACP   | Jawna ścieżka awaryjna, która uruchamia Codex przez ACP/acpx.                                     |

Oznacza to, że konfiguracja może celowo zawierać zarówno `openai-codex/*`, jak i
Plugin `codex`. Jest to prawidłowe, gdy chcesz używać Codex OAuth przez PI i jednocześnie chcesz mieć dostępne
natywne kontrolki czatu `/codex`. `openclaw doctor` ostrzega o tej
kombinacji, aby można było potwierdzić, że jest zamierzona; nie przepisuje jej.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API OpenAI Platform, jak i
trasy subskrypcji/OAuth. Użyj `openai/gpt-5.5` dla bezpośredniego ruchu
`OPENAI_API_KEY`, `openai-codex/gpt-5.5` dla Codex OAuth przez PI albo
`openai/gpt-5.5` z `agentRuntime.id: "codex"` dla natywnej uprzęży
serwera aplikacji Codex.
</Note>

<Note>
Włączenie Plugin OpenAI albo wybranie modelu `openai-codex/*` nie
włącza dołączonego Plugin serwera aplikacji Codex. OpenClaw włącza ten Plugin tylko
wtedy, gdy jawnie wybierzesz natywną uprząż Codex za pomocą
`agentRuntime.id: "codex"` albo użyjesz starszego odwołania modelu `codex/*`.
Jeśli dołączony Plugin `codex` jest włączony, ale `openai-codex/*` nadal rozwiązuje się
przez PI, `openclaw doctor` ostrzega i pozostawia trasę bez zmian.
</Note>

## Pokrycie funkcji OpenClaw

| Możliwość OpenAI          | Powierzchnia OpenClaw                                      | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses          | dostawca modeli `openai/<model>`                           | Tak                                                    |
| Modele subskrypcji Codex  | `openai-codex/<model>` z OAuth `openai-codex`              | Tak                                                    |
| Uprząż serwera aplikacji Codex | `openai/<model>` z `agentRuntime.id: codex`             | Tak                                                    |
| Wyszukiwanie internetowe po stronie serwera | Natywne narzędzie OpenAI Responses            | Tak, gdy wyszukiwanie internetowe jest włączone i nie przypięto dostawcy |
| Obrazy                    | `image_generate`                                           | Tak                                                    |
| Wideo                     | `video_generate`                                           | Tak                                                    |
| Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts`                  | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie multimediów            | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`          | Tak                                                    |
| Głos w czasie rzeczywistym | Voice Call `realtime.provider: "openai"` / Control UI Talk | Tak                                                    |
| Embeddingi                | dostawca embeddingów pamięci                               | Tak                                                    |

## Embeddingi pamięci

OpenClaw może używać OpenAI albo endpointu embeddingów zgodnego z OpenAI do
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

W przypadku endpointów zgodnych z OpenAI, które wymagają asymetrycznych etykiet embeddingów, ustaw
`queryInputType` i `documentInputType` w `memorySearch`. OpenClaw przekazuje
je jako specyficzne dla dostawcy pola żądania `input_type`: embeddingi zapytań używają
`queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Zobacz [Dokumentację konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config), aby uzyskać pełny przykład.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu API i rozliczania według użycia.

    <Steps>
      <Step title="Pobierz klucz API">
        Utwórz lub skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom wdrażanie">
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

    ### Podsumowanie trasy

    | Odwołanie modelu       | Konfiguracja runtime       | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Uprząż serwera aplikacji Codex | Serwer aplikacji Codex |

    <Note>
    `openai/*` to bezpośrednia trasa klucza API OpenAI, chyba że jawnie wymusisz
    uprząż serwera aplikacji Codex. Użyj `openai-codex/*` dla Codex OAuth przez
    domyślny runner PI albo użyj `openai/gpt-5.5` z
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
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania live API OpenAI odrzucają ten model, a bieżący katalog Codex też go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bez interfejsu graficznego lub niesprzyjających wywołaniom zwrotnym dodaj `--device-code`, aby zalogować się przepływem kodu urządzenia ChatGPT zamiast wywołania zwrotnego przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Ustaw model domyślny">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Sprawdź, czy model jest dostępny">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Podsumowanie trasy

    | Odwołanie modelu | Konfiguracja runtime | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | pominięte / `runtime: "pi"` | ChatGPT/Codex OAuth przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nadal PI, chyba że Plugin jawnie przejmie `openai-codex` | Logowanie Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Uprząż serwera aplikacji Codex | Uwierzytelnianie serwera aplikacji Codex |

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń uwierzytelniania/profili. Prefiks modelu
    `openai-codex/*` jest też jawną trasą PI dla Codex OAuth.
    Nie wybiera ani automatycznie nie włącza dołączonej uprzęży serwera aplikacji Codex.
    </Note>

    <Warning>
    `openai-codex/gpt-5.4-mini` nie jest obsługiwaną trasą Codex OAuth. Użyj
    `openai/gpt-5.4-mini` z kluczem API OpenAI albo użyj
    `openai-codex/gpt-5.5` z Codex OAuth.
    </Warning>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Wdrażanie nie importuje już materiału OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przepływ kodu urządzenia powyżej — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Wskaźnik statusu

    Czat `/status` pokazuje, które środowisko uruchomieniowe modelu jest aktywne w bieżącej sesji.
    Domyślny mechanizm PI pojawia się jako `Runtime: OpenClaw Pi Default`. Gdy wybrany jest
    dołączony mechanizm app-servera Codex, `/status` pokazuje
    `Runtime: OpenAI Codex`. Istniejące sesje zachowują zapisany identyfikator mechanizmu, więc użyj
    `/new` lub `/reset` po zmianie `agentRuntime`, jeśli chcesz, aby `/status`
    odzwierciedlał nowy wybór PI/Codex.

    ### Ostrzeżenie doctora

    Jeśli dołączony Plugin `codex` jest włączony, gdy wybrana jest trasa tej karty
    `openai-codex/*`, `openclaw doctor` ostrzega, że model
    nadal jest rozwiązywany przez PI. Pozostaw konfigurację bez zmian, gdy jest to
    zamierzona trasa uwierzytelniania subskrypcyjnego. Przełącz na `openai/<model>` oraz
    `agentRuntime.id: "codex"` tylko wtedy, gdy chcesz natywnego wykonywania przez
    app-server Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu środowiska uruchomieniowego jako osobne wartości.

    Dla `openai-codex/gpt-5.5` przez OAuth Codex:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit środowiska uruchomieniowego `contextTokens`: `272000`

    Mniejszy domyślny limit ma w praktyce lepsze charakterystyki opóźnienia i jakości. Nadpisz go za pomocą `contextTokens`:

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

    OpenClaw używa nadrzędnych metadanych katalogu Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie Codex na żywo pomija wiersz `openai-codex/gpt-5.5`, gdy
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, podagentów i skonfigurowanego modelu domyślnego nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie app-servera Codex

Natywny mechanizm app-servera Codex używa referencji modeli `openai/*` oraz
`agentRuntime.id: "codex"`, ale jego uwierzytelnianie nadal opiera się na koncie. OpenClaw
wybiera uwierzytelnianie w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw `openai-codex` powiązany z agentem.
2. Istniejące konto app-servera, takie jak lokalne logowanie ChatGPT w CLI Codex.
3. Tylko dla lokalnych uruchomień app-servera stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy app-server zgłasza brak konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcyjne ChatGPT/Codex nie jest zastępowane tylko
dlatego, że proces gateway ma również `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI
lub embeddings. Zapasowy klucz API ze zmiennych środowiskowych jest używany tylko w lokalnej ścieżce stdio bez konta; nie
jest wysyłany do połączeń WebSocket app-servera. Gdy wybrany jest profil Codex
w stylu subskrypcyjnym, OpenClaw utrzymuje także `CODEX_API_KEY` i `OPENAI_API_KEY`
poza utworzonym procesem potomnym app-servera stdio i wysyła wybrane dane uwierzytelniające
przez RPC logowania app-servera.

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów z kluczem API OpenAI, jak i generowanie obrazów przez OAuth Codex
przy użyciu tej samej referencji modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referencja modelu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie                      | `OPENAI_API_KEY`                   | Logowanie OAuth OpenAI Codex           |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Maks. liczba obrazów na żądanie    | 4                                  | 4                                    |
| Tryb edycji                 | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych)   |
| Nadpisania rozmiaru            | Obsługiwane, w tym rozmiary 2K/4K   | Obsługiwane, w tym rozmiary 2K/4K     |
| Proporcje / rozdzielczość | Nieprzekazywane do API OpenAI Images | Mapowane na obsługiwany rozmiar, gdy jest to bezpieczne |

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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

`gpt-image-2` jest domyślny zarówno dla generowania obrazów z tekstu OpenAI, jak i edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają dostępne jako jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia PNG/WebP z przezroczystym tłem; obecne API `gpt-image-2` odrzuca
`background: "transparent"`.

W przypadku żądania przezroczystego tła agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni także publiczne trasy OpenAI i
OpenAI Codex OAuth, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI zachowują
skonfigurowane nazwy wdrożeń/modeli.

To samo ustawienie jest dostępne dla bezobsługowych uruchomień CLI:

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
`--openai-background` pozostaje dostępny jako alias specyficzny dla OpenAI.

W instalacjach OAuth Codex zachowaj tę samą referencję `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw użyć `OPENAI_API_KEY` ani po cichu przełączyć się na klucz API dla tego
żądania. Skonfiguruj jawnie `models.providers.openai` z kluczem API,
niestandardowym bazowym adresem URL lub punktem końcowym Azure, gdy zamiast tego chcesz użyć bezpośredniej trasy API OpenAI Images.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/adresie prywatnym, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw utrzymuje
prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI zablokowane, chyba że ta zgoda jest
obecna.

Generuj:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Wygeneruj przezroczysty PNG:

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
| Tryby            | Tekst na wideo, obraz na wideo, edycja pojedynczego wideo                                  |
| Wejścia referencyjne | 1 obraz lub 1 wideo                                                                |
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje wspólny wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 u różnych dostawców. Jest stosowany według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne referencje GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny mechanizm Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie app-servera Codex, więc sesje `openai/gpt-5.x` wymuszone przez `agentRuntime.id: "codex"` zachowują te same wskazówki dotyczące doprowadzania pracy do końca i proaktywnego Heartbeat, mimo że Codex odpowiada za resztę promptu mechanizmu.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu wyników, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału i cichych wiadomości pozostaje we wspólnym prompcie systemowym OpenClaw i zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Przyjazna warstwa stylu interakcji jest osobna i konfigurowalna.

| Wartość                  | Efekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślnie) | Włącza przyjazną warstwę stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                      |
| `"off"`                | Wyłącza tylko przyjazną warstwę stylu       |

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
Wartości nie rozróżniają wielkości liter w czasie działania, więc `"Off"` i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako zapasowa zgodność, gdy wspólne ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
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
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla wiadomości głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Używa zapasowo `OPENAI_API_KEY` |
    | Bazowy adres URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy adres URL TTS bez wpływu na punkt końcowy API czatu.
    </Note>

  </Accordion>

  <Accordion title="Mowa na tekst">
    Dołączony Plugin `openai` rejestruje wsadową transkrypcję mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmenty kanałów głosowych Discord i załączniki audio
      kanałów

    Aby wymusić OpenAI do transkrypcji przychodzącego audio:

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy zostaną podane przez
    współdzieloną konfigurację mediów audio albo żądanie transkrypcji dla danego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Używa zastępczo `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki transkrypcji wsadowej `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Używa zastępczo `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment` dla backendowych mostów czasu rzeczywistego. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

    <Note>
    Talk w Control UI używa sesji czasu rzeczywistego OpenAI w przeglądarce z
    efemerycznym sekretem klienta wygenerowanym przez Gateway i bezpośrednią wymianą SDP WebRTC w przeglądarce z
    OpenAI Realtime API. Weryfikacja na żywo przez maintainerów jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    etap OpenAI generuje sekret klienta w Node, tworzy ofertę SDP przeglądarki
    z fałszywym medium mikrofonu, wysyła ją do OpenAI i stosuje odpowiedź SDP
    bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie bazowego adresu URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądania Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i `models.providers.openai.baseUrl` nie ma na niego wpływu. Zobacz akordeon **Głos w czasie rzeczywistym**
w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia Azure.
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę enterprise Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub kontroli zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch wewnątrz istniejącego tenant Azure

### Konfiguracja

Aby generować obrazy w Azure przez dołączonego dostawcę `openai`, skieruj
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
  Wartości `timeoutMs` dla danego wywołania nadal nadpisują tę wartość domyślną.

Inne bazowe adresy URL (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazu OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszej wersji. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i zakończą się niepowodzeniem przy wdrożeniach
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć określoną wersję preview lub GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślnie używana jest wersja `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
kierowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
identyfikatorem publicznego modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów kierowanych przez
dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w wybranych regionach
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Sprawdź aktualną listę regionów Microsoftu przed utworzeniem
wdrożenia i potwierdź, że dany model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, na które pozwala publiczne OpenAI (na przykład określone
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
przepływu onboardingu albo dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie wybiera kształtu API/uwierzytelniania Azure. Istnieje osobny dostawca
`azure-openai-responses/*`; zobacz
akordeon dotyczący server-side compaction poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket kontra SSE)">
    OpenClaw używa podejścia WebSocket-first z fallbackiem SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany przez około 60 sekund i używa SSE w czasie schładzania
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień oraz ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, fallback SSE |
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
    - [Strumieniowanie odpowiedzi API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Rozgrzewanie WebSocket">
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*` i `openai-codex/*`, aby zmniejszyć opóźnienie pierwszej tury.

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
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w UI Sessions przywraca sesję do skonfigurowanej wartości domyślnej.
    </Note>

  </Accordion>

  <Accordion title="Przetwarzanie priorytetowe (service_tier)">
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je dla modelu w OpenClaw:

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

  <Accordion title="Server-side compaction (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` w `api.openai.com`) wrapper strumienia Pi-harness Pluginu OpenAI automatycznie włącza server-side compaction:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (albo `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany osobno za pomocą `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` kontroluje tylko wstrzykiwanie `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawi `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Tryb GPT strict-agentic">
    Dla uruchomień z rodziny GPT-5 na `openai/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonania:

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
    - Nie traktuje już tury zawierającej tylko plan jako udanego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę ze wskazaniem do natychmiastowego działania
    - Automatycznie włącza `update_plan` dla większych prac
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień OpenAI i Codex z rodziny GPT-5. Inni dostawcy i starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli, które obsługują wysiłek OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań wyłącznie dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają Completions `store` z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowane przekazywanie JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków wyłącznie natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
