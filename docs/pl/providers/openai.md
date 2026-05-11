---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania subskrypcji Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agentów GPT-5
summary: Korzystaj z OpenAI w OpenClaw za pomocą kluczy API lub subskrypcji Codex
title: OpenAI
x-i18n:
    generated_at: "2026-05-11T20:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d63b8eff93ecffd85c2110f42044c26621ff50eb62c35b7cc99a07f0e6be1ffb
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia interfejsy API dla deweloperów do modeli GPT, a Codex jest także dostępny jako agent programistyczny w ramach planu ChatGPT przez klientów Codex firmy OpenAI. OpenClaw utrzymuje te powierzchnie oddzielnie, aby konfiguracja pozostała przewidywalna.

OpenClaw używa `openai/*` jako kanonicznej trasy modelu OpenAI. Osadzone przebiegi agenta na modelach OpenAI są domyślnie uruchamiane przez natywne środowisko wykonawcze serwera aplikacji Codex; bezpośrednie uwierzytelnianie kluczem API OpenAI pozostaje dostępne dla nieagentowych powierzchni OpenAI, takich jak obrazy, osadzenia, mowa i tryb realtime.

- **Modele agenta** - modele `openai/*` przez środowisko wykonawcze Codex; zaloguj się przy użyciu uwierzytelniania Codex, aby korzystać z subskrypcji ChatGPT/Codex, albo skonfiguruj zgodny z Codex zapasowy klucz API OpenAI, gdy celowo chcesz używać uwierzytelniania kluczem API.
- **Nieagentowe interfejsy API OpenAI** - bezpośredni dostęp do OpenAI Platform z rozliczaniem według użycia przez `OPENAI_API_KEY` lub wdrażanie klucza API OpenAI.
- **Starsza konfiguracja** - odwołania do modeli `openai-codex/*` są naprawiane przez `openclaw doctor --fix` do `openai/*` oraz środowiska wykonawczego Codex.

OpenAI jawnie obsługuje użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i przepływach pracy takich jak OpenClaw.

Dostawca, model, środowisko wykonawcze i kanał są osobnymi warstwami. Jeśli te etykiety zaczynają się mieszać, przeczytaj [Środowiska wykonawcze agenta](/pl/concepts/agent-runtimes) przed zmianą konfiguracji.

## Szybki wybór

| Cel                                                  | Użyj                                                     | Uwagi                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex | `openai/gpt-5.5`                                         | Domyślna konfiguracja agenta OpenAI. Zaloguj się przez uwierzytelnianie Codex. |
| Bezpośrednie rozliczanie kluczem API dla modeli agenta | `openai/gpt-5.5` plus zgodny z Codex profil klucza API | Użyj `auth.order.openai`, aby umieścić zapas po uwierzytelnianiu subskrypcyjnym. |
| Bezpośrednie rozliczanie kluczem API przez jawne PI  | `openai/gpt-5.5` plus środowisko wykonawcze dostawcy/modelu `pi` | Wybierz zwykły profil klucza API `openai`.                             |
| Najnowszy alias API ChatGPT Instant                  | `openai/chat-latest`                                     | Tylko bezpośredni klucz API. Ruchomy alias do eksperymentów, nie domyślny. |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez jawne PI | `openai/gpt-5.5` plus środowisko wykonawcze dostawcy/modelu `pi` | Wybierz profil uwierzytelniania `openai-codex` dla trasy zgodności.    |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                                     | Działa z `OPENAI_API_KEY` albo OpenAI Codex OAuth.                     |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                                   | Użyj `outputFormat=png` lub `webp` oraz `openai.background=transparent`. |

## Mapa nazewnictwa

Nazwy są podobne, ale nie są zamienne:

