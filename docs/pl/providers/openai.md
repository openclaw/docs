---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego sposobu wykonywania zadań przez agenta GPT-5
summary: Korzystaj z OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia deweloperskie API dla modeli GPT, a Codex jest też dostępny jako
agent programistyczny z planu ChatGPT przez klientów Codex firmy OpenAI. OpenClaw utrzymuje te
powierzchnie osobno, aby konfiguracja pozostawała przewidywalna.

OpenClaw używa `openai/*` jako kanonicznej trasy modelu OpenAI. Osadzone tury agentów
w modelach OpenAI domyślnie działają przez natywne środowisko uruchomieniowe serwera aplikacji Codex;
bezpośrednie uwierzytelnianie kluczem API OpenAI pozostaje dostępne dla nieagentowych
powierzchni OpenAI, takich jak obrazy, embeddingi, mowa i realtime.

- **Modele agentów** - modele `openai/*` przez środowisko uruchomieniowe Codex; zaloguj się za pomocą
  uwierzytelniania `openai-codex`, aby używać subskrypcji ChatGPT/Codex, albo skonfiguruj
  profil klucza API `openai-codex`, gdy celowo chcesz używać uwierzytelniania kluczem API.
- **Nieagentowe API OpenAI** - bezpośredni dostęp do OpenAI Platform z rozliczaniem
  według użycia przez `OPENAI_API_KEY` lub onboarding klucza API OpenAI.
- **Starsza konfiguracja** - referencje modeli `openai-codex/*` są naprawiane przez
  `openclaw doctor --fix` do `openai/*` plus środowiska uruchomieniowego Codex.

OpenAI jawnie obsługuje użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i przepływach pracy, takich jak OpenClaw.

Dostawca, model, środowisko uruchomieniowe i kanał to osobne warstwy. Jeśli te etykiety
zaczynają się mieszać, przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) przed
zmianą konfiguracji.

## Szybki wybór

| Cel                                                  | Użyj                                                    | Uwagi                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem Codex | `openai/gpt-5.5`                                        | Domyślna konfiguracja agenta OpenAI. Zaloguj się uwierzytelnianiem `openai-codex`. |
| Bezpośrednie rozliczanie kluczem API dla modeli agentów | `openai/gpt-5.5` plus profil klucza API `openai-codex` | Użyj `auth.order.openai-codex`, aby preferować ten profil.             |
| Bezpośrednie rozliczanie kluczem API przez jawne PI  | `openai/gpt-5.5` plus środowisko uruchomieniowe dostawcy/modelu `pi` | Wybierz zwykły profil klucza API `openai`.                             |
| Najnowszy alias API ChatGPT Instant                  | `openai/chat-latest`                                    | Tylko bezpośredni klucz API. Ruchomy alias do eksperymentów, nie domyślny. |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez jawne PI | `openai/gpt-5.5` plus środowisko uruchomieniowe dostawcy/modelu `pi` | Wybierz profil uwierzytelniania `openai-codex` dla trasy zgodności.    |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                                    | Działa z `OPENAI_API_KEY` albo OpenAI Codex OAuth.                     |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                                  | Użyj `outputFormat=png` albo `webp` oraz `openai.background=transparent`. |

## Mapa nazw

Nazwy są podobne, ale nie są wymienne:

| Widoczna nazwa                          | Warstwa             | Znaczenie                                                                                         |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks dostawcy    | Kanoniczna trasa modelu OpenAI; tury agentów używają środowiska uruchomieniowego Codex.           |
| `openai-codex`                          | Prefiks uwierzytelniania/profilu | Dostawca profilu uwierzytelniania OpenAI Codex OAuth/subskrypcji.                                |
| Plugin `codex`                          | Plugin              | Dołączony Plugin OpenClaw, który zapewnia natywne środowisko serwera aplikacji Codex i kontrolki czatu `/codex`. |
| provider/model `agentRuntime.id: codex` | Środowisko uruchomieniowe agenta | Wymusza natywny harness serwera aplikacji Codex dla pasujących osadzonych tur.                    |
| `/codex ...`                            | Zestaw poleceń czatu | Powiązanie/kontrolowanie wątków serwera aplikacji Codex z poziomu rozmowy.                        |
| `runtime: "acp", agentId: "codex"`      | Trasa sesji ACP     | Jawna ścieżka awaryjna uruchamiająca Codex przez ACP/acpx.                                        |

