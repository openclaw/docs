---
read_when:
    - Chcesz korzystać z modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcji Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania agenta GPT-5 podczas wykonywania zadań
summary: Korzystaj z OpenAI w OpenClaw za pomocą kluczy API lub subskrypcji Codex
title: OpenAI
x-i18n:
    generated_at: "2026-04-30T16:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e113f2418f82a8859f208f85efb55114bda7bc17beeb28f012b19e861609dad
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia deweloperskie interfejsy API dla modeli GPT, a Codex jest także dostępny jako
agent programistyczny w planie ChatGPT przez klientów Codex firmy OpenAI. OpenClaw utrzymuje te
powierzchnie oddzielnie, aby konfiguracja pozostała przewidywalna.

OpenClaw obsługuje trzy trasy z rodziny OpenAI. Prefiks modelu wybiera
trasę dostawcy/uwierzytelniania; osobne ustawienie środowiska uruchomieniowego wybiera, kto wykonuje
osadzoną pętlę agenta:

- **Klucz API** — bezpośredni dostęp do OpenAI Platform z rozliczaniem według użycia (modele `openai/*`)
- **Subskrypcja Codex przez PI** — logowanie ChatGPT/Codex z dostępem subskrypcyjnym (modele `openai-codex/*`)
- **Uprząż serwera aplikacji Codex** — natywne wykonywanie serwera aplikacji Codex (modele `openai/*` oraz `agents.defaults.agentRuntime.id: "codex"`)

OpenAI jawnie obsługuje użycie OAuth z subskrypcją w zewnętrznych narzędziach i przepływach pracy takich jak OpenClaw.

Dostawca, model, środowisko uruchomieniowe i kanał to osobne warstwy. Jeśli te etykiety
zaczynają się mieszać, przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) przed
zmianą konfiguracji.

## Szybki wybór

| Cel                                           | Użyj                                             | Uwagi                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Bezpośrednie rozliczanie kluczem API          | `openai/gpt-5.5`                                 | Ustaw `OPENAI_API_KEY` albo uruchom onboarding klucza API OpenAI.            |
| GPT-5.5 z uwierzytelnianiem subskrypcji ChatGPT/Codex | `openai-codex/gpt-5.5`                           | Domyślna trasa PI dla OAuth Codex. Najlepszy pierwszy wybór dla konfiguracji subskrypcyjnych. |
| GPT-5.5 z natywnym zachowaniem serwera aplikacji Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Wymusza uprząż serwera aplikacji Codex dla tej referencji modelu.            |
| Generowanie lub edycja obrazów                | `openai/gpt-image-2`                             | Działa z `OPENAI_API_KEY` albo OAuth OpenAI Codex.                           |
| Obrazy z przezroczystym tłem                  | `openai/gpt-image-1.5`                           | Użyj `outputFormat=png` albo `webp` oraz `openai.background=transparent`.    |

## Mapa nazewnictwa

Nazwy są podobne, ale nie są wymienne:

| Nazwa, którą widzisz               | Warstwa           | Znaczenie                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefiks dostawcy  | Bezpośrednia trasa API OpenAI Platform.                                                           |
| `openai-codex`                     | Prefiks dostawcy  | Trasa OAuth/subskrypcji OpenAI Codex przez normalny runner PI OpenClaw.                           |
| `codex` plugin                     | Plugin            | Dołączony plugin OpenClaw, który zapewnia natywne środowisko uruchomieniowe serwera aplikacji Codex i kontrolki czatu `/codex`. |
| `agentRuntime.id: codex`           | Środowisko uruchomieniowe agenta | Wymusza natywną uprząż serwera aplikacji Codex dla osadzonych tur.                                |
| `/codex ...`                       | Zestaw poleceń czatu | Powiąż/kontroluj wątki serwera aplikacji Codex z rozmowy.                                        |
| `runtime: "acp", agentId: "codex"` | Trasa sesji ACP   | Jawna ścieżka awaryjna, która uruchamia Codex przez ACP/acpx.                                     |

Oznacza to, że konfiguracja może celowo zawierać zarówno `openai-codex/*`, jak i
plugin `codex`. Jest to poprawne, gdy chcesz OAuth Codex przez PI i jednocześnie chcesz mieć
dostępne natywne kontrolki czatu `/codex`. `openclaw doctor` ostrzega o tej
kombinacji, aby można było potwierdzić, że jest zamierzona; nie przepisuje jej.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp z kluczem API OpenAI Platform, jak i przez
trasy subskrypcji/OAuth. Użyj `openai/gpt-5.5` dla bezpośredniego ruchu `OPENAI_API_KEY`,
`openai-codex/gpt-5.5` dla OAuth Codex przez PI albo
`openai/gpt-5.5` z `agentRuntime.id: "codex"` dla natywnej uprzęży serwera aplikacji Codex.
</Note>

