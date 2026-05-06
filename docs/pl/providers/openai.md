---
read_when:
    - Chcesz korzystać z modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania przez subskrypcję Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego sposobu wykonywania zadań przez agentów GPT-5
summary: Korzystaj z OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-06T09:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5606cafb8dfec888b922874202aa0fdcad8cbd4fec1a1e15a9074ad14bc5486
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia deweloperskie API dla modeli GPT, a Codex jest także dostępny jako agent programistyczny w planie ChatGPT przez klientów Codex firmy OpenAI. OpenClaw utrzymuje te powierzchnie osobno, aby konfiguracja pozostała przewidywalna.

OpenClaw obsługuje trzy trasy z rodziny OpenAI. Większość subskrybentów ChatGPT/Codex, którzy chcą zachowania Codex, powinna używać natywnego środowiska uruchomieniowego serwera aplikacji Codex. Prefiks modelu wybiera dostawcę/nazwę modelu; osobne ustawienie środowiska uruchomieniowego wybiera, kto wykonuje osadzoną pętlę agenta:

- **Klucz API** - bezpośredni dostęp do OpenAI Platform z rozliczaniem według użycia (modele `openai/*`)
- **Subskrypcja Codex z natywnym środowiskiem uruchomieniowym Codex** - logowanie ChatGPT/Codex oraz wykonywanie przez serwer aplikacji Codex (modele `openai/*` plus `agents.defaults.agentRuntime.id: "codex"`)
- **Subskrypcja Codex przez PI** - logowanie ChatGPT/Codex ze standardowym runnerem OpenClaw PI (modele `openai-codex/*`)

OpenAI jawnie obsługuje użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i przepływach pracy takich jak OpenClaw.

Dostawca, model, środowisko uruchomieniowe i kanał to osobne warstwy. Jeśli te etykiety zaczynają się mieszać, przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) przed zmianą konfiguracji.

## Szybki wybór