Oznacza to, że konfiguracja może celowo zawierać zarówno referencje modeli `openai/*`,
jak i profile uwierzytelniania `openai-codex`. `openclaw doctor --fix` przepisuje starsze
referencje modeli `openai-codex/*` na kanoniczną trasę modelu OpenAI.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API OpenAI Platform, jak i
trasy subskrypcji/OAuth. Dla subskrypcji ChatGPT/Codex plus natywnego wykonywania Codex
użyj `openai/gpt-5.5`; brak konfiguracji środowiska uruchomieniowego wybiera teraz harness Codex
dla tur agentów OpenAI. Używaj profili klucza API OpenAI tylko wtedy, gdy chcesz
bezpośredniego uwierzytelniania kluczem API dla modelu agenta OpenAI.
</Note>

<Note>
Tury modeli agentów OpenAI wymagają dołączonego pluginu serwera aplikacji Codex. Jawna
konfiguracja środowiska PI pozostaje dostępna jako opcjonalna trasa zgodności. Gdy PI jest
jawnie wybrane z profilem uwierzytelniania `openai-codex`, OpenClaw utrzymuje
publiczną referencję modelu jako `openai/*` i wewnętrznie kieruje PI przez starszy
transport uwierzytelniania Codex. Uruchom `openclaw doctor --fix`, aby naprawić nieaktualne
referencje modeli `openai-codex/*` lub stare przypięcia sesji PI, które nie pochodzą z
jawnej konfiguracji środowiska uruchomieniowego.
</Note>

## Pokrycie funkcji OpenClaw

