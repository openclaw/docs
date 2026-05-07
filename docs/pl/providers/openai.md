---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego sposobu wykonywania zadań przez agentów GPT-5
summary: Korzystanie z OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-05-07T13:24:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a37c0b2c227674b6762aea70ce6d640d49044117c9244377058032ade561d6b
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia API deweloperskie dla modeli GPT, a Codex jest także dostępny jako agent programistyczny w planie ChatGPT przez klientów Codex firmy OpenAI. OpenClaw utrzymuje te powierzchnie oddzielnie, aby konfiguracja pozostała przewidywalna.

OpenClaw używa `openai/*` jako kanonicznej trasy modeli OpenAI. Osadzone tury agentów w modelach OpenAI domyślnie działają przez natywne środowisko wykonawcze app-server Codex; bezpośrednie uwierzytelnianie kluczem API OpenAI pozostaje dostępne dla nieagentowych powierzchni OpenAI, takich jak obrazy, osadzenia, mowa i realtime.

- **Modele agentów** - modele `openai/*` przez środowisko wykonawcze Codex; zaloguj się za pomocą uwierzytelniania `openai-codex`, aby używać subskrypcji ChatGPT/Codex, albo skonfiguruj profil klucza API `openai-codex`, gdy celowo chcesz używać uwierzytelniania kluczem API.
- **Nieagentowe API OpenAI** - bezpośredni dostęp do OpenAI Platform z rozliczaniem według użycia przez `OPENAI_API_KEY` lub konfigurację klucza API OpenAI.
- **Starsza konfiguracja** - odwołania do modeli `openai-codex/*` są naprawiane przez `openclaw doctor --fix` do `openai/*` oraz środowiska wykonawczego Codex.

OpenAI jawnie obsługuje użycie subskrypcji OAuth w zewnętrznych narzędziach i przepływach pracy, takich jak OpenClaw.

Dostawca, model, środowisko wykonawcze i kanał to osobne warstwy. Jeśli te etykiety zaczynają się mieszać, przeczytaj [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes) przed zmianą konfiguracji.

## Szybki wybór

| Cel                                                  | Użyj                                                    | Uwagi                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex | `openai/gpt-5.5`                                        | Domyślna konfiguracja agenta OpenAI. Zaloguj się przez uwierzytelnianie `openai-codex`. |
| Bezpośrednie rozliczanie kluczem API dla modeli agentów | `openai/gpt-5.5` plus profil klucza API `openai-codex` | Użyj `auth.order.openai-codex`, aby preferować ten profil.             |
| Bezpośrednie rozliczanie kluczem API przez jawne PI  | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Wybierz zwykły profil klucza API `openai`.                             |
| Najnowszy alias API ChatGPT Instant                  | `openai/chat-latest`                                    | Tylko bezpośredni klucz API. Ruchomy alias do eksperymentów, nie domyślny. |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez jawne PI | `openai/gpt-5.5` plus `agentRuntime.id: "pi"`           | Wybierz profil uwierzytelniania `openai-codex` dla trasy zgodności.    |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                                    | Działa z `OPENAI_API_KEY` albo OpenAI Codex OAuth.                     |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                                  | Użyj `outputFormat=png` albo `webp` oraz `openai.background=transparent`. |

## Mapa nazewnictwa

Nazwy są podobne, ale nie są wymienne:

| Nazwa, którą widzisz                 | Warstwa             | Znaczenie                                                                                         |
| ------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                             | Prefiks dostawcy    | Kanoniczna trasa modeli OpenAI; tury agentów używają środowiska wykonawczego Codex.               |
| `openai-codex`                       | Prefiks uwierzytelniania/profilu | Dostawca profilu uwierzytelniania OpenAI Codex OAuth/subskrypcji.                                 |
| Plugin `codex`                       | Plugin              | Wbudowany Plugin OpenClaw, który zapewnia natywne środowisko wykonawcze app-server Codex i kontrolki czatu `/codex`. |
| `agentRuntime.id: codex`             | Środowisko wykonawcze agenta | Wymusza natywny mechanizm app-server Codex dla osadzonych tur.                                    |
| `/codex ...`                         | Zestaw poleceń czatu | Powiąż/kontroluj wątki app-server Codex z rozmowy.                                                |
| `runtime: "acp", agentId: "codex"`   | Trasa sesji ACP     | Jawna ścieżka awaryjna, która uruchamia Codex przez ACP/acpx.                                     |