<Note>
Włączenie pluginu OpenAI albo wybranie modelu `openai-codex/*` nie
włącza dołączonego pluginu serwera aplikacji Codex. OpenClaw włącza ten plugin tylko
wtedy, gdy jawnie wybierzesz natywną uprząż Codex za pomocą
`agentRuntime.id: "codex"` albo użyjesz starszej referencji modelu `codex/*`.
Jeśli dołączony plugin `codex` jest włączony, ale `openai-codex/*` nadal rozwiązuje się
przez PI, `openclaw doctor` ostrzega i pozostawia trasę bez zmian.
</Note>

## Pokrycie funkcji OpenClaw

| Możliwość OpenAI         | Powierzchnia OpenClaw                                      | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses          | Dostawca modelu `openai/<model>`                           | Tak                                                    |
| Modele subskrypcji Codex  | `openai-codex/<model>` z OAuth `openai-codex`              | Tak                                                    |
| Uprząż serwera aplikacji Codex | `openai/<model>` z `agentRuntime.id: codex`             | Tak                                                    |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses                     | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
| Obrazy                    | `image_generate`                                           | Tak                                                    |
| Filmy                     | `video_generate`                                           | Tak                                                    |
| Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts`                  | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie mediów                 | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`          | Tak                                                    |
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
`queryInputType`; zaindeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Zobacz [Dokumentację konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config), aby uzyskać pełny przykład.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu API i rozliczania według użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz albo skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Uruchom onboarding">
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

    | Referencja modelu      | Konfiguracja środowiska uruchomieniowego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Uprząż serwera aplikacji Codex    | Serwer aplikacji Codex |

    <Note>
    `openai/*` to bezpośrednia trasa z kluczem API OpenAI, chyba że jawnie wymusisz
    uprząż serwera aplikacji Codex. Użyj `openai-codex/*` dla OAuth Codex przez
    domyślny runner PI albo użyj `openai/gpt-5.5` z
    `agentRuntime.id: "codex"` dla natywnego wykonywania serwera aplikacji Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania API OpenAI na żywo odrzucają ten model, a obecny katalog Codex także go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bez interfejsu albo nieobsługujących wywołania zwrotnego dodaj `--device-code`, aby zalogować się za pomocą przepływu kodu urządzenia ChatGPT zamiast lokalnego wywołania zwrotnego przeglądarki:

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

    | Referencja modelu | Konfiguracja środowiska uruchomieniowego | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | pominięte / `runtime: "pi"` | OAuth ChatGPT/Codex przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.4-mini` | pominięte / `runtime: "pi"` | OAuth ChatGPT/Codex przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nadal PI, chyba że plugin jawnie przejmie `openai-codex` | Logowanie Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Uprząż serwera aplikacji Codex | Uwierzytelnianie serwera aplikacji Codex |

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń uwierzytelniania/profilu. Prefiks modelu
    `openai-codex/*` jest także jawną trasą PI dla OAuth Codex.
    Nie wybiera ani automatycznie nie włącza dołączonej uprzęży serwera aplikacji Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Onboarding nie importuje już materiału OAuth z `~/.codex`. Zaloguj się za pomocą OAuth w przeglądarce (domyślnie) albo przepływu kodu urządzenia powyżej — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Wskaźnik statusu

    Czat `/status` pokazuje, który runtime modelu jest aktywny dla bieżącej sesji.
    Domyślny mechanizm Pi pojawia się jako `Runtime: OpenClaw Pi Default`. Gdy
    wybrany jest dołączony mechanizm serwera aplikacji Codex, `/status` pokazuje
    `Runtime: OpenAI Codex`. Istniejące sesje zachowują zapisany identyfikator mechanizmu, więc użyj
    `/new` lub `/reset` po zmianie `agentRuntime`, jeśli chcesz, aby `/status`
    odzwierciedlał nowy wybór Pi/Codex.

    ### Ostrzeżenie doctor

    Jeśli dołączony plugin `codex` jest włączony, gdy wybrana jest trasa
    `openai-codex/*` tej karty, `openclaw doctor` ostrzega, że model
    nadal rozwiązuje się przez Pi. Pozostaw konfigurację bez zmian, gdy jest to
    zamierzona trasa uwierzytelniania subskrypcją. Przełącz na `openai/<model>` oraz
    `agentRuntime.id: "codex"` tylko wtedy, gdy chcesz natywnego wykonywania przez
    serwer aplikacji Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako oddzielne wartości.

    Dla `openai-codex/gpt-5.5` przez Codex OAuth:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce ma lepszą charakterystykę opóźnień i jakości. Nadpisz go za pomocą `contextTokens`:

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
    Użyj `contextWindow`, aby zadeklarować natywne metadane modelu. Użyj `contextTokens`, aby ograniczyć budżet kontekstu runtime.
    </Note>

    ### Odzyskiwanie katalogu

    OpenClaw używa metadanych katalogu upstream Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie live Codex pomija wiersz `openai-codex/gpt-5.5`, mimo że
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, sub-agentów i skonfigurowanego domyślnego modelu nie kończyły się niepowodzeniem z
    `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie serwera aplikacji Codex

Natywny mechanizm serwera aplikacji Codex używa odwołań modeli `openai/*` oraz
`agentRuntime.id: "codex"`, ale jego uwierzytelnianie nadal jest oparte na koncie. OpenClaw
wybiera uwierzytelnianie w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw `openai-codex` powiązany z agentem.
2. Istniejące konto serwera aplikacji, na przykład lokalne logowanie ChatGPT w Codex CLI.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy serwer aplikacji nie zgłasza konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcyjne ChatGPT/Codex nie jest zastępowane tylko
dlatego, że proces gateway ma także `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI
lub embeddingów. Rezerwowe użycie klucza API z env dotyczy tylko lokalnej ścieżki stdio bez konta; nie
jest wysyłane do połączeń WebSocket z serwerem aplikacji. Gdy wybrany jest profil Codex
w stylu subskrypcyjnym, OpenClaw trzyma także `CODEX_API_KEY` i `OPENAI_API_KEY`
poza uruchomionym procesem potomnym serwera aplikacji stdio i wysyła wybrane poświadczenia
przez RPC logowania serwera aplikacji.

## Generowanie obrazów

Dołączony plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów za pomocą klucza API OpenAI, jak i generowanie obrazów
przez Codex OAuth za pomocą tego samego odwołania modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odwołanie modelu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie                      | `OPENAI_API_KEY`                   | Logowanie OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Maks. liczba obrazów na żądanie    | 4                                  | 4                                    |
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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

`gpt-image-2` jest domyślne zarówno dla generowania obrazów z tekstu OpenAI, jak i edycji obrazów. `gpt-image-1.5`, `gpt-image-1` oraz `gpt-image-1-mini` pozostają dostępne jako
jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia PNG/WebP z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca
`background: "transparent"`.

Dla żądania z przezroczystym tłem agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni także publiczne trasy OpenAI i
OpenAI Codex OAuth, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI zachowują
skonfigurowane nazwy wdrożeń/modeli.

To samo ustawienie jest udostępnione dla bezinterfejsowych uruchomień CLI:

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

W instalacjach Codex OAuth zachowaj to samo odwołanie `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje ten zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw
`OPENAI_API_KEY` ani po cichu nie przełącza się na klucz API dla tego
żądania. Skonfiguruj `models.providers.openai` jawnie z kluczem API,
niestandardowym bazowym URL-em lub punktem końcowym Azure, gdy chcesz zamiast tego używać bezpośredniej trasy OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/prywatnym adresie, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw utrzymuje
prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI zablokowane, chyba że ta zgoda jest
obecna.

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

Dołączony plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość       | Wartość                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| Domyślny model    | `openai/sora-2`                                                                   |
| Tryby            | Tekst-na-wideo, obraz-na-wideo, edycja pojedynczego wideo                                  |
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

OpenClaw dodaje współdzielony wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 u różnych dostawców. Stosuje się według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne odwołania GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny mechanizm Codex używa tego samego zachowania GPT-5 i nakładki heartbeat przez instrukcje deweloperskie serwera aplikacji Codex, więc sesje `openai/gpt-5.x` wymuszone przez `agentRuntime.id: "codex"` zachowują te same wskazówki dotyczące doprowadzania zadań do końca i proaktywnego heartbeat, mimo że Codex odpowiada za resztę promptu mechanizmu.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału oraz cichych wiadomości pozostaje we współdzielonym systemowym prompcie OpenClaw i zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Przyjazna warstwa stylu interakcji jest oddzielna i konfigurowalna.

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
Wartości nie rozróżniają wielkości liter w runtime, więc zarówno `"Off"`, jak i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako rezerwowa ścieżka zgodności, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Wraca do `OPENAI_API_KEY` |
    | Bazowy URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy API czatu.
    </Note>

  </Accordion>

  <Accordion title="Mowa-na-tekst">
    Dołączony plugin `openai` rejestruje wsadową transkrypcję mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Domyślny model: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejścia: przesyłanie pliku audio multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja audio przychodzącego używa
      `tools.media.audio`, w tym segmenty kanału głosowego Discord i załączniki audio
      kanałów

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy zostaną podane przez
    współdzieloną konfigurację mediów audio albo żądanie transkrypcji dla pojedynczego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nie ustawiono) |
    | Prompt | `...openai.prompt` | (nie ustawiono) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Wraca do `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki transkrypcji wsadowej `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Wraca do `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment` dla backendowych mostów czasu rzeczywistego. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk używa sesji OpenAI w przeglądarce w czasie rzeczywistym z wygenerowanym przez Gateway
    efemerycznym sekretem klienta i bezpośrednią wymianą SDP WebRTC w przeglądarce z
    OpenAI Realtime API. Weryfikacja na żywo dla maintainerów jest dostępna przez
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    odnoga OpenAI generuje sekret klienta w Node, tworzy ofertę SDP przeglądarki
    z fałszywymi mediami mikrofonu, wysyła ją do OpenAI i stosuje odpowiedź SDP
    bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpointy Azure OpenAI

Dołączony dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie bazowego URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądania Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie zależy od `models.providers.openai.baseUrl`. Zobacz akordeon **Głos w czasie rzeczywistym**
w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia
Azure.
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję Azure OpenAI, limit lub umowę enterprise
- Potrzebujesz regionalnej rezydencji danych albo mechanizmów zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch wewnątrz istniejącego tenanta Azure

### Konfiguracja

W przypadku generowania obrazów Azure przez dołączonego dostawcę `openai` skieruj
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
kształt żądania obrazów OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny endpoint OpenAI i nie zadziałają z wdrożeniami
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wartością domyślną jest `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
routowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów routowanych przez
dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w części regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Sprawdź aktualną listę regionów Microsoftu przed utworzeniem
wdrożenia i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, które dopuszcza publiczne OpenAI (na przykład niektóre
wartości `background` w `gpt-image-2`), albo udostępniać je tylko w określonych wersjach
modelu. Te różnice pochodzą z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure kończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne vs zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu chat lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu onboardingu albo dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie wybiera kształtu API/autoryzacji Azure. Istnieje osobny dostawca
`azure-openai-responses/*`; zobacz akordeon dotyczący server-side compaction poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa podejścia WebSocket-first z fallbackiem SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem fallbackiem na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas okresu wyciszenia
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
    - [Odpowiedzi Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

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

    - **Chat/UI:** `/fast status|on|off`
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
    `serviceTier` jest przekazywane tylko do natywnych endpointów OpenAI (`api.openai.com`) i natywnych endpointów Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia Pi-harness Plugin OpenAI automatycznie włącza server-side compaction:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślne `compact_threshold`: 70% `contextWindow` (albo `80000`, gdy niedostępne)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany osobno za pomocą `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Włącz jawnie">
        Przydatne dla zgodnych endpointów, takich jak Azure OpenAI Responses:

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
    `responsesServerCompaction` steruje tylko wstrzykiwaniem `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawi `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Ścisły tryb agentyczny GPT">
    Dla uruchomień z rodziny GPT-5 w `openai/*` OpenClaw może używać ściślejszego osadzonego kontraktu wykonania:

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
    - Ponawia turę ze wskazówką nakazującą działanie teraz
    - Automatycznie włącza `update_plan` dla istotnych prac
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień OpenAI i Codex z rodziny GPT-5. Inni dostawcy i starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących poziom wysiłku OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych hostach natywnych
    - Zachowują kształtowanie żądań wyłącznie dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają Completions `store` z nienatywnych ładunków `openai-completions`
    - Akceptują przekazywany dalej JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko dla tras natywnych

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