| Nazwa, którą widzisz                    | Warstwa                    | Znaczenie                                                                                                             |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks dostawcy           | Kanoniczna trasa modelu OpenAI; przebiegi agenta używają środowiska wykonawczego Codex.                              |
| `openai-codex`                          | Starszy prefiks uwierzytelniania/profilu | Starsza przestrzeń nazw profilu OpenAI Codex OAuth/subskrypcji. Istniejące profile i `auth.order.openai-codex` nadal działają. |
| Plugin `codex`                          | Plugin                     | Dołączony Plugin OpenClaw, który zapewnia natywne środowisko wykonawcze serwera aplikacji Codex oraz kontrolki czatu `/codex`. |
| provider/model `agentRuntime.id: codex` | Środowisko wykonawcze agenta | Wymusza natywny harness serwera aplikacji Codex dla pasujących osadzonych przebiegów.                                |
| `/codex ...`                            | Zestaw poleceń czatu       | Powiąż/kontroluj wątki serwera aplikacji Codex z rozmowy.                                                            |
| `runtime: "acp", agentId: "codex"`      | Trasa sesji ACP            | Jawna ścieżka awaryjna uruchamiająca Codex przez ACP/acpx.                                                           |

Oznacza to, że konfiguracja może celowo zawierać odwołania do modeli `openai/*`, podczas gdy profile uwierzytelniania nadal wskazują na zgodne z Codex poświadczenia. Preferuj `auth.order.openai` dla nowej konfiguracji; istniejące profile `openai-codex:*` oraz `auth.order.openai-codex` pozostają obsługiwane. `openclaw doctor --fix` przepisuje starsze odwołania do modeli `openai-codex/*` na kanoniczną trasę modelu OpenAI.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API do OpenAI Platform, jak i przez trasy subskrypcji/OAuth. Dla subskrypcji ChatGPT/Codex oraz natywnego wykonania Codex użyj `openai/gpt-5.5`; nieustawiona konfiguracja środowiska wykonawczego wybiera teraz harness Codex dla przebiegów agentów OpenAI. Używaj profili klucza API OpenAI tylko wtedy, gdy chcesz bezpośredniego uwierzytelniania kluczem API dla modelu agenta OpenAI.
</Note>

<Note>
Przebiegi modeli agenta OpenAI wymagają dołączonego Pluginu serwera aplikacji Codex. Jawna konfiguracja środowiska wykonawczego PI pozostaje dostępna jako opcjonalna trasa zgodności. Gdy PI zostanie jawnie wybrane z profilem uwierzytelniania `openai-codex`, OpenClaw zachowuje publiczne odwołanie do modelu jako `openai/*` i wewnętrznie kieruje PI przez starszy transport uwierzytelniania Codex. Uruchom `openclaw doctor --fix`, aby naprawić nieaktualne odwołania do modeli `openai-codex/*` lub stare przypięcia sesji PI, które nie pochodzą z jawnej konfiguracji środowiska wykonawczego.
</Note>

## Pokrycie funkcji OpenClaw