Oznacza to, że konfiguracja może celowo zawierać zarówno odwołania do modeli `openai/*`, jak i profile uwierzytelniania `openai-codex`. `openclaw doctor --fix` przepisuje starsze odwołania do modeli `openai-codex/*` na kanoniczną trasę modeli OpenAI.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API do OpenAI Platform, jak i trasy subskrypcji/OAuth. Aby używać subskrypcji ChatGPT/Codex z natywnym wykonaniem Codex, użyj `openai/gpt-5.5`; brak konfiguracji środowiska wykonawczego wybiera teraz mechanizm Codex dla tur agentów OpenAI. Używaj profili klucza API OpenAI tylko wtedy, gdy chcesz bezpośredniego uwierzytelniania kluczem API dla modelu agenta OpenAI.
</Note>

<Note>
Tury modeli agentów OpenAI wymagają wbudowanego pluginu app-server Codex. Jawna konfiguracja środowiska wykonawczego PI pozostaje dostępna jako opcjonalna trasa zgodności. Gdy PI jest jawnie wybrane z profilem uwierzytelniania `openai-codex`, OpenClaw zachowuje publiczne odwołanie do modelu jako `openai/*` i wewnętrznie trasuje PI przez starszy transport uwierzytelniania Codex. Uruchom `openclaw doctor --fix`, aby naprawić nieaktualne odwołania do modeli `openai-codex/*` lub stare przypięcia sesji PI, które nie pochodzą z jawnej konfiguracji środowiska wykonawczego.
</Note>

## Pokrycie funkcji OpenClaw