| Cel                                                  | Użyj                                             | Uwagi                                                                     |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-5.5` plus `agentRuntime.id: "codex"` | Zalecana konfiguracja Codex dla większości użytkowników. Zaloguj się uwierzytelnianiem `openai-codex`. |
| Bezpośrednie rozliczanie kluczem API                 | `openai/gpt-5.5`                                 | Ustaw `OPENAI_API_KEY` albo uruchom onboarding klucza API OpenAI.                    |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez PI  | `openai-codex/gpt-5.5`                           | Używaj tylko wtedy, gdy celowo chcesz standardowego runnera PI.                |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                             | Działa zarówno z `OPENAI_API_KEY`, jak i OpenAI Codex OAuth.                 |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                           | Użyj `outputFormat=png` albo `webp` oraz `openai.background=transparent`.     |

## Mapa nazewnictwa

Nazwy są podobne, ale nie są wymienne:

| Nazwa, którą widzisz                | Warstwa           | Znaczenie                                                                                         |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | Prefiks dostawcy  | Bezpośrednia trasa API OpenAI Platform.                                                           |
| `openai-codex`                     | Prefiks dostawcy  | Trasa OpenAI Codex OAuth/subskrypcji przez standardowego runnera OpenClaw PI.                      |
| Plugin `codex`                     | Plugin            | Wbudowany Plugin OpenClaw, który zapewnia natywne środowisko uruchomieniowe serwera aplikacji Codex i kontrolki czatu `/codex`. |
| `agentRuntime.id: codex`           | Środowisko uruchomieniowe agenta | Wymusza natywny harness serwera aplikacji Codex dla osadzonych tur.                                |
| `/codex ...`                       | Zestaw poleceń czatu | Wiąże/kontroluje wątki serwera aplikacji Codex z rozmowy.                                         |
| `runtime: "acp", agentId: "codex"` | Trasa sesji ACP   | Jawna ścieżka awaryjna, która uruchamia Codex przez ACP/acpx.                                      |

Oznacza to, że konfiguracja może celowo zawierać jednocześnie `openai-codex/*` oraz Plugin `codex`. Jest to poprawne, gdy chcesz Codex OAuth przez PI i jednocześnie chcesz mieć dostępne natywne kontrolki czatu `/codex`. `openclaw doctor` ostrzega o tej kombinacji, aby można było potwierdzić, że jest zamierzona; nie przepisuje jej.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API do OpenAI Platform, jak i trasy subskrypcji/OAuth. Dla subskrypcji ChatGPT/Codex plus natywnego wykonywania Codex użyj `openai/gpt-5.5` z `agentRuntime.id: "codex"`. Używaj `openai-codex/gpt-5.5` tylko dla Codex OAuth przez PI albo `openai/gpt-5.5` bez nadpisania środowiska uruchomieniowego Codex dla bezpośredniego ruchu `OPENAI_API_KEY`.
</Note>

<Note>
Włączenie Plugin OpenAI albo wybranie modelu `openai-codex/*` nie włącza wbudowanego Plugin serwera aplikacji Codex. OpenClaw włącza ten Plugin tylko wtedy, gdy jawnie wybierzesz natywny harness Codex za pomocą `agentRuntime.id: "codex"` albo użyjesz starszego odwołania do modelu `codex/*`.
Jeśli wbudowany Plugin `codex` jest włączony, ale `openai-codex/*` nadal rozwiązuje się przez PI, `openclaw doctor` ostrzega i pozostawia trasę bez zmian.
</Note>

## Zakres funkcji OpenClaw

| Możliwość OpenAI         | Powierzchnia OpenClaw                                      | Status                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses          | dostawca modelu `openai/<model>`                           | Tak                                                    |
| Modele subskrypcji Codex  | `openai-codex/<model>` z OAuth `openai-codex`              | Tak                                                    |
| Harness serwera aplikacji Codex | `openai/<model>` z `agentRuntime.id: codex`          | Tak                                                    |
| Wyszukiwanie w internecie po stronie serwera | Natywne narzędzie OpenAI Responses             | Tak, gdy wyszukiwanie w internecie jest włączone i nie przypięto dostawcy |
| Obrazy                    | `image_generate`                                           | Tak                                                    |
| Wideo                     | `video_generate`                                           | Tak                                                    |
| Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts`                  | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie multimediów          | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`        | Tak                                                    |
| Głos w czasie rzeczywistym | Voice Call `realtime.provider: "openai"` / Control UI Talk | Tak                                                    |
| Osadzenia                 | dostawca osadzeń pamięci                                   | Tak                                                    |

## Osadzenia pamięci

OpenClaw może używać OpenAI albo punktu końcowego osadzeń zgodnego z OpenAI do indeksowania `memory_search` i osadzeń zapytań:

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

Dla punktów końcowych zgodnych z OpenAI, które wymagają asymetrycznych etykiet osadzeń, ustaw `queryInputType` i `documentInputType` pod `memorySearch`. OpenClaw przekazuje je jako pola żądania `input_type` specyficzne dla dostawcy: osadzenia zapytań używają `queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają `documentInputType`. Pełny przykład znajdziesz w [dokumentacji konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu API i rozliczania według użycia.

    <Steps>
      <Step title="Pobierz swój klucz API">
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

    | Odwołanie do modelu    | Konfiguracja środowiska uruchomieniowego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | pominięte / `agentRuntime.id: "pi"`    | Bezpośrednie API OpenAI Platform | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`           | Harness serwera aplikacji Codex | Serwer aplikacji Codex |

    <Note>
    `openai/*` to bezpośrednia trasa klucza API OpenAI, chyba że jawnie wymusisz harness serwera aplikacji Codex. Użyj `openai-codex/*` dla Codex OAuth przez domyślnego runnera PI albo użyj `openai/gpt-5.5` z `agentRuntime.id: "codex"` dla natywnego wykonywania przez serwer aplikacji Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania na żywo do OpenAI API odrzucają ten model, a bieżący katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze dla:** użycia subskrypcji ChatGPT/Codex z natywnym wykonywaniem przez serwer aplikacji Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bez interfejsu graficznego albo nieprzyjaznych wywołaniom zwrotnym dodaj `--device-code`, aby zalogować się przepływem kodu urządzenia ChatGPT zamiast wywołania zwrotnego przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Użyj natywnego środowiska uruchomieniowego Codex">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Sprawdź, czy uwierzytelnianie Codex jest dostępne">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Po uruchomieniu gateway wyślij `/codex status` albo `/codex models` na czacie, aby sprawdzić natywne środowisko uruchomieniowe serwera aplikacji.
      </Step>
    </Steps>

    ### Podsumowanie trasy

    | Odwołanie do modelu | Konfiguracja środowiska uruchomieniowego | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Natywny harness serwera aplikacji Codex | Logowanie Codex albo wybrany profil `openai-codex` |
    | `openai-codex/gpt-5.5` | pominięte / `runtime: "pi"` | ChatGPT/Codex OAuth przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.4-mini` | pominięte / `runtime: "pi"` | ChatGPT/Codex OAuth przez PI | Logowanie Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | Nadal PI, chyba że Plugin jawnie zgłasza obsługę `openai-codex` | Logowanie Codex |

    <Warning>
    Nie konfiguruj starszych odwołań do modeli `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ani `openai-codex/gpt-5.3*`. Konta ChatGPT/Codex OAuth obecnie odrzucają te modele. Użyj `openai-codex/gpt-5.5` dla trasy PI OAuth albo `openai/gpt-5.5` z `agentRuntime.id: "codex"` dla natywnego wykonywania w środowisku uruchomieniowym Codex.
    </Warning>

    <Note>
    Nadal używaj identyfikatora providera `openai-codex` dla poleceń auth/profile. Prefiks modelu
    `openai-codex/*` jest też jawną trasą PI dla Codex OAuth.
    Nie wybiera ani nie włącza automatycznie wbudowanej uprzęży app-servera Codex. W przypadku
    typowej konfiguracji z subskrypcją i natywnym środowiskiem wykonawczym zaloguj się za pomocą
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
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    Aby zamiast tego zachować Codex OAuth na zwykłym runnerze PI, użyj
    `openai-codex/gpt-5.5` i pomiń nadpisanie środowiska wykonawczego Codex.

    <Note>
    Onboarding nie importuje już materiału OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez opisany wyżej przepływ z kodem urządzenia — OpenClaw zarządza wynikowymi danymi uwierzytelniającymi we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Wskaźnik stanu

    Chat `/status` pokazuje, które środowisko wykonawcze modelu jest aktywne w bieżącej sesji.
    Domyślna uprząż PI pojawia się jako `Runtime: OpenClaw Pi Default`. Gdy wybrana jest
    wbudowana uprząż app-servera Codex, `/status` pokazuje
    `Runtime: OpenAI Codex`. Istniejące sesje zachowują zapisany identyfikator uprzęży, więc użyj
    `/new` lub `/reset` po zmianie `agentRuntime`, jeśli chcesz, aby `/status`
    odzwierciedlał nowy wybór PI/Codex.

    ### Ostrzeżenie Doctor

    Jeśli wbudowany Plugin `codex` jest włączony, gdy wybrana jest trasa `openai-codex/*`,
    `openclaw doctor` ostrzega, że model nadal jest rozwiązywany przez PI.
    Pozostaw konfigurację bez zmian tylko wtedy, gdy ta trasa uwierzytelniania subskrypcją PI jest
    zamierzona. Przełącz na `openai/<model>` plus `agentRuntime.id: "codex"`, gdy
    chcesz natywnego wykonywania przez app-server Codex.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu środowiska wykonawczego jako oddzielne wartości.

    Dla `openai-codex/gpt-5.5` przez Codex OAuth:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit środowiska wykonawczego `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce zapewnia lepsze charakterystyki opóźnienia i jakości. Nadpisz go za pomocą `contextTokens`:

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
    Użyj `contextWindow`, aby zadeklarować natywne metadane modelu. Użyj `contextTokens`, aby ograniczyć budżet kontekstu środowiska wykonawczego.
    </Note>

    ### Odzyskiwanie katalogu

    OpenClaw używa metadanych katalogu upstream Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie Codex na żywo pominie wiersz `openai-codex/gpt-5.5`, gdy
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, subagenta i skonfigurowanego modelu domyślnego nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie app-servera Codex

Natywna uprząż app-servera Codex używa referencji modelu `openai/*` oraz
`agentRuntime.id: "codex"`, ale jej uwierzytelnianie nadal jest oparte na koncie. OpenClaw
wybiera uwierzytelnianie w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw `openai-codex` powiązany z agentem.
2. Istniejące konto app-servera, takie jak lokalne logowanie ChatGPT w Codex CLI.
3. Tylko dla lokalnych uruchomień app-servera przez stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy app-server zgłasza brak konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcyjne ChatGPT/Codex nie jest zastępowane tylko
dlatego, że proces gateway ma też `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI
lub embeddingów. Awaryjne użycie klucza API z env dotyczy tylko lokalnej ścieżki stdio bez konta; nie
jest wysyłane do połączeń WebSocket app-servera. Gdy wybrany jest profil Codex
w stylu subskrypcyjnym, OpenClaw również wyklucza `CODEX_API_KEY` i `OPENAI_API_KEY`
z potomnego procesu stdio app-servera i wysyła wybrane dane uwierzytelniające
przez RPC logowania app-servera.

## Generowanie obrazów

Wbudowany Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów z kluczem API OpenAI, jak i generowanie obrazów
przez Codex OAuth przy użyciu tej samej referencji modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                    | Codex OAuth                          |
| ------------------------ | ----------------------------------- | ------------------------------------ |
| Referencja modelu        | `openai/gpt-image-2`                | `openai/gpt-image-2`                 |
| Uwierzytelnianie         | `OPENAI_API_KEY`                    | Logowanie OpenAI Codex OAuth         |
| Transport                | OpenAI Images API                   | Backend Codex Responses              |
| Maks. liczba obrazów na żądanie | 4                            | 4                                    |
| Tryb edycji              | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru      | Obsługiwane, w tym rozmiary 2K/4K   | Obsługiwane, w tym rozmiary 2K/4K    |
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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzi, wybór providera i zachowanie failover.
</Note>

`gpt-image-2` jest wartością domyślną zarówno dla generowania obrazów z tekstu OpenAI, jak i edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają dostępne jako
jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyników
PNG/WebP z przezroczystym tłem; obecne API `gpt-image-2` odrzuca
`background: "transparent"`.

W przypadku żądania z przezroczystym tłem agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` albo `"webp"` oraz
`background: "transparent"`; starsza opcja providera `openai.background` jest
nadal akceptowana. OpenClaw chroni też publiczne trasy OpenAI i
OpenAI Codex OAuth, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe endpointy zgodne z OpenAI zachowują
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

W instalacjach Codex OAuth zachowaj tę samą referencję `openai/gpt-image-2`. Gdy skonfigurowany jest
profil OAuth `openai-codex`, OpenClaw rozwiązuje ten zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw
`OPENAI_API_KEY` ani nie przełącza się po cichu na klucz API dla tego
żądania. Skonfiguruj jawnie `models.providers.openai` z kluczem API,
niestandardowym bazowym adresem URL albo endpointem Azure, gdy chcesz zamiast tego użyć bezpośredniej trasy OpenAI Images API.
Jeśli ten niestandardowy endpoint obrazów znajduje się w zaufanej sieci LAN lub pod adresem prywatnym, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw nadal blokuje
prywatne/wewnętrzne endpointy obrazów zgodne z OpenAI, chyba że ta zgoda jest
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

Wbudowany Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość          | Wartość                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| Model domyślny     | `openai/sora-2`                                                                   |
| Tryby              | Tekst-na-wideo, obraz-na-wideo, edycja pojedynczego wideo                         |
| Dane referencyjne  | 1 obraz albo 1 wideo                                                              |
| Nadpisania rozmiaru | Obsługiwane                                                                       |
| Inne nadpisania    | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzi, wybór providera i zachowanie failover.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje wspólny wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 u różnych providerów. Ma zastosowanie według identyfikatora modelu, więc `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne referencje GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Wbudowana natywna uprząż Codex używa tego samego zachowania GPT-5 i nakładki heartbeat przez instrukcje deweloperskie app-servera Codex, więc sesje `openai/gpt-5.x` wymuszone przez `agentRuntime.id: "codex"` zachowują te same wskazówki dotyczące doprowadzania działań do końca i proaktywnego Heartbeat, mimo że Codex jest właścicielem reszty promptu uprzęży.

Wkład GPT-5 dodaje otagowany kontrakt zachowania dotyczący trwałości persony, bezpieczeństwa wykonania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału i cichych wiadomości pozostaje we wspólnym prompcie systemowym OpenClaw i polityce dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Przyjazna warstwa stylu interakcji jest oddzielna i konfigurowalna.

| Wartość                | Efekt                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (domyślnie) | Włącza przyjazną warstwę stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                     |
| `"off"`                | Wyłącza tylko przyjazną warstwę stylu      |

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
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako awaryjna zgodność, gdy wspólne ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Wbudowany Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | W razie braku używa `OPENAI_API_KEY` |
    | Bazowy adres URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Dodatkowa treść żądania | `messages.tts.providers.openai.extraBody` / `extra_body` | (nieustawione) |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z JSON żądania `/audio/speech` po polach wygenerowanych przez OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypowe są ignorowane.

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby zastąpić bazowy adres URL TTS bez wpływu na punkt końcowy API czatu.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    Dołączony Plugin `openai` rejestruje wsadową zamianę mowy na tekst przez
    powierzchnię transkrypcji rozumienia multimediów OpenClaw.

    - Domyślny model: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio jako multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmenty kanałów głosowych Discord i załączniki
      audio w kanałach

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy podano je w
    współdzielonej konfiguracji multimediów audio lub w żądaniu transkrypcji dla danego wywołania.

  </Accordion>

  <Accordion title="Realtime transcription">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | W razie braku używa `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki transkrypcji wsadowej `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | W razie braku używa `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment` dla backendowych mostów czasu rzeczywistego. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk używa sesji OpenAI w czasie rzeczywistym w przeglądarce z efemerycznym
    sekretem klienta wybitym przez Gateway i bezpośrednią wymianą WebRTC SDP w przeglądarce z
    OpenAI Realtime API. Weryfikacja na żywo przez maintainera jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    odnoga OpenAI wybija sekret klienta w Node, generuje ofertę SDP przeglądarki
    z fałszywym medium mikrofonu, wysyła ją do OpenAI i stosuje odpowiedź SDP
    bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez zastąpienie bazowego adresu URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie
przełącza się na kształt żądań Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i `models.providers.openai.baseUrl` nie ma na niego wpływu. Zobacz akordeon **Realtime
voice** w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia
Azure.
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę korporacyjną Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub kontroli zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch wewnątrz istniejącej dzierżawy Azure

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

W przypadku żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek o zakresie wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów Azure.
  Wartości `timeoutMs` dla danego wywołania nadal zastępują tę wartość domyślną.

Inne bazowe adresy URL (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazu OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` tak jak publiczny punkt końcowy OpenAI i nie zadziałają z wdrożeniami
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wartość domyślna to `2024-12-01-preview`, gdy zmienna jest nieustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. W przypadku żądań generowania obrazów Azure
kierowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów kierowanych przez
dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w podzbiorze regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Sprawdź aktualną listę regionów Microsoft przed utworzeniem
wdrożenia i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazu.
Azure może odrzucać opcje, na które publiczne OpenAI pozwala (na przykład pewne
wartości `background` w `gpt-image-2`), lub udostępniać je tylko w konkretnych wersjach
modelu. Te różnice pochodzą z Azure i modelu bazowego, a nie z
OpenClaw. Jeśli żądanie Azure nie powiedzie się z błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania kompatybilności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Native vs OpenAI-compatible
routes** w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu onboardingu albo dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie wybiera kształtu API/uwierzytelniania Azure. Istnieje osobny
dostawca `azure-openai-responses/*`; zobacz
akordeon Compaction po stronie serwera poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa najpierw WebSocket z awaryjnym przełączeniem na SSE (`"auto"`) zarówno dla `openai/*`, jak i `openai-codex/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przełączeniem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE w czasie schładzania
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
    - [Strumieniowe odpowiedzi API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket warm-up">
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

  <Accordion title="Fast mode">
    OpenClaw udostępnia współdzielony przełącznik trybu szybkiego dla `openai/*` i `openai-codex/*`:

    - **Czat/UI:** `/fast status|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na priorytetowe przetwarzanie OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`.

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

  <Accordion title="Priority processing (service_tier)">
    API OpenAI udostępnia priorytetowe przetwarzanie przez `service_tier`. Ustaw je dla każdego modelu w OpenClaw:

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
    `serviceTier` jest przekazywany tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz dowolnego z tych providerów przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Server-side compaction (Responses API)">
    W przypadku bezpośrednich modeli OpenAI Responses (`openai/*` w `api.openai.com`) wrapper strumienia Pi-harness Pluginu OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślne `compact_threshold`: 70% wartości `contextWindow` (lub `80000`, gdy jest niedostępna)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków providera OpenAI używanych przez osadzone uruchomienia. Natywny app-server harness Codex zarządza własnym kontekstem przez Codex i jest konfigurowany osobno za pomocą `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="Enable explicitly">
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
      <Tab title="Custom threshold">
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
      <Tab title="Disable">
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
    `responsesServerCompaction` steruje tylko wstrzykiwaniem `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT mode">
    W przypadku uruchomień z rodziny GPT-5 w `openai/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonywania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Przy `strict-agentic` OpenClaw:
    - Nie traktuje już tury zawierającej tylko plan jako udanego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę z naprowadzeniem do natychmiastowego działania
    - Automatycznie włącza `update_plan` dla większych prac
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Zakres ograniczony tylko do uruchomień OpenAI i Codex z rodziny GPT-5. Inni providerzy i starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Native vs OpenAI-compatible routes">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Natywne trasy** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli, które obsługują nakład pracy OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi na tryb ścisły
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań właściwe tylko dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają `store` Completions z nienatywnych payloadów `openai-completions`
    - Akceptują przekazywanie JSON zaawansowanego `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko dla natywnych tras

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Model selection" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, referencji modeli i działania przełączania awaryjnego.
  </Card>
  <Card title="Image generation" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór providera.
  </Card>
  <Card title="Video generation" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="OAuth and auth" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