| Możliwość OpenAI        | Powierzchnia OpenClaw                                                             | Status                                                 |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses        | dostawca modelu `openai/<model>`                                                  | Tak                                                    |
| Modele subskrypcyjne Codex | `openai/<model>` z OAuth `openai-codex`                                        | Tak                                                    |
| Starsze referencje modeli Codex | `openai-codex/<model>`                                                   | Naprawiane przez doctor do `openai/<model>`            |
| Harness serwera aplikacji Codex | `openai/<model>` z pominiętym środowiskiem uruchomieniowym albo provider/model `agentRuntime.id: codex` | Tak                                                    |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses                                  | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
| Obrazy                  | `image_generate`                                                                 | Tak                                                    |
| Filmy                   | `video_generate`                                                                 | Tak                                                    |
| Zamiana tekstu na mowę  | `messages.tts.provider: "openai"` / `tts`                                        | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie mediów                                    | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`                                | Tak                                                    |
| Głos realtime           | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Tak                                                    |
| Embeddingi              | dostawca embeddingów pamięci                                                     | Tak                                                    |

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

Dla punktów końcowych zgodnych z OpenAI, które wymagają asymetrycznych etykiet embeddingów, ustaw
`queryInputType` i `documentInputType` pod `memorySearch`. OpenClaw przekazuje
je jako specyficzne dla dostawcy pola żądania `input_type`: embeddingi zapytań używają
`queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Pełny przykład znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu przez API i rozliczania według użycia.

    <Steps>
      <Step title="Get your API key">
        Utwórz albo skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Albo przekaż klucz bezpośrednio:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Referencja modelu      | Konfiguracja środowiska uruchomieniowego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | ---------------------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | pominięte / provider/model `agentRuntime.id: "codex"` | Harness serwera aplikacji Codex | profil `openai-codex` |
    | `openai/gpt-5.4-mini` | pominięte / provider/model `agentRuntime.id: "codex"` | Harness serwera aplikacji Codex | profil `openai-codex` |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | Osadzone środowisko PI      | profil `openai` albo wybrany profil `openai-codex` |

    <Note>
    Modele agentów `openai/*` używają harnessu serwera aplikacji Codex. Aby użyć uwierzytelniania
    kluczem API dla modelu agenta, utwórz profil klucza API `openai-codex` i uporządkuj
    go za pomocą `auth.order.openai-codex`; `OPENAI_API_KEY` pozostaje bezpośrednią
    ścieżką awaryjną dla nieagentowych powierzchni API OpenAI.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Aby wypróbować bieżący model Instant z ChatGPT przez API OpenAI, ustaw model
    na `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` to ruchomy alias. OpenAI dokumentuje go jako najnowszy model Instant
    używany w ChatGPT i zaleca `gpt-5.5` do produkcyjnego użycia API, więc
    zachowaj `openai/gpt-5.5` jako stabilną wartość domyślną, chyba że jawnie chcesz
    zachowania tego aliasu. Alias obecnie akceptuje tylko `medium` dla szczegółowości tekstu, więc
    OpenClaw normalizuje niezgodne nadpisania szczegółowości tekstu OpenAI dla tego
    modelu.

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania na żywo do API OpenAI odrzucają ten model, a bieżący katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex z natywnym wykonywaniem serwera aplikacji Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bez interfejsu graficznego lub nieprzyjaznych callbackom dodaj `--device-code`, aby zalogować się przepływem kodu urządzenia ChatGPT zamiast callbacka przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Użyj kanonicznej trasy modelu OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Dla domyślnej ścieżki nie jest wymagana żadna konfiguracja runtime.
        Tury agenta OpenAI automatycznie wybierają natywny runtime serwera aplikacji
        Codex, a OpenClaw instaluje lub naprawia dołączony Plugin Codex, gdy wybrano
        tę trasę.
      </Step>
      <Step title="Sprawdź, czy uwierzytelnianie Codex jest dostępne">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Po uruchomieniu gateway wyślij na czacie `/codex status` lub `/codex models`,
        aby zweryfikować natywny runtime serwera aplikacji.
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Odwołanie do modelu | Konfiguracja runtime | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | pominięte / provider/model `agentRuntime.id: "codex"` | Natywny harness serwera aplikacji Codex | Logowanie Codex lub wybrany profil `openai-codex` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Osadzony runtime PI z wewnętrznym transportem uwierzytelniania Codex | Wybrany profil `openai-codex` |
    | `openai-codex/gpt-5.5` | naprawiane przez doctor | Starsza trasa przepisana na `openai/gpt-5.5` | Istniejący profil `openai-codex` |

    <Warning>
    Nie konfiguruj starszych odwołań do modeli `openai-codex/gpt-5.1*`,
    `openai-codex/gpt-5.2*` ani `openai-codex/gpt-5.3*`. Konta OAuth
    ChatGPT/Codex odrzucają teraz te modele. Użyj `openai/gpt-5.5`; tury agenta
    OpenAI wybierają teraz domyślnie runtime Codex.
    </Warning>

    <Note>
    Nadal używaj identyfikatora providera `openai-codex` dla poleceń
    uwierzytelniania/profili. Prefiks modelu `openai-codex/*` to starsza
    konfiguracja naprawiana przez doctor. Dla typowej konfiguracji subskrypcji
    oraz natywnego runtime zaloguj się przez `openai-codex`, ale pozostaw
    odwołanie do modelu jako `openai/gpt-5.5`.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    Onboarding nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez powyższy przepływ z kodem urządzenia — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Sprawdzanie i odzyskiwanie trasowania OAuth Codex

    Użyj tych poleceń, aby zobaczyć, którego modelu, runtime i trasy
    uwierzytelniania używa domyślny agent:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Dla konkretnego agenta dodaj `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Jeśli starsza konfiguracja nadal ma `openai-codex/gpt-*` albo nieaktualne
    przypięcie sesji OpenAI PI bez jawnej konfiguracji runtime, napraw ją:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jeśli `models auth list --provider openai-codex` nie pokazuje użytecznego
    profilu, zaloguj się ponownie:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` pozostaje identyfikatorem providera uwierzytelniania/profili.
    `openai/*` to trasa modelu dla tur agenta OpenAI przez Codex.

    ### Wskaźnik statusu

    Czatowe `/status` pokazuje, który runtime modelu jest aktywny dla bieżącej
    sesji. Dołączony harness serwera aplikacji Codex pojawia się jako
    `Runtime: OpenAI Codex` dla tur modeli agenta OpenAI. Nieaktualne przypięcia
    sesji PI są naprawiane do Codex, chyba że konfiguracja jawnie przypina PI.

    ### Ostrzeżenie doctor

    Jeśli trasy `openai-codex/*` lub nieaktualne przypięcia OpenAI PI pozostają
    w konfiguracji albo stanie sesji, `openclaw doctor --fix` przepisuje je na
    `openai/*` z runtime Codex, chyba że PI jest jawnie skonfigurowane.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako oddzielne wartości.

    Dla `openai/gpt-5.5` przez katalog OAuth Codex:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit zapewnia w praktyce lepsze opóźnienia i charakterystykę jakości. Nadpisz go za pomocą `contextTokens`:

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

    OpenClaw używa metadanych upstreamowego katalogu Codex dla `gpt-5.5`, gdy są
    dostępne. Jeśli wykrywanie Codex na żywo pomija wiersz `gpt-5.5`, gdy konto
    jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia Cron, podagentów i skonfigurowanego modelu domyślnego nie kończyły
    się błędem `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie serwera aplikacji Codex

Natywny harness serwera aplikacji Codex używa odwołań do modeli `openai/*` oraz
pominiętej konfiguracji runtime albo `agentRuntime.id: "codex"` na poziomie
providera/modelu, ale jego uwierzytelnianie nadal jest oparte na koncie. OpenClaw
wybiera uwierzytelnianie w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw `openai-codex` powiązany z agentem.
2. Istniejące konto serwera aplikacji, takie jak lokalne logowanie Codex CLI ChatGPT.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy serwer aplikacji nie zgłasza konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcyjne ChatGPT/Codex nie jest zastępowane
tylko dlatego, że proces gateway ma także `OPENAI_API_KEY` dla bezpośrednich
modeli OpenAI lub embeddingów. Zapasowe użycie klucza API z env dotyczy tylko
lokalnej ścieżki stdio bez konta; nie jest wysyłane do połączeń WebSocket
serwera aplikacji. Gdy wybrany jest profil Codex w stylu subskrypcyjnym, OpenClaw
także usuwa `CODEX_API_KEY` i `OPENAI_API_KEY` z potomnego procesu stdio serwera
aplikacji i wysyła wybrane poświadczenia przez RPC logowania serwera aplikacji.

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów z kluczem API OpenAI, jak i generowanie
obrazów przez OAuth Codex przy użyciu tego samego odwołania do modelu `openai/gpt-image-2`.

| Możliwość                 | Klucz API OpenAI                  | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odwołanie do modelu       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie          | `OPENAI_API_KEY`                   | Logowanie OAuth OpenAI Codex         |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Maks. liczba obrazów na żądanie | 4                            | 4                                    |
| Tryb edycji               | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych) |
| Nadpisania rozmiaru       | Obsługiwane, w tym rozmiary 2K/4K  | Obsługiwane, w tym rozmiary 2K/4K    |
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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór providera i zachowanie failover.
</Note>

`gpt-image-2` jest domyślny zarówno dla generowania obrazów z tekstu przez OpenAI,
jak i edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają
użyteczne jako jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia
PNG/WebP z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca
`background: "transparent"`.

Dla żądania przezroczystego tła agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` albo `"webp"` oraz
`background: "transparent"`; starsza opcja providera `openai.background` nadal
jest akceptowana. OpenClaw chroni także publiczne trasy OpenAI i OAuth OpenAI
Codex, przepisując domyślne żądania przezroczystości `openai/gpt-image-2` na
`gpt-image-1.5`; Azure i niestandardowe endpointy zgodne z OpenAI zachowują
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

Dla instalacji OAuth Codex zachowaj to samo odwołanie `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje ten zapisany
token dostępu OAuth i wysyła żądania obrazów przez backend Codex Responses. Nie
próbuje najpierw `OPENAI_API_KEY` ani po cichu nie wraca do klucza API dla tego
żądania. Skonfiguruj jawnie `models.providers.openai` z kluczem API,
niestandardowym bazowym adresem URL lub endpointem Azure, gdy chcesz używać
bezpośredniej trasy OpenAI Images API.
Jeśli ten niestandardowy endpoint obrazów znajduje się w zaufanej sieci LAN/adresie prywatnym, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw blokuje
prywatne/wewnętrzne endpointy obrazów zgodne z OpenAI, chyba że ta zgoda jest
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

Dołączony Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość       | Wartość                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Tekst-na-wideo, obraz-na-wideo, edycja pojedynczego wideo                         |
| Wejścia referencyjne | 1 obraz lub 1 wideo                                                           |
| Nadpisania rozmiaru | Obsługiwane                                                                    |
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór providera i zachowanie failover.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje wspólny wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 u różnych providerów. Jest stosowany według identyfikatora modelu, więc `openai/gpt-5.5`, starsze odwołania sprzed naprawy, takie jak `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne odwołania GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny harness Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje developerskie serwera aplikacji Codex, więc sesje `openai/gpt-5.x` trasowane przez Codex zachowują te same wskazówki dotyczące doprowadzania działań do końca i proaktywnego Heartbeat, mimo że Codex jest właścicielem reszty promptu harnessu.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu danych wyjściowych, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału oraz zachowanie cichych wiadomości pozostaje we współdzielonym prompcie systemowym OpenClaw i zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Przyjazna warstwa stylu interakcji jest osobna i konfigurowalna.

| Wartość                | Efekt                                      |
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
Wartości nie rozróżniają wielkości liter w czasie działania, więc zarówno `"Off"`, jak i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako rezerwowe ustawienie zgodności, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Wbudowany plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.voice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Wraca do `OPENAI_API_KEY` |
    | Bazowy URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Dodatkowe ciało | `messages.tts.providers.openai.extraBody` / `extra_body` | (nieustawione) |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z JSON-em żądania `/audio/speech` po polach wygenerowanych przez OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypu są ignorowane.

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy API czatu. OpenAI TTS nadal jest konfigurowane przez klucz API; dla odpowiedzi głosowej na żywo wyłącznie przez OAuth użyj ścieżki głosu Realtime zamiast mowy STT -> TTS w trybie agenta.
    </Note>

  </Accordion>

  <Accordion title="Mowa na tekst">
    Wbudowany plugin `openai` rejestruje wsadową transkrypcję mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie wieloczęściowego pliku audio
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

    Wskazówki języka i promptu są przekazywane do OpenAI, gdy dostarczy je
    współdzielona konfiguracja mediów audio lub żądanie transkrypcji dla danego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja Realtime">
    Wbudowany plugin `openai` rejestruje transkrypcję Realtime dla pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, lub OAuth `openai-codex` | Klucze API łączą się bezpośrednio; OAuth wystawia sekret klienta transkrypcji Realtime |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Gdy skonfigurowany jest tylko OAuth `openai-codex`, Gateway wystawia efemeryczny sekret klienta transkrypcji Realtime przed otwarciem WebSocket. Ten dostawca strumieniowy jest przeznaczony dla ścieżki transkrypcji Realtime pluginu Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos Realtime">
    Wbudowany plugin `openai` rejestruje głos Realtime dla pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura (most wdrożenia Azure) | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas ciszy | `...openai.silenceDurationMs` | `500` |
    | Dopełnienie prefiksu | `...openai.prefixPaddingMs` | `300` |
    | Nakład rozumowania | `...openai.reasoningEffort` | (nieustawione) |
    | Auth | `...openai.apiKey`, `OPENAI_API_KEY`, lub OAuth `openai-codex` | Browser Talk i mosty backendu inne niż Azure mogą używać OAuth Codex |

    Dostępne wbudowane głosy Realtime dla `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI zaleca `marin` i `cedar` dla najlepszej jakości Realtime. Jest to
    osobny zestaw względem powyższych głosów Text-to-speech; nie zakładaj, że głos TTS
    taki jak `fable`, `nova` lub `onyx` jest poprawny dla sesji Realtime.

    <Note>
    Backendowe mosty OpenAI realtime używają kształtu sesji GA Realtime WebSocket, który nie akceptuje `session.temperature`. Wdrożenia Azure OpenAI pozostają dostępne przez `azureEndpoint` i `azureDeployment` oraz zachowują kształt sesji zgodny z wdrożeniem. Obsługuje dwukierunkowe wywoływanie narzędzi i dźwięk G.711 u-law.
    </Note>

    <Note>
    Głos Realtime jest wybierany podczas tworzenia sesji. OpenAI pozwala później
    zmieniać większość pól sesji, ale głosu nie można zmienić po tym, jak
    model wyemituje audio w tej sesji. OpenClaw obecnie eksponuje
    wbudowane identyfikatory głosów Realtime jako ciągi znaków.
    </Note>

    <Note>
    Control UI Talk używa przeglądarkowych sesji realtime OpenAI z efemerycznym
    sekretem klienta wystawionym przez Gateway i bezpośrednią wymianą WebRTC SDP w przeglądarce z
    OpenAI Realtime API. Gdy nie skonfigurowano bezpośredniego klucza API OpenAI,
    Gateway może wystawić ten sekret klienta z wybranym profilem OAuth
    `openai-codex`. Przekaźnik Gateway i backendowe mosty realtime WebSocket
    Voice Call używają tego samego rezerwowego OAuth dla natywnych punktów końcowych OpenAI. Weryfikacja
    na żywo dla maintainerów jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    odcinki OpenAI weryfikują zarówno backendowy most WebSocket, jak i przeglądarkową
    wymianę WebRTC SDP bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Wbudowany dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie bazowego URL-a. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza na
kształt żądania Azure.

<Note>
Głos Realtime używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie wpływa na niego `models.providers.openai.baseUrl`. Zobacz akordeon **Głos
Realtime** w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia
Azure.
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję Azure OpenAI, limit lub umowę enterprise
- Potrzebujesz regionalnej rezydencji danych lub kontroli zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch wewnątrz istniejącego dzierżawcy Azure

### Konfiguracja

Dla generowania obrazów Azure przez wbudowanego dostawcę `openai` skieruj
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

Inne bazowe URL-e (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazów OpenAI.

<Note>
Trasowanie Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują dowolny niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i nie zadziałają z wdrożeniami
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA Azure
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślna wartość to `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

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
`uaenorth`). Sprawdź aktualną listę regionów Microsoftu przed utworzeniem
wdrożenia i potwierdź, że konkretny model jest oferowany w twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, które publiczne OpenAI dopuszcza (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko w określonych wersjach
modeli. Te różnice pochodzą z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure nie powiedzie się z błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodnego, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne a zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu chat lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu wdrażania albo dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie uwzględnia kształtu API/uwierzytelniania Azure. Istnieje osobny dostawca
`azure-openai-responses/*`; zobacz akordeon Kompaktowanie po stronie serwera poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket a SSE)">
    OpenClaw używa najpierw WebSocket z awaryjnym przejściem na SSE (`"auto"`) dla `openai/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE w okresie schładzania
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień prób oraz ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, awaryjnie SSE |
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
          },
        },
      },
    }
    ```

    Powiązana dokumentacja OpenAI:
    - [Realtime API z WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Odpowiedzi Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Tryb szybki">
    OpenClaw udostępnia współdzielony przełącznik trybu szybkiego dla `openai/*`:

    - **Chat/UI:** `/fast status|on|off`
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
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions przywraca sesję do skonfigurowanej wartości domyślnej.
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
    `serviceTier` jest przekazywane tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Kompaktowanie po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia Pi-harness Pluginu OpenAI automatycznie włącza kompaktowanie po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy niedostępne)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany przez domyślną trasę agenta OpenAI lub politykę runtime dostawcy/modelu.

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
    Dla uruchomień z rodziny GPT-5 na `openai/*` OpenClaw może używać bardziej rygorystycznego kontraktu osadzonego wykonywania:

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
    - Nie traktuje już tury zawierającej wyłącznie plan jako pomyślnego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę z ukierunkowaniem na natychmiastowe działanie
    - Automatycznie włącza `update_plan` dla większych prac
    - Ujawnia jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień z rodziny GPT-5 w OpenAI i Codex. Inni dostawcy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących nakład `none` OpenAI
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych hostach natywnych
    - Zachowują kształtowanie żądań specyficzne dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki prompt-cache)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają `store` Completions z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowany przekazywany JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
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
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