| Możliwość OpenAI        | Powierzchnia OpenClaw                                             | Status                                                 |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| Czat / Responses        | dostawca modeli `openai/<model>`                                  | Tak                                                    |
| Modele subskrypcji Codex | `openai/<model>` z OAuth `openai-codex`                           | Tak                                                    |
| Starsze odwołania do modeli Codex | `openai-codex/<model>`                                            | Naprawiane przez doctor do `openai/<model>`            |
| Mechanizm app-server Codex | `openai/<model>` z pominiętym środowiskiem wykonawczym albo `agentRuntime.id: codex` | Tak                                                    |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses                                | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
| Obrazy                  | `image_generate`                                                  | Tak                                                    |
| Filmy                   | `video_generate`                                                  | Tak                                                    |
| Zamiana tekstu na mowę  | `messages.tts.provider: "openai"` / `tts`                         | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie multimediów                      | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`                         | Tak                                                    |
| Głos realtime           | Voice Call `realtime.provider: "openai"` / Control UI Talk        | Tak                                                    |
| Osadzenia               | dostawca osadzeń pamięci                                          | Tak                                                    |

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

Dla punktów końcowych zgodnych z OpenAI, które wymagają asymetrycznych etykiet osadzeń, ustaw `queryInputType` i `documentInputType` w `memorySearch`. OpenClaw przekazuje je jako pola żądania `input_type` specyficzne dla dostawcy: osadzenia zapytań używają `queryInputType`; zaindeksowane fragmenty pamięci i indeksowanie wsadowe używają `documentInputType`. Pełny przykład znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu API i rozliczania według użycia.

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

    | Odwołanie do modelu | Konfiguracja środowiska wykonawczego | Trasa                       | Uwierzytelnianie |
    | ------------------- | ------------------------------------ | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | pominięte / `agentRuntime.id: "codex"` | mechanizm app-server Codex | profil `openai-codex` |
    | `openai/gpt-5.4-mini` | pominięte / `agentRuntime.id: "codex"` | mechanizm app-server Codex | profil `openai-codex` |
    | `openai/gpt-5.5`      | `agentRuntime.id: "pi"`              | osadzone środowisko wykonawcze PI | profil `openai` albo wybrany profil `openai-codex` |

    <Note>
    Modele agentów `openai/*` używają mechanizmu app-server Codex. Aby używać uwierzytelniania kluczem API dla modelu agenta, utwórz profil klucza API `openai-codex` i uporządkuj go za pomocą `auth.order.openai-codex`; `OPENAI_API_KEY` pozostaje bezpośrednią rezerwą dla nieagentowych powierzchni API OpenAI.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Aby wypróbować bieżący model Instant ChatGPT z API OpenAI, ustaw model na `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` to ruchomy alias. OpenAI dokumentuje go jako najnowszy model Instant używany w ChatGPT i zaleca `gpt-5.5` do produkcyjnego użycia API, więc zachowaj `openai/gpt-5.5` jako stabilną wartość domyślną, chyba że jawnie chcesz zachowania tego aliasu. Alias obecnie akceptuje tylko szczegółowość tekstu `medium`, więc OpenClaw normalizuje niezgodne nadpisania szczegółowości tekstu OpenAI dla tego modelu.

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania na żywo do API OpenAI odrzucają ten model, a bieżący katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Codex subscription">
    **Najlepsze dla:** używania subskrypcji ChatGPT/Codex z natywnym wykonaniem app-server Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Run Codex OAuth">
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
      <Step title="Use the canonical OpenAI model route">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Nie jest wymagana żadna konfiguracja środowiska uruchomieniowego dla domyślnej ścieżki. Tury agenta OpenAI
        automatycznie wybierają natywne środowisko uruchomieniowe serwera aplikacji Codex, a OpenClaw
        instaluje lub naprawia dołączony Plugin Codex, gdy wybrana jest ta trasa.
      </Step>
      <Step title="Sprawdź, czy uwierzytelnianie Codex jest dostępne">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Po uruchomieniu bramy wyślij `/codex status` lub `/codex models`
        na czacie, aby zweryfikować natywne środowisko uruchomieniowe serwera aplikacji.
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Odwołanie do modelu | Konfiguracja środowiska uruchomieniowego | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | pominięta / `agentRuntime.id: "codex"` | Natywny harness serwera aplikacji Codex | Logowanie Codex lub wybrany profil `openai-codex` |
    | `openai/gpt-5.5` | `agentRuntime.id: "pi"` | Wbudowane środowisko uruchomieniowe PI z wewnętrznym transportem uwierzytelniania Codex | Wybrany profil `openai-codex` |
    | `openai-codex/gpt-5.5` | naprawiona przez doctor | Starsza trasa przepisana na `openai/gpt-5.5` | Istniejący profil `openai-codex` |

    <Warning>
    Nie konfiguruj starszych odwołań do modeli `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ani
    `openai-codex/gpt-5.3*`. Konta OAuth ChatGPT/Codex obecnie odrzucają
    te modele. Użyj `openai/gpt-5.5`; tury agenta OpenAI wybierają teraz domyślnie środowisko uruchomieniowe Codex.
    </Warning>

    <Note>
    Nadal używaj identyfikatora dostawcy `openai-codex` dla poleceń uwierzytelniania/profilu. Prefiks modelu
    `openai-codex/*` to starsza konfiguracja naprawiana przez doctor. W typowej
    konfiguracji subskrypcji z natywnym środowiskiem uruchomieniowym zaloguj się przez `openai-codex`,
    ale pozostaw odwołanie do modelu jako `openai/gpt-5.5`.
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

    <Note>
    Onboarding nie importuje już materiału OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo przez powyższy przepływ kodu urządzenia — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Sprawdzanie i odzyskiwanie trasowania OAuth Codex

    Użyj tych poleceń, aby zobaczyć, którego modelu, środowiska uruchomieniowego i trasy uwierzytelniania używa domyślny
    agent:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get agents.defaults.agentRuntime --json
    ```

    Dla konkretnego agenta dodaj `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    Jeśli starsza konfiguracja nadal zawiera `openai-codex/gpt-*` albo przestarzałe przypięcie sesji OpenAI PI
    bez jawnej konfiguracji środowiska uruchomieniowego, napraw ją:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jeśli `models auth list --provider openai-codex` nie pokazuje żadnego użytecznego profilu, zaloguj
    się ponownie:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` pozostaje identyfikatorem dostawcy uwierzytelniania/profilu. `openai/*` to
    trasa modelu dla tur agenta OpenAI przez Codex.

    ### Wskaźnik stanu

    Czatowe `/status` pokazuje, które środowisko uruchomieniowe modelu jest aktywne dla bieżącej sesji.
    Dołączony harness serwera aplikacji Codex pojawia się jako `Runtime: OpenAI Codex` dla
    tur modeli agenta OpenAI. Przestarzałe przypięcia sesji PI są naprawiane do Codex, chyba że
    konfiguracja jawnie przypina PI.

    ### Ostrzeżenie doctor

    Jeśli trasy `openai-codex/*` lub przestarzałe przypięcia OpenAI PI pozostają w konfiguracji albo
    stanie sesji, `openclaw doctor --fix` przepisuje je na `openai/*` ze
    środowiskiem uruchomieniowym Codex, chyba że PI jest jawnie skonfigurowane.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu środowiska uruchomieniowego jako oddzielne wartości.

    Dla `openai/gpt-5.5` przez katalog OAuth Codex:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit `contextTokens` środowiska uruchomieniowego: `272000`

    Mniejszy domyślny limit w praktyce zapewnia lepszą latencję i cechy jakościowe. Nadpisz go za pomocą `contextTokens`:

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

    OpenClaw używa metadanych upstream katalogu Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie Codex na żywo pomija wiersz `gpt-5.5`, gdy
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, podagentów i skonfigurowanego modelu domyślnego nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Uwierzytelnianie natywnego serwera aplikacji Codex

Natywny harness serwera aplikacji Codex używa odwołań do modeli `openai/*` oraz pominiętej
konfiguracji środowiska uruchomieniowego albo `agentRuntime.id: "codex"`, ale jego uwierzytelnianie nadal jest
oparte na koncie. OpenClaw
wybiera uwierzytelnianie w tej kolejności:

1. Jawny profil uwierzytelniania OpenClaw `openai-codex` powiązany z agentem.
2. Istniejące konto serwera aplikacji, takie jak lokalne logowanie Codex CLI ChatGPT.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, potem
   `OPENAI_API_KEY`, gdy serwer aplikacji zgłasza brak konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcji ChatGPT/Codex nie zostaje zastąpione tylko
dlatego, że proces Gateway ma również `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI
lub embeddings. Awaryjne użycie klucza API z env dotyczy tylko lokalnej ścieżki stdio bez konta; nie
jest wysyłane do połączeń serwera aplikacji WebSocket. Gdy wybrany jest profil Codex
w stylu subskrypcji, OpenClaw również nie przekazuje `CODEX_API_KEY` ani `OPENAI_API_KEY`
do uruchamianego procesu potomnego serwera aplikacji stdio i wysyła wybrane poświadczenia
przez RPC logowania serwera aplikacji.

## Generowanie obrazów

Dołączony plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów z kluczem API OpenAI, jak i generowanie obrazów OAuth Codex
przez to samo odwołanie do modelu `openai/gpt-image-2`.

| Możliwość                 | Klucz API OpenAI                   | OAuth Codex                          |
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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

`gpt-image-2` jest domyślny zarówno dla generowania tekst-na-obraz OpenAI, jak i
edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają użyteczne jako
jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia PNG/WebP
z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca
`background: "transparent"`.

W przypadku żądania przezroczystego tła agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni również publiczne trasy OpenAI i
OpenAI Codex OAuth, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe kompatybilne z OpenAI zachowują
swoje skonfigurowane nazwy wdrożeń/modeli.

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

W przypadku instalacji OAuth Codex zachowaj to samo odwołanie `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie
próbuje najpierw `OPENAI_API_KEY` ani nie przełącza się po cichu na klucz API dla tego
żądania. Skonfiguruj `models.providers.openai` jawnie z kluczem API,
niestandardowym bazowym adresem URL albo punktem końcowym Azure, gdy chcesz użyć bezpośredniej trasy OpenAI Images API
zamiast tego.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/prywatnym adresie, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw blokuje
prywatne/wewnętrzne punkty końcowe obrazów kompatybilne z OpenAI, chyba że ta zgoda jest
obecna.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Generowanie przezroczystego PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Dołączony plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość        | Wartość                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Tekst-na-wideo, obraz-na-wideo, edycja pojedynczego wideo                         |
| Dane referencyjne | 1 obraz lub 1 wideo                                                               |
| Nadpisania rozmiaru | Obsługiwane                                                                      |
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

OpenClaw dodaje wspólny wkład promptu GPT-5 dla uruchomień rodziny GPT-5 u różnych dostawców. Stosuje się on według identyfikatora modelu, więc `openai/gpt-5.5`, starsze odwołania sprzed naprawy, takie jak `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne kompatybilne odwołania GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x nie.

Dołączony natywny harness Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie serwera aplikacji Codex, więc sesje `openai/gpt-5.x` wymuszone przez `agentRuntime.id: "codex"` zachowują te same wytyczne dotyczące doprowadzania zadań do końca i proaktywnego Heartbeat, mimo że Codex jest właścicielem pozostałej części promptu harness.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonania, dyscypliny narzędzi, kształtu danych wyjściowych, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału oraz zachowanie wiadomości cichych pozostaje we współdzielonym monicie systemowym OpenClaw i zasadach dostarczania wychodzącego. Wytyczne GPT-5 są zawsze włączone dla pasujących modeli. Przyjazna warstwa stylu interakcji jest osobna i konfigurowalna.

| Wartość                | Efekt                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (domyślne) | Włącza przyjazną warstwę stylu interakcji |
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
Wartości nie uwzględniają wielkości liter w czasie działania, więc zarówno `"Off"`, jak i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako awaryjna zgodność, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
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
    | Dodatkowe ciało | `messages.tts.providers.openai.extraBody` / `extra_body` | (nieustawione) |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z JSON żądania `/audio/speech` po polach wygenerowanych przez OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypów są ignorowane.

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
    Dołączony Plugin `openai` rejestruje wsadową transkrypcję mowy na tekst przez
    powierzchnię transkrypcji rozumienia multimediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i załączników audio
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

    Wskazówki języka i promptu są przekazywane do OpenAI, gdy zostaną dostarczone przez
    współdzieloną konfigurację multimediów audio lub żądanie transkrypcji dla danego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Klucz API | `...openai.apiKey` | Używa awaryjnie `OPENAI_API_KEY` |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Ten dostawca strumieniowy jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki wsadowej transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślne |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Klucz API | `...openai.apiKey` | Używa awaryjnie `OPENAI_API_KEY` |

    <Note>
    Obsługuje Azure OpenAI przez klucze konfiguracji `azureEndpoint` i `azureDeployment` dla mostów czasu rzeczywistego zaplecza. Obsługuje dwukierunkowe wywoływanie narzędzi. Używa formatu audio G.711 u-law.
    </Note>

    <Note>
    Control UI Talk używa sesji czasu rzeczywistego OpenAI w przeglądarce z
    ulotnym sekretem klienta utworzonym przez Gateway i bezpośrednią wymianą SDP WebRTC przeglądarki z
    OpenAI Realtime API. Weryfikacja live przez maintainerów jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    część OpenAI tworzy sekret klienta w Node, generuje ofertę SDP przeglądarki
    z fałszywymi mediami mikrofonu, wysyła ją do OpenAI i stosuje odpowiedź SDP
    bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie bazowego URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądania Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie zależy od `models.providers.openai.baseUrl`. Zobacz akordeon **Głos w czasie rzeczywistym**
w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia Azure.
</Note>

Używaj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę enterprise Azure OpenAI
- Potrzebujesz regionalnego miejsca przechowywania danych lub kontroli zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch w istniejącym tenancie Azure

### Konfiguracja

Dla generowania obrazów Azure przez dołączonego dostawcę `openai` skieruj
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

OpenClaw rozpoznaje te sufiksy hostów Azure dla trasy generowania obrazów Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek ograniczonych do wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów Azure.
  Wartości `timeoutMs` dla danego wywołania nadal nadpisują tę wartość domyślną.

Inne bazowe URL-e (publiczny OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazu OpenAI.

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

Wartość domyślna to `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
trasowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów trasowanych przez
dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w podzbiorze regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia sprawdź aktualną listę regionów Microsoft
i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczny OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, które publiczny OpenAI dopuszcza (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko w konkretnych wersjach
modelu. Te różnice pochodzą z Azure i modelu bazowego, nie z
OpenClaw. Jeśli żądanie Azure nie powiedzie się z błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne i zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu onboardingu albo dedykowanej konfiguracji dostawcy Azure — samo `openai.baseUrl`
nie wybiera kształtu API/auth Azure. Istnieje osobny
dostawca `azure-openai-responses/*`; zobacz
akordeon Server-side compaction poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa najpierw WebSocket z awaryjnym SSE (`"auto"`) dla `openai/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE w czasie schładzania
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień i ponownych połączeń
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
          },
        },
      },
    }
    ```

    Powiązane dokumenty OpenAI:
    - [Realtime API z WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Odpowiedzi Streaming API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Rozgrzewanie WebSocket">
    OpenClaw domyślnie włącza rozgrzewanie WebSocket dla `openai/*`, aby zmniejszyć opóźnienie pierwszej tury.

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
    OpenClaw udostępnia wspólny przełącznik trybu szybkiego dla `openai/*`:

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
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie sesji przywraca sesję do skonfigurowanej wartości domyślnej.
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
    `serviceTier` jest przekazywane tylko do natywnych endpointów OpenAI (`api.openai.com`) i natywnych endpointów Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregokolwiek dostawcę przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia Pi-harness w Plugin OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków dostawcy OpenAI używanych przez uruchomienia osadzone. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany oddzielnie za pomocą `agents.defaults.agentRuntime.id`.

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
    `responsesServerCompaction` steruje tylko wstrzykiwaniem `context_management`. Bezpośrednie modele OpenAI Responses nadal wymuszają `store: true`, chyba że zgodność ustawia `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Ścisły tryb agentowy GPT">
    Dla uruchomień z rodziny GPT-5 na `openai/*` OpenClaw może użyć ściślejszego osadzonego kontraktu wykonywania:

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
    - Ponawia turę z ukierunkowaniem na natychmiastowe działanie
    - Automatycznie włącza `update_plan` dla istotnej pracy
    - Pokazuje jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień OpenAI i Codex z rodziny GPT-5. Inni dostawcy i starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie endpointy OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli, które obsługują wartość wysiłku OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych hostach natywnych
    - Zachowują kształtowanie żądań właściwe tylko dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodnościowego
    - Usuwają pole `store` Completions z nienatywnych danych żądań `openai-completions`
    - Akceptują zaawansowane przekazywanie JSON przez `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków tylko dla tras natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodnościowego, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, odwołań do modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazu i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego użycia poświadczeń.
  </Card>
</CardGroup>