| Możliwość OpenAI        | Powierzchnia OpenClaw                                                             | Status                                                 |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses        | dostawca modelu `openai/<model>`                                                  | Tak                                                    |
| Modele subskrypcji Codex | `openai/<model>` z OAuth `openai-codex`                                           | Tak                                                    |
| Starsze odwołania do modeli Codex | `openai-codex/<model>`                                                           | Naprawiane przez doctor do `openai/<model>`            |
| Harness serwera aplikacji Codex | `openai/<model>` z pominiętym środowiskiem wykonawczym lub provider/model `agentRuntime.id: codex` | Tak                                                    |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses                                                | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy |
| Obrazy                  | `image_generate`                                                                 | Tak                                                    |
| Wideo                   | `video_generate`                                                                 | Tak                                                    |
| Zamiana tekstu na mowę  | `messages.tts.provider: "openai"` / `tts`                                        | Tak                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie mediów                                          | Tak                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`                                        | Tak                                                    |
| Głos w czasie rzeczywistym | Voice Call `realtime.provider: "openai"` / Control UI Talk                       | Tak                                                    |
| Osadzenia               | dostawca osadzeń pamięci                                                         | Tak                                                    |

## Osadzenia pamięci

OpenClaw może używać OpenAI albo zgodnego z OpenAI punktu końcowego osadzeń do indeksowania `memory_search` i osadzeń zapytań:

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

Dla zgodnych z OpenAI punktów końcowych wymagających asymetrycznych etykiet osadzeń ustaw `queryInputType` i `documentInputType` pod `memorySearch`. OpenClaw przekazuje je jako specyficzne dla dostawcy pola żądania `input_type`: osadzenia zapytań używają `queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają `documentInputType`. Pełny przykład znajdziesz w [Dokumentacji referencyjnej konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze do:** bezpośredniego dostępu do API i rozliczania według użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
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

    ### Podsumowanie tras

    | Odwołanie do modelu   | Konfiguracja środowiska wykonawczego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | pominięte / provider/model `agentRuntime.id: "codex"` | harness serwera aplikacji Codex | zgodny z Codex profil OpenAI |
    | `openai/gpt-5.4-mini` | pominięte / provider/model `agentRuntime.id: "codex"` | harness serwera aplikacji Codex | zgodny z Codex profil OpenAI |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "pi"`              | osadzone środowisko wykonawcze PI | profil `openai` lub wybrany profil `openai-codex` |

    <Note>
    Modele agentów `openai/*` używają harnessu serwera aplikacji Codex. Aby użyć uwierzytelniania kluczem API dla modelu agenta, utwórz zgodny z Codex profil klucza API i uporządkuj go przez `auth.order.openai`; `OPENAI_API_KEY` pozostaje bezpośrednią ścieżką awaryjną dla nieagentowych powierzchni API OpenAI. Starsze wpisy `auth.order.openai-codex` nadal działają.
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

    `chat-latest` jest ruchomym aliasem. OpenAI dokumentuje go jako najnowszy model Instant używany w ChatGPT i zaleca `gpt-5.5` do produkcyjnego użycia API, więc pozostaw `openai/gpt-5.5` jako stabilną wartość domyślną, chyba że jawnie chcesz zachowania tego aliasu. Alias obecnie akceptuje tylko `medium` szczegółowości tekstu, więc OpenClaw normalizuje niezgodne nadpisania szczegółowości tekstu OpenAI dla tego modelu.

    <Warning>
    OpenClaw **nie** udostępnia `openai/gpt-5.3-codex-spark`. Żądania na żywo do API OpenAI odrzucają ten model, a bieżący katalog Codex również go nie udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze do:** używania subskrypcji ChatGPT/Codex z natywnym wykonywaniem przez serwer aplikacji Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania w ChatGPT.

    <Steps>
      <Step title="Uruchom Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        W konfiguracjach bez interfejsu lub nieobsługujących callbacków dodaj `--device-code`, aby zalogować się przez przepływ kodu urządzenia ChatGPT zamiast callbacku przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Użyj kanonicznej trasy modelu OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Dla domyślnej ścieżki nie jest wymagana konfiguracja runtime. Tury agentów OpenAI
        automatycznie wybierają natywny runtime serwera aplikacji Codex, a OpenClaw
        instaluje lub naprawia dołączony Plugin Codex, gdy wybrana jest ta trasa.
      </Step>
      <Step title="Sprawdź, czy autoryzacja Codex jest dostępna">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Po uruchomieniu gatewaya wyślij `/codex status` lub `/codex models`
        na czacie, aby zweryfikować natywny runtime serwera aplikacji.
      </Step>
    </Steps>

    ### Podsumowanie trasy

    | Odwołanie do modelu | Konfiguracja runtime | Trasa | Autoryzacja |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | pominięte / provider/model `agentRuntime.id: "codex"` | Natywny harness serwera aplikacji Codex | Logowanie Codex lub uporządkowany profil autoryzacji `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "pi"` | Runtime osadzony PI z wewnętrznym transportem autoryzacji Codex | Wybrany profil `openai-codex` |
    | `openai-codex/gpt-5.5` | naprawione przez doctor | Starsza trasa przepisana na `openai/gpt-5.5` | Istniejący profil `openai-codex` |

    <Warning>
    Nie konfiguruj starszych odwołań do modeli `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` ani
    `openai-codex/gpt-5.3*`. Konta ChatGPT/Codex OAuth obecnie odrzucają
    te modele. Użyj `openai/gpt-5.5`; tury agentów OpenAI domyślnie wybierają teraz runtime Codex.
    </Warning>

    <Note>
    Prefiks modelu `openai-codex/*` to starsza konfiguracja naprawiana przez doctor. W
    typowej konfiguracji subskrypcji z natywnym runtime zaloguj się autoryzacją Codex,
    ale pozostaw odwołanie do modelu jako `openai/gpt-5.5`. Nowa konfiguracja powinna umieszczać kolejność
    autoryzacji agenta OpenAI pod `auth.order.openai`; starsze wpisy `auth.order.openai-codex`
    pozostają prawidłowe.
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

    Przy zapasowym kluczu API pozostaw model na `openai/gpt-5.5` i umieść
    kolejność autoryzacji pod `openai`. OpenClaw najpierw spróbuje subskrypcji, potem
    klucza API, pozostając przy harnessie Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai-codex:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding nie importuje już materiału OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo powyższy przepływ kodu urządzenia — OpenClaw zarządza wynikowymi danymi uwierzytelniającymi we własnym magazynie autoryzacji agentów.
    </Note>

    ### Sprawdzanie i odzyskiwanie routingu Codex OAuth

    Użyj tych poleceń, aby zobaczyć, jakiego modelu, runtime i trasy autoryzacji używa domyślny
    agent:

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

    Jeśli starsza konfiguracja nadal ma `openai-codex/gpt-*` albo przestarzały pin sesji OpenAI PI
    bez jawnej konfiguracji runtime, napraw ją:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jeśli `models auth list --provider openai-codex` nie pokazuje użytecznego profilu, zaloguj
    się ponownie:

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai/*` to trasa modelu dla tur agentów OpenAI przez Codex. Identyfikator dostawcy
    autoryzacji/profilu `openai-codex` pozostaje akceptowany dla istniejących
    profili i listowania w CLI.

    ### Wskaźnik stanu

    Czat `/status` pokazuje, który runtime modelu jest aktywny dla bieżącej sesji.
    Dołączony harness serwera aplikacji Codex pojawia się jako `Runtime: OpenAI Codex` dla
    tur modeli agentów OpenAI. Przestarzałe piny sesji PI są naprawiane do Codex, chyba że
    konfiguracja jawnie przypina PI.

    ### Ostrzeżenie doctor

    Jeśli trasy `openai-codex/*` lub przestarzałe piny OpenAI PI pozostają w konfiguracji lub
    stanie sesji, `openclaw doctor --fix` przepisuje je na `openai/*` z
    runtime Codex, chyba że PI jest jawnie skonfigurowane.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako osobne wartości.

    Dla `openai/gpt-5.5` przez katalog Codex OAuth:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce daje lepszą latencję i jakość. Nadpisz go za pomocą `contextTokens`:

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

    OpenClaw używa upstreamowych metadanych katalogu Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie Codex na żywo pomija wiersz `gpt-5.5`, mimo że
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, podagentów i skonfigurowanego modelu domyślnego nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Natywna autoryzacja serwera aplikacji Codex

Natywny harness serwera aplikacji Codex używa odwołań do modeli `openai/*` oraz pominiętej
konfiguracji runtime albo provider/model `agentRuntime.id: "codex"`, ale jego autoryzacja
nadal opiera się na koncie. OpenClaw wybiera autoryzację w tej kolejności:

1. Uporządkowane profile autoryzacji OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Istniejące profile `openai-codex:*` i
   `auth.order.openai-codex` pozostają prawidłowe dla starszych instalacji.
2. Istniejące konto serwera aplikacji, takie jak lokalne logowanie ChatGPT w Codex CLI.
3. Tylko dla lokalnych uruchomień serwera aplikacji stdio: `CODEX_API_KEY`, następnie
   `OPENAI_API_KEY`, gdy serwer aplikacji zgłasza brak konta i nadal wymaga
   autoryzacji OpenAI.

Oznacza to, że lokalne logowanie subskrypcji ChatGPT/Codex nie jest zastępowane tylko
dlatego, że proces gateway ma też `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI
lub embeddingów. Fallback klucza API z env jest używany tylko w lokalnej ścieżce stdio bez konta; nie
jest wysyłany do połączeń WebSocket serwera aplikacji. Gdy wybrany jest profil Codex
typu subskrypcyjnego, OpenClaw również nie przekazuje `CODEX_API_KEY` ani `OPENAI_API_KEY`
do utworzonego procesu potomnego serwera aplikacji stdio i wysyła wybrane dane uwierzytelniające
przez RPC logowania serwera aplikacji. Gdy ten profil subskrypcyjny jest zablokowany przez
limit użycia Codex, OpenClaw może przełączyć się na następny uporządkowany profil klucza API `openai:*`
bez zmiany wybranego modelu ani wychodzenia z harnessu Codex. Po upływie czasu resetu subskrypcji profil subskrypcyjny
ponownie kwalifikuje się do użycia.

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów z kluczem API OpenAI, jak i generowanie obrazów
przez Codex OAuth, używając tego samego odwołania do modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odwołanie do modelu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autoryzacja                      | `OPENAI_API_KEY`                   | Logowanie OpenAI Codex OAuth           |
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
Zobacz [Generowanie obrazów](/pl/tools/image-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie failover.
</Note>

`gpt-image-2` jest domyślne zarówno dla generowania obrazów z tekstu OpenAI, jak i edycji obrazów.
`gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają dostępne jako
jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia PNG/WebP
z przezroczystym tłem; obecne API `gpt-image-2` odrzuca
`background: "transparent"`.

Dla żądania z przezroczystym tłem agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni też publiczne trasy OpenAI i
OpenAI Codex OAuth, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI zachowują
skonfigurowane nazwy wdrożeń/modeli.

To samo ustawienie jest dostępne dla uruchomień CLI bez interfejsu:

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
skonfigurowany jest profil OAuth `openai-codex`, OpenClaw rozwiązuje zapisany token dostępu OAuth
i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw
`OPENAI_API_KEY` ani po cichu nie wraca do klucza API dla tego
żądania. Skonfiguruj `models.providers.openai` jawnie z kluczem API,
niestandardowym bazowym URL lub punktem końcowym Azure, gdy chcesz użyć bezpośredniej trasy
OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/adresie prywatnym, ustaw też
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw pozostawia
prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI zablokowane, chyba że ta zgoda
jest obecna.

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

| Możliwość        | Wartość                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Tekst na wideo, obraz na wideo, edycja pojedynczego wideo                         |
| Dane referencyjne | 1 obraz lub 1 wideo                                                               |
| Nadpisania rozmiaru | Obsługiwane                                                                     |
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Wkład promptu GPT-5

OpenClaw dodaje współdzielony wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 u różnych dostawców. Jest stosowany według identyfikatora modelu, więc `openai/gpt-5.5`, starsze referencje sprzed naprawy, takie jak `openai-codex/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5`, oraz inne zgodne referencje GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Wbudowany natywny harness Codex używa tego samego zachowania GPT-5 i nakładki Heartbeat przez instrukcje deweloperskie serwera aplikacji Codex, więc sesje `openai/gpt-5.x` kierowane przez Codex zachowują te same wskazówki dotyczące doprowadzania zadań do końca i proaktywnego Heartbeat, mimo że Codex zarządza resztą promptu harnessu.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonania, dyscypliny narzędzi, kształtu danych wyjściowych, kontroli ukończenia i weryfikacji. Zachowanie odpowiedzi specyficzne dla kanału i zachowanie cichych wiadomości pozostaje we współdzielonym prompcie systemowym OpenClaw oraz zasadach dostarczania wychodzącego. Wskazówki GPT-5 są zawsze włączone dla pasujących modeli. Przyjazna warstwa stylu interakcji jest osobna i konfigurowalna.

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
Wartości nie rozróżniają wielkości liter w czasie działania, więc zarówno `"Off"`, jak i `"off"` wyłączają przyjazną warstwę stylu.
</Tip>

<Note>
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako zgodnościowe rozwiązanie awaryjne, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
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
    | Klucz API | `messages.tts.providers.openai.apiKey` | Wraca awaryjnie do `OPENAI_API_KEY` |
    | Bazowy URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Dodatkowe body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nieustawione) |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z JSON żądania `/audio/speech` po wygenerowanych polach OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypu są ignorowane.

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy API czatu. OpenAI TTS nadal jest konfigurowane przez klucz API; dla odpowiedzi głosowej na żywo tylko przez OAuth użyj ścieżki głosowej Realtime zamiast mowy STT -> TTS w trybie agenta.
    </Note>

  </Accordion>

  <Accordion title="Mowa na tekst">
    Wbudowany Plugin `openai` rejestruje wsadowe przekształcanie mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie pliku audio jako multipart
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmenty kanałów głosowych Discord i załączniki audio kanałów

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
    współdzieloną konfigurację mediów audio lub żądanie transkrypcji dla pojedynczego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje transkrypcję w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Wartość domyślna |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Uwierzytelnianie | `...openai.apiKey`, `OPENAI_API_KEY` lub OAuth `openai-codex` | Klucze API łączą się bezpośrednio; OAuth wystawia sekret klienta transkrypcji Realtime |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Gdy skonfigurowano tylko OAuth `openai-codex`, Gateway wystawia efemeryczny sekret klienta transkrypcji Realtime przed otwarciem WebSocket. Ten dostawca przesyłania strumieniowego jest przeznaczony dla ścieżki transkrypcji w czasie rzeczywistym Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki transkrypcji wsadowej `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos w czasie rzeczywistym">
    Dołączony Plugin `openai` rejestruje głos w czasie rzeczywistym dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Wartość domyślna |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura (mostek wdrożenia Azure) | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Wypełnienie prefiksu | `...openai.prefixPaddingMs` | `300` |
    | Nakład rozumowania | `...openai.reasoningEffort` | (nieustawione) |
    | Uwierzytelnianie | `...openai.apiKey`, `OPENAI_API_KEY` lub OAuth `openai-codex` | Browser Talk i mostki backendowe inne niż Azure mogą używać OAuth Codex |

    Dostępne wbudowane głosy Realtime dla `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI zaleca `marin` i `cedar` dla najlepszej jakości Realtime. To
    osobny zestaw względem głosów zamiany tekstu na mowę powyżej; nie zakładaj, że głos TTS
    taki jak `fable`, `nova` lub `onyx` jest prawidłowy dla sesji Realtime.

    <Note>
    Backendowe mostki OpenAI realtime używają kształtu sesji GA Realtime WebSocket, który nie akceptuje `session.temperature`. Wdrożenia Azure OpenAI pozostają dostępne przez `azureEndpoint` i `azureDeployment` oraz zachowują kształt sesji zgodny z wdrożeniem. Obsługuje dwukierunkowe wywoływanie narzędzi i dźwięk G.711 u-law.
    </Note>

    <Note>
    Głos Realtime jest wybierany podczas tworzenia sesji. OpenAI pozwala później zmienić większość
    pól sesji, ale głosu nie można zmienić po tym, jak
    model wyemituje dźwięk w tej sesji. OpenClaw obecnie udostępnia
    wbudowane identyfikatory głosów Realtime jako ciągi znaków.
    </Note>

    <Note>
    Control UI Talk używa przeglądarkowych sesji realtime OpenAI z wystawianym przez Gateway
    efemerycznym sekretem klienta oraz bezpośrednią przeglądarkową wymianą WebRTC SDP z
    OpenAI Realtime API. Gdy nie skonfigurowano bezpośredniego klucza API OpenAI,
    Gateway może wystawić ten sekret klienta z wybranym profilem OAuth `openai-codex`.
    Gateway relay i backendowe mostki Voice Call realtime WebSocket używają
    tego samego awaryjnego OAuth dla natywnych punktów końcowych OpenAI. Weryfikacja na żywo dla opiekunów
    jest dostępna za pomocą
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ścieżki OpenAI weryfikują zarówno backendowy mostek WebSocket, jak i przeglądarkową
    wymianę WebRTC SDP bez logowania sekretów.
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
i `models.providers.openai.baseUrl` na niego nie wpływa. Zobacz akordeon **Głos w czasie rzeczywistym**
w sekcji [Głos i mowa](#voice-and-speech), aby znaleźć jego ustawienia Azure.
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę enterprise Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych lub kontroli zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch w istniejącej dzierżawie Azure

### Konfiguracja

Aby generować obrazy przez Azure przy użyciu dołączonego dostawcy `openai`, ustaw
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
- Używa ścieżek w zakresie wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów Azure.
  Wartości `timeoutMs` dla poszczególnych wywołań nadal nadpisują tę wartość domyślną.

Inne bazowe adresy URL (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazów OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i nie zadziałają z wdrożeniami obrazów
Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję Azure Preview lub GA
dla ścieżki generowania obrazów w Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślnie używana jest wersja `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
kierowanych przez dołączonego providera `openai`, pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama zasada dotycząca nazwy wdrożenia ma zastosowanie do wywołań generowania obrazów kierowanych przez
dołączonego providera `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w wybranych regionach
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia sprawdź aktualną listę regionów Microsoft
i potwierdź, że dany model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, które publiczne OpenAI dopuszcza (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko w określonych wersjach
modelu. Te różnice wynikają z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure zakończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne vs zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu wdrażania albo dedykowanej konfiguracji providera Azure — samo `openai.baseUrl`
nie wybiera kształtu API/uwierzytelniania Azure. Istnieje osobny
provider `azure-openai-responses/*`; zobacz
akordeon Compaction po stronie serwera poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw używa najpierw WebSocket z rezerwowym SSE (`"auto"`) dla `openai/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przełączeniem rezerwowym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE w czasie schłodzenia
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień oraz ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, rezerwowo SSE |
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
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je osobno dla modelu w OpenClaw:

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
    `serviceTier` jest przekazywany tylko do natywnych endpointów OpenAI (`api.openai.com`) i natywnych endpointów Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregoś providera przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia Pi-harness w Pluginie OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (albo `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki Pi harness oraz hooków providera OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany przez domyślną trasę agenta OpenAI albo politykę runtime providera/modelu.

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
    - Nie traktuje już tury zawierającej tylko plan jako udanego postępu, gdy dostępna jest akcja narzędzia
    - Ponawia turę ze wskazówką do natychmiastowego działania
    - Automatycznie włącza `update_plan` dla znaczącej pracy
    - Ujawnia jawny stan zablokowania, jeśli model nadal planuje bez działania

    <Note>
    Ograniczone tylko do uruchomień rodziny GPT-5 OpenAI i Codex. Inni providerzy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne vs zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie endpointy OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących poziom wysiłku OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych natywnych hostach
    - Zachowują kształtowanie żądań wyłącznie dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki cache promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego zachowania zgodności
    - Usuwają `store` Completions z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowane przekazywanie JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków dostępnych tylko w trasach natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybór providerów, odwołań modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór providera.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór providera.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i zasady ponownego użycia poświadczeń.
  </Card>
</CardGroup>
