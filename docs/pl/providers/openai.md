---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz uwierzytelniania subskrypcją Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego zachowania wykonywania agentów GPT-5
summary: Używaj OpenAI za pomocą kluczy API lub subskrypcji Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-06-27T18:14:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f5346c6bb85341c4e1709e3023dee8b32a413189d5564778e9c919b7eaa78f1
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia interfejsy API dla deweloperów dla modeli GPT, a Codex jest także dostępny jako
agent programistyczny w planie ChatGPT przez klientów Codex OpenAI. OpenClaw używa jednego
identyfikatora providera, `openai`, dla obu kształtów uwierzytelniania.

OpenClaw używa `openai/*` jako kanonicznej trasy modelu OpenAI. Osadzone tury agenta
na modelach OpenAI domyślnie działają przez natywne środowisko wykonawcze serwera aplikacji Codex;
bezpośrednie uwierzytelnianie kluczem API OpenAI pozostaje dostępne dla powierzchni OpenAI
niebędących agentami, takich jak obrazy, osadzenia, mowa i realtime.

- **Modele agenta** - modele `openai/*` przez środowisko wykonawcze Codex; zaloguj się za pomocą
  uwierzytelniania Codex do użycia subskrypcji ChatGPT/Codex albo skonfiguruj zgodny z Codex
  zapasowy profil klucza API OpenAI, gdy celowo chcesz używać uwierzytelniania kluczem API.
- **Interfejsy API OpenAI niebędące agentami** - bezpośredni dostęp do OpenAI Platform z rozliczaniem
  według użycia przez `OPENAI_API_KEY` albo onboarding klucza API OpenAI.
- **Starsza konfiguracja** - starsze referencje modeli Codex są naprawiane przez
  `openclaw doctor --fix` do `openai/*` oraz środowiska wykonawczego Codex.

OpenAI jawnie obsługuje użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i przepływach pracy takich jak OpenClaw.

Provider, model, środowisko wykonawcze i kanał to oddzielne warstwy. Jeśli te etykiety
zaczynają się mieszać, przed zmianą konfiguracji przeczytaj [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes).

## Szybki wybór

| Cel                                                  | Użyj                                                     | Uwagi                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem wykonawczym Codex | `openai/gpt-5.5`                                         | Domyślna konfiguracja agenta OpenAI. Zaloguj się uwierzytelnianiem Codex. |
| Bezpośrednie rozliczanie kluczem API dla modeli agenta | `openai/gpt-5.5` plus zgodny z Codex profil klucza API | Użyj `auth.order.openai`, aby umieścić zapas po uwierzytelnianiu subskrypcyjnym. |
| Bezpośrednie rozliczanie kluczem API przez jawne OpenClaw | `openai/gpt-5.5` plus środowisko wykonawcze providera/modelu `openclaw` | Wybierz zwykły profil klucza API `openai`.                             |
| Najnowszy alias API ChatGPT Instant                  | `openai/chat-latest`                                     | Tylko bezpośredni klucz API. Ruchomy alias do eksperymentów, nie domyślny. |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez OpenClaw | `openai/gpt-5.5` plus środowisko wykonawcze providera/modelu `openclaw` | Wybierz profil OAuth `openai` dla trasy zgodności.                      |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                                     | Działa z `OPENAI_API_KEY` albo OpenAI Codex OAuth.                      |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                                   | Użyj `outputFormat=png` lub `webp` oraz `openai.background=transparent`. |

## Mapa nazewnictwa

Nazwy są podobne, ale nie są wymienne:

| Nazwa, którą widzisz                    | Warstwa           | Znaczenie                                                                                         |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks providera | Kanoniczna trasa modelu OpenAI; tury agenta używają środowiska wykonawczego Codex.                |
| starszy prefiks OpenAI Codex            | Starszy prefiks   | Starsza przestrzeń nazw modeli/profili. `openclaw doctor --fix` migruje ją do `openai`.           |
| Plugin `codex`                          | Plugin            | Wbudowany Plugin OpenClaw, który zapewnia natywne środowisko wykonawcze serwera aplikacji Codex i kontrolki czatu `/codex`. |
| provider/model `agentRuntime.id: codex` | Środowisko wykonawcze agenta | Wymusza natywny harness serwera aplikacji Codex dla pasujących osadzonych tur.                    |
| `/codex ...`                            | Zestaw poleceń czatu | Przypina/kontroluje wątki serwera aplikacji Codex z rozmowy.                                      |
| `runtime: "acp", agentId: "codex"`      | Trasa sesji ACP   | Jawna ścieżka awaryjna uruchamiająca Codex przez ACP/acpx.                                        |

Oznacza to, że konfiguracja może celowo zawierać referencje modeli `openai/*`, podczas gdy
profile uwierzytelniania wskazują poświadczenia klucza API albo OAuth ChatGPT/Codex. Użyj
`auth.order.openai` do konfiguracji; `openclaw doctor --fix` przepisuje starsze
starsze referencje modeli Codex, starsze identyfikatory profili uwierzytelniania Codex oraz
starszą kolejność uwierzytelniania Codex do kanonicznej trasy OpenAI.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API OpenAI Platform, jak i
trasy subskrypcyjne/OAuth. Dla subskrypcji ChatGPT/Codex oraz natywnego wykonywania Codex
użyj `openai/gpt-5.5`; brak ustawionej konfiguracji środowiska wykonawczego wybiera teraz harness Codex
dla tur agenta OpenAI. Używaj profili klucza API OpenAI tylko wtedy, gdy chcesz
bezpośrednie uwierzytelnianie kluczem API dla modelu agenta OpenAI.
</Note>

<Note>
Tury modeli agenta OpenAI wymagają wbudowanego Pluginu serwera aplikacji Codex. Jawna
konfiguracja środowiska wykonawczego OpenClaw pozostaje dostępna jako opcjonalna trasa zgodności. Gdy OpenClaw jest
jawnie wybrane z profilem OAuth `openai`, OpenClaw zachowuje
publiczną referencję modelu jako `openai/*` i wewnętrznie trasuje przez transport
uwierzytelniany przez Codex. Uruchom `openclaw doctor --fix`, aby naprawić przestarzałe
starsze referencje modeli Codex, `codex-cli/*` albo stare przypięcia sesji środowiska wykonawczego, które nie pochodzą z
jawnej konfiguracji środowiska wykonawczego.
</Note>

## Zakres funkcji OpenClaw

| Możliwość OpenAI         | Powierzchnia OpenClaw                                                                         | Status                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Czat / Responses          | provider modeli `openai/<model>`                                                             | Tak                                                                    |
| Modele subskrypcji Codex  | `openai/<model>` z OpenAI OAuth                                                               | Tak                                                                    |
| Starsze referencje modeli Codex | starsze referencje modeli Codex lub `codex-cli/<model>`                                  | Naprawiane przez doctor do `openai/<model>`                            |
| Harness serwera aplikacji Codex | `openai/<model>` z pominiętym środowiskiem wykonawczym lub provider/model `agentRuntime.id: codex` | Tak                                                                    |
| Wyszukiwanie web po stronie serwera | Natywne narzędzie OpenAI Responses                                                   | Tak, gdy wyszukiwanie web jest włączone i nie przypięto providera      |
| Obrazy                    | `image_generate`                                                                              | Tak                                                                    |
| Wideo                     | `video_generate`                                                                              | Tak                                                                    |
| Zamiana tekstu na mowę    | `messages.tts.provider: "openai"` / `tts`                                                     | Tak                                                                    |
| Wsadowa zamiana mowy na tekst | `tools.media.audio` / rozumienie mediów                                                   | Tak                                                                    |
| Strumieniowa zamiana mowy na tekst | Voice Call `streaming.provider: "openai"`                                            | Tak                                                                    |
| Głos realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Tak (wymaga kredytów OpenAI Platform, nie subskrypcji Codex/ChatGPT)   |
| Osadzenia                 | provider osadzeń pamięci                                                                      | Tak                                                                    |

<Note>
  Głos OpenAI Realtime (używany przez `realtime.provider: "openai"` w Voice Call oraz
  Control UI Talk z `talk.realtime.provider: "openai"`) przechodzi przez
  publiczny **OpenAI Platform Realtime API**, który jest rozliczany z kredytów OpenAI
  Platform, a nie z limitu subskrypcji Codex/ChatGPT. Konto
  ze sprawnym OpenAI OAuth, które bez problemu uruchamia modele czatu oparte na Codex,
  nadal potrzebuje profilu uwierzytelniania kluczem API OpenAI albo klucza API Platform z opłaconym
  rozliczaniem Platform dla głosu realtime.

Poprawka: doładuj kredyty Platform pod adresem
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
dla organizacji obsługującej twoje poświadczenia realtime. Głos realtime akceptuje
profil uwierzytelniania kluczem API `openai` utworzony przez `openclaw onboard --auth-choice openai-api-key`,
klucz Platform `OPENAI_API_KEY` skonfigurowany przez `talk.realtime.providers.openai.apiKey`
dla Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
dla Voice Call albo zmienną środowiskową `OPENAI_API_KEY`. Profile OpenAI OAuth
nadal mogą uruchamiać modele czatu `openai/*` oparte na Codex w tej samej
instalacji OpenClaw, ale nie konfigurują głosu realtime.
</Note>

## Osadzenia pamięci

OpenClaw może używać OpenAI albo zgodnego z OpenAI endpointu osadzeń do
indeksowania `memory_search` i osadzeń zapytań:

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

Dla zgodnych z OpenAI endpointów, które wymagają asymetrycznych etykiet osadzeń, ustaw
`queryInputType` i `documentInputType` pod `memorySearch`. OpenClaw przekazuje
je jako specyficzne dla providera pola żądania `input_type`: osadzenia zapytań używają
`queryInputType`; indeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Pełny przykład znajdziesz w [referencji konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config).

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze do:** bezpośredniego dostępu API i rozliczania według użycia.

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

    ### Podsumowanie tras

    | Referencja modelu      | Konfiguracja środowiska wykonawczego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | pominięte / provider/model `agentRuntime.id: "codex"` | Harness serwera aplikacji Codex | Zgodny z Codex profil OpenAI |
    | `openai/gpt-5.4-mini` | pominięte / provider/model `agentRuntime.id: "codex"` | Harness serwera aplikacji Codex | Zgodny z Codex profil OpenAI |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | Osadzone środowisko wykonawcze OpenClaw | Wybrany profil `openai` |

    <Note>
    Modele agentów `openai/*` używają harnessu app-servera Codex. Aby użyć
    uwierzytelniania kluczem API dla modelu agenta, utwórz profil klucza API
    zgodny z Codex i uporządkuj go za pomocą `auth.order.openai`; `OPENAI_API_KEY`
    pozostaje bezpośrednim mechanizmem fallback dla powierzchni OpenAI API
    innych niż agentowe. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
    wpisy kolejności uwierzytelniania legacy Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Aby wypróbować bieżący model Instant ChatGPT z OpenAI API, ustaw model
    na `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` jest zmiennym aliasem. OpenAI dokumentuje go jako najnowszy
    model Instant używany w ChatGPT i zaleca `gpt-5.5` do produkcyjnego użycia
    API, więc zachowaj `openai/gpt-5.5` jako stabilną wartość domyślną, chyba że
    wyraźnie chcesz zachowania tego aliasu. Alias obecnie akceptuje tylko
    `medium` dla szczegółowości tekstu, więc OpenClaw normalizuje niezgodne
    nadpisania szczegółowości tekstu OpenAI dla tego modelu.

    <Warning>
    OpenClaw **nie** udostępnia `gpt-5.3-codex-spark` na bezpośredniej trasie klucza API OpenAI. Jest dostępny tylko przez wpisy katalogu subskrypcji Codex, gdy zalogowane konto go udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze do:** używania subskrypcji ChatGPT/Codex z natywnym wykonywaniem app-servera Codex zamiast osobnego klucza API. Chmura Codex wymaga logowania ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai
        ```

        W konfiguracjach headless lub nieprzyjaznych wywołaniom zwrotnym dodaj `--device-code`, aby zalogować się przepływem kodu urządzenia ChatGPT zamiast lokalnego wywołania zwrotnego w przeglądarce:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Użyj kanonicznej trasy modelu OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Dla ścieżki domyślnej nie jest wymagana konfiguracja runtime. Tury agentów
        OpenAI automatycznie wybierają natywny runtime app-servera Codex, a OpenClaw
        instaluje lub naprawia dołączony Plugin Codex, gdy ta trasa zostanie wybrana.
      </Step>
      <Step title="Sprawdź, czy uwierzytelnianie Codex jest dostępne">
        ```bash
        openclaw models list --provider openai
        ```

        Po uruchomieniu gatewaya wyślij `/codex status` lub `/codex models`
        na czacie, aby sprawdzić natywny runtime app-servera.
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Odwołanie modelu | Konfiguracja runtime | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | pominięta / provider/model `agentRuntime.id: "codex"` | Natywny harness app-servera Codex | Logowanie Codex lub uporządkowany profil uwierzytelniania `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | Osadzony runtime OpenClaw z wewnętrznym transportem uwierzytelniania Codex | Wybrany profil OAuth `openai` |
    | legacy odwołanie Codex GPT-5.5 | naprawiane przez doctor | Trasa legacy przepisana na `openai/gpt-5.5` | Zmigrowany profil OAuth OpenAI |
    | `codex-cli/gpt-5.5` | naprawiane przez doctor | Trasa CLI legacy przepisana na `openai/gpt-5.5` | Uwierzytelnianie app-servera Codex |

    <Warning>
    Preferuj `openai/gpt-5.5` dla nowej konfiguracji agenta opartej na subskrypcji.
    Starsze odwołania legacy Codex GPT są trasami legacy OpenClaw, a nie natywną
    ścieżką runtime Codex; uruchom `openclaw doctor --fix`, gdy chcesz
    zmigrować je do kanonicznych odwołań `openai/*`. `gpt-5.3-codex-spark`
    pozostaje ograniczony do kont, których katalog subskrypcji Codex reklamuje
    ten model; bezpośrednie odwołania klucza API OpenAI i Azure dla niego
    pozostają ukryte.
    </Warning>

    <Note>
    Prefiks modelu legacy Codex to konfiguracja legacy naprawiana przez doctor.
    W typowej konfiguracji subskrypcji z natywnym runtime zaloguj się
    uwierzytelnianiem Codex, ale zachowaj odwołanie modelu jako `openai/gpt-5.5`.
    Nowa konfiguracja powinna umieszczać kolejność uwierzytelniania agentów
    OpenAI pod `auth.order.openai`; doctor migruje starsze wpisy kolejności
    uwierzytelniania legacy Codex.
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

    Z zapasowym kluczem API zachowaj model na `openai/gpt-5.5` i umieść
    kolejność uwierzytelniania pod `openai`. OpenClaw najpierw spróbuje
    subskrypcji, potem klucza API, pozostając na harnessie Codex:

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
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    Onboarding nie importuje już materiałów OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo powyższym przepływem kodu urządzenia — OpenClaw zarządza wynikowymi danymi uwierzytelniającymi we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Sprawdzanie i odzyskiwanie trasowania OAuth Codex

    Użyj tych poleceń, aby zobaczyć, którego modelu, runtime i trasy
    uwierzytelniania używa domyślny agent:

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Dla konkretnego agenta dodaj `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Jeśli starsza konfiguracja nadal ma odwołania legacy Codex GPT albo
    przestarzałe przypięcie sesji runtime OpenAI bez jawnej konfiguracji
    runtime, napraw ją:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jeśli `models auth list --provider openai` nie pokazuje użytecznego profilu,
    zaloguj się ponownie:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Użyj `--profile-id`, gdy chcesz mieć wiele logowań OAuth Codex w tym samym
    agencie i później sterować nimi przez kolejność uwierzytelniania lub
    `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` jest trasą modelu dla tur agentów OpenAI przez Codex. Uruchom
    `openclaw doctor --fix`, aby zmigrować starsze identyfikatory profili z
    prefiksem legacy OpenAI Codex oraz wpisy kolejności przed poleganiem na
    kolejności profili.

    ### Wskaźnik stanu

    Czatowe `/status` pokazuje, który runtime modelu jest aktywny dla bieżącej
    sesji. Dołączony harness app-servera Codex pojawia się jako `Runtime: OpenAI Codex`
    dla tur modeli agentów OpenAI. Przestarzałe przypięcia sesji runtime OpenAI
    są naprawiane do Codex, chyba że konfiguracja jawnie przypina OpenClaw.

    ### Ostrzeżenie doctor

    Jeśli odwołania modeli legacy Codex lub przestarzałe przypięcia runtime
    OpenAI pozostają w konfiguracji albo stanie sesji, `openclaw doctor --fix`
    przepisuje je na `openai/*` z runtime Codex, chyba że OpenClaw jest jawnie
    skonfigurowany.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu runtime jako osobne wartości.

    Dla `openai/gpt-5.5` przez katalog OAuth Codex:

    - Natywny `contextWindow`: `1000000`
    - Domyślny limit runtime `contextTokens`: `272000`

    Mniejszy domyślny limit w praktyce daje lepszą latencję i charakterystykę jakości. Nadpisz go za pomocą `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
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
    obecne. Jeśli wykrywanie live Codex pomija wiersz `gpt-5.5`, gdy konto
    jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    uruchomienia cron, sub-agentów i skonfigurowanego modelu domyślnego nie
    kończyły się błędem `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie app-servera Codex

Natywny harness app-servera Codex używa odwołań modeli `openai/*` oraz
pominiętej konfiguracji runtime albo provider/model `agentRuntime.id: "codex"`,
ale jego uwierzytelnianie nadal jest oparte na koncie. OpenClaw wybiera
uwierzytelnianie w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
   identyfikatory profili uwierzytelniania legacy Codex i kolejność
   uwierzytelniania legacy Codex.
2. Istniejące konto app-servera, na przykład lokalne logowanie ChatGPT w Codex CLI.
3. Tylko dla lokalnych uruchomień app-servera stdio: `CODEX_API_KEY`, a potem
   `OPENAI_API_KEY`, gdy app-server zgłasza brak konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcją ChatGPT/Codex nie jest zastępowane
tylko dlatego, że proces gatewaya ma również `OPENAI_API_KEY` dla bezpośrednich
modeli OpenAI lub osadzeń. Fallback klucza API ze środowiska dotyczy tylko
lokalnej ścieżki stdio bez konta; nie jest wysyłany do połączeń app-servera
WebSocket. Gdy wybrany jest profil Codex w stylu subskrypcyjnym, OpenClaw
utrzymuje również `CODEX_API_KEY` i `OPENAI_API_KEY` poza uruchomionym procesem
potomnym app-servera stdio i wysyła wybrane dane uwierzytelniające przez RPC
logowania app-servera. Gdy ten profil subskrypcji jest zablokowany przez limit
użycia Codex, OpenClaw może przełączyć się na następny uporządkowany profil
klucza API `openai:*` bez zmiany wybranego modelu i bez opuszczania harnessu
Codex. Po upływie czasu resetu subskrypcji profil subskrypcji znów kwalifikuje
się do użycia.

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje generowanie obrazów zarówno za pomocą klucza API OpenAI, jak i OAuth
Codex, przez to samo odwołanie modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                     | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odwołanie modelu                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie                      | `OPENAI_API_KEY`                   | Logowanie OpenAI Codex OAuth           |
| Transport                 | OpenAI Images API                  | Backend Codex Responses              |
| Maksymalna liczba obrazów na żądanie    | 4                                  | 4                                    |
| Tryb edycji                 | Włączony (do 5 obrazów referencyjnych) | Włączony (do 5 obrazów referencyjnych)   |
| Nadpisania rozmiaru            | Obsługiwane, w tym rozmiary 2K/4K   | Obsługiwane, w tym rozmiary 2K/4K     |
| Proporcje obrazu / rozdzielczość | Nieprzekazywane do OpenAI Images API | Mapowane na obsługiwany rozmiar, gdy jest to bezpieczne |

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

`gpt-image-2` jest wartością domyślną zarówno dla generowania obrazów z tekstu
OpenAI, jak i edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i
`gpt-image-1-mini` pozostają dostępne jako jawne nadpisania modelu. Użyj
`openai/gpt-image-1.5` dla wyjścia PNG/WebP z przezroczystym tłem; bieżące API
`gpt-image-2` odrzuca `background: "transparent"`.

W przypadku żądania przezroczystego tła agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni też publiczne trasy OAuth OpenAI i
OpenAI Codex, przepisując domyślne żądania przezroczystości `openai/gpt-image-2`
na `gpt-image-1.5`; Azure i niestandardowe punkty końcowe zgodne z OpenAI
zachowują skonfigurowane nazwy wdrożeń/modeli.

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
Użyj `--quality low|medium|high|auto`, gdy musisz kontrolować jakość i koszt
OpenAI Images. Użyj `--openai-moderation low|auto`, aby przekazać specyficzną
dla dostawcy wskazówkę moderacji OpenAI z `image generate` albo `image edit`.

W przypadku instalacji OAuth ChatGPT/Codex zachowaj tę samą referencję
`openai/gpt-image-2`. Gdy skonfigurowany jest profil OAuth `openai`, OpenClaw
rozwiązuje zapisany token dostępu OAuth i wysyła żądania obrazów przez backend
Codex Responses. Dla tego żądania nie próbuje najpierw `OPENAI_API_KEY` ani po
cichu nie wraca do klucza API. Skonfiguruj jawnie `models.providers.openai` z
kluczem API, niestandardowym bazowym adresem URL albo punktem końcowym Azure,
gdy zamiast tego chcesz używać bezpośredniej trasy OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się pod zaufanym adresem
LAN/prywatnym, ustaw także
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw pozostawia
prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI zablokowane, chyba że
ta zgoda opt-in jest obecna.

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

Dołączony Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość          | Wartość                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| Model domyślny     | `openai/sora-2`                                                                   |
| Tryby              | Tekst na wideo, obraz na wideo, edycja pojedynczego wideo                         |
| Wejścia referencyjne | 1 obraz lub 1 wideo                                                             |
| Nadpisania rozmiaru | Obsługiwane dla tekstu na wideo i obrazu na wideo                                |
| Inne nadpisania    | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

Żądania OpenAI obraz na wideo używają `POST /v1/videos` z obrazem
`input_reference`. Edycje pojedynczego wideo używają `POST /v1/videos/edits` z
przesłanym wideo w polu `video`.

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

OpenClaw dodaje współdzielony wkład promptu GPT-5 dla uruchomień z rodziny GPT-5 na powierzchniach promptów składanych przez OpenClaw. Jest stosowany według identyfikatora modelu, więc trasy OpenClaw/dostawcy, takie jak starsze referencje sprzed naprawy (starsza referencja Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne referencje GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny harness Codex nie otrzymuje tej nakładki OpenClaw GPT-5 przez instrukcje deweloperskie serwera aplikacji Codex. Natywny Codex zachowuje bazowe zachowanie, model i dokumentację projektu należące do Codex, a OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków, aby pliki osobowości przestrzeni roboczej agenta pozostały autorytatywne. OpenClaw wnosi tylko kontekst wykonawczy, taki jak dostarczanie kanałami, dynamiczne narzędzia OpenClaw, delegowanie ACP, kontekst przestrzeni roboczej i Skills OpenClaw.

Wkład GPT-5 dodaje oznaczony kontrakt zachowania dla trwałości persony, bezpieczeństwa wykonania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji w pasujących promptach składanych przez OpenClaw. Zachowanie odpowiedzi specyficzne dla kanału i zachowanie wiadomości cichych pozostaje we współdzielonym prompcie systemowym OpenClaw oraz polityce dostarczania wychodzącego. Przyjazna warstwa stylu interakcji jest oddzielna i konfigurowalna.

| Wartość                  | Efekt                                      |
| ------------------------ | ------------------------------------------ |
| `"friendly"` (domyślnie) | Włącza przyjazną warstwę stylu interakcji  |
| `"on"`                   | Alias dla `"friendly"`                     |
| `"off"`                  | Wyłącza tylko przyjazną warstwę stylu      |

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
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako fallback zgodności, gdy współdzielone ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
</Note>

## Głos i mowa

<AccordionGroup>
  <Accordion title="Synteza mowy (TTS)">
    Dołączony Plugin `openai` rejestruje syntezę mowy dla powierzchni `messages.tts`.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Głos | `messages.tts.providers.openai.speakerVoice` | `coral` |
    | Szybkość | `messages.tts.providers.openai.speed` | (nieustawione) |
    | Instrukcje | `messages.tts.providers.openai.instructions` | (nieustawione, tylko `gpt-4o-mini-tts`) |
    | Format | `messages.tts.providers.openai.responseFormat` | `opus` dla notatek głosowych, `mp3` dla plików |
    | Klucz API | `messages.tts.providers.openai.apiKey` | Wraca do `OPENAI_API_KEY` |
    | Bazowy URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | Dodatkowe body | `messages.tts.providers.openai.extraBody` / `extra_body` | (nieustawione) |

    Dostępne modele: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Dostępne głosy: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` jest scalane z JSON żądania `/audio/speech` po polach wygenerowanych przez OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypów są ignorowane.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływania na punkt końcowy API czatu. OpenAI TTS i głos Realtime są konfigurowane przez klucz API OpenAI Platform; instalacje wyłącznie OAuth nadal mogą używać modeli czatu wspieranych przez Codex, ale nie OpenAI live talk-back.
    </Note>

  </Accordion>

  <Accordion title="Mowa na tekst">
    Dołączony Plugin `openai` rejestruje wsadową transkrypcję mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejścia: przesyłanie wieloczęściowego pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie transkrypcja przychodzącego audio używa
      `tools.media.audio`, w tym segmentów kanałów głosowych Discord i załączników
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

    Wskazówki języka i promptu są przekazywane do OpenAI, gdy zostaną dostarczone przez
    współdzieloną konfigurację mediów audio lub żądanie transkrypcji dla pojedynczego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja Realtime">
    Dołączony Plugin `openai` rejestruje transkrypcję Realtime dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Uwierzytelnianie | `...openai.apiKey`, `OPENAI_API_KEY` lub OAuth `openai` | Klucze API łączą się bezpośrednio; OAuth wystawia sekret klienta transkrypcji Realtime |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z audio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Gdy skonfigurowany jest tylko OAuth `openai`, Gateway wystawia efemeryczny sekret klienta transkrypcji Realtime przed otwarciem WebSocket. Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji Realtime Pluginu Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa ścieżki transkrypcji wsadowej `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos Realtime">
    Dołączony Plugin `openai` rejestruje głos Realtime dla Pluginu Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura (most wdrożenia Azure) | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Dopełnienie prefiksu | `...openai.prefixPaddingMs` | `300` |
    | Wysiłek rozumowania | `...openai.reasoningEffort` | (nieustawione) |
    | Uwierzytelnianie | Profil uwierzytelniania kluczem API `openai`, `...openai.apiKey` lub `OPENAI_API_KEY` | Wymagany klucz API OpenAI Platform; OAuth OpenAI nie konfiguruje głosu Realtime |

    Dostępne wbudowane głosy Realtime dla `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI zaleca `marin` i `cedar` dla najlepszej jakości Realtime. To jest
    oddzielny zestaw względem powyższych głosów Text-to-speech; nie zakładaj, że głos TTS
    taki jak `fable`, `nova` lub `onyx` jest prawidłowy dla sesji Realtime.

    <Note>
    Backendowe mosty OpenAI realtime używają kształtu sesji GA Realtime WebSocket, który nie akceptuje `session.temperature`. Wdrożenia Azure OpenAI pozostają dostępne przez `azureEndpoint` i `azureDeployment` oraz zachowują kształt sesji zgodny z wdrożeniem. Obsługuje dwukierunkowe wywoływanie narzędzi i audio G.711 u-law.
    </Note>

    <Note>
    Głos Realtime jest wybierany podczas tworzenia sesji. OpenAI pozwala później zmienić większość
    pól sesji, ale głosu nie można zmienić po tym, jak model wyemituje audio w tej sesji.
    OpenClaw obecnie udostępnia wbudowane identyfikatory głosów Realtime jako ciągi znaków.
    </Note>

    <Note>
    Control UI Talk używa sesji OpenAI w przeglądarce w czasie rzeczywistym z
    efemerycznym sekretem klienta wygenerowanym przez Gateway oraz bezpośrednią
    wymianą WebRTC SDP przeglądarki z OpenAI Realtime API. Gateway generuje ten
    sekret klienta przy użyciu wybranego profilu uwierzytelniania kluczem API
    `openai` albo skonfigurowanego klucza API OpenAI Platform. Przekaźnik
    Gateway i mostki WebSocket czasu rzeczywistego zaplecza Voice Call używają
    tej samej ścieżki uwierzytelniania wyłącznie kluczem API dla natywnych
    punktów końcowych OpenAI. Weryfikacja na żywo dla maintainerów jest dostępna
    przez
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    ścieżki OpenAI weryfikują zarówno mostek WebSocket zaplecza, jak i wymianę
    WebRTC SDP w przeglądarce bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony dostawca `openai` może kierować generowanie obrazów do zasobu Azure
OpenAI przez nadpisanie bazowego adresu URL. Na ścieżce generowania obrazów
OpenClaw wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i
automatycznie przełącza się na format żądań Azure.

<Note>
Głos w czasie rzeczywistym używa osobnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie podlega wpływowi `models.providers.openai.baseUrl`. Ustawienia Azure
znajdziesz w akordeonie **Głos w czasie rzeczywistym** w sekcji
[Głos i mowa](#voice-and-speech).
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję, limit lub umowę enterprise Azure OpenAI
- Potrzebujesz regionalnej rezydencji danych albo mechanizmów zgodności
  zapewnianych przez Azure
- Chcesz utrzymać ruch w istniejącym tenantcie Azure

### Konfiguracja

Aby generować obrazy przez Azure za pomocą dołączonego dostawcy `openai`,
ustaw `models.providers.openai.baseUrl` na swój zasób Azure i ustaw `apiKey`
na klucz Azure OpenAI (nie klucz OpenAI Platform):

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

OpenClaw rozpoznaje następujące sufiksy hostów Azure dla trasy generowania
obrazów Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Dla żądań generowania obrazów na rozpoznanym hoście Azure OpenClaw:

- Wysyła nagłówek `api-key` zamiast `Authorization: Bearer`
- Używa ścieżek ograniczonych do wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów
  Azure. Wartości `timeoutMs` ustawione dla pojedynczego wywołania nadal
  nadpisują tę wartość domyślną.

Inne bazowe adresy URL (publiczne OpenAI, proxy zgodne z OpenAI) zachowują
standardowy format żądania obrazów OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów dostawcy `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i zakończą się błędem przy
wdrożeniach obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję preview lub GA
Azure dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Domyślna wartość to `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
routowanych przez dołączonego dostawcę `openai` pole `model` w OpenClaw musi
być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie publicznym
identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje
`gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów routowanych
przez dołączonego dostawcę `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w części regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia sprawdź aktualną listę regionów
Microsoftu i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje dozwolone przez publiczne OpenAI (na przykład niektóre
wartości `background` w `gpt-image-2`) albo udostępniać je tylko w konkretnych
wersjach modelu. Te różnice wynikają z Azure i modelu bazowego, a nie z
OpenClaw. Jeśli żądanie Azure zakończy się błędem walidacji, sprawdź zestaw
parametrów obsługiwany przez konkretne wdrożenie i wersję API w portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie
otrzymuje ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon
**Trasy natywne a zgodne z OpenAI** w sekcji
[Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu czatu lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu onboardingu albo dedykowanej konfiguracji dostawcy Azure —
samo `openai.baseUrl` nie włącza formatu API/uwierzytelniania Azure. Istnieje
osobny dostawca `azure-openai-responses/*`; zobacz akordeon Compaction po
stronie serwera poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket a SSE)">
    OpenClaw używa najpierw WebSocket z awaryjnym przełączeniem na SSE (`"auto"`)
    dla `openai/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przełączeniem awaryjnym na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas okresu wyciszenia
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień oraz ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, przełączenie awaryjne na SSE |
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
    OpenClaw udostępnia wspólny przełącznik trybu szybkiego dla `openai/*`:

    - **Czat/UI:** `/fast status|auto|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na priorytetowe przetwarzanie OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`. `fastMode: "auto"` uruchamia nowe wywołania modelu szybko do progu automatycznego, a późniejsze wywołania ponowienia, fallbacku, wyniku narzędzia lub kontynuacji uruchamia bez trybu szybkiego. Próg domyślnie wynosi 60 sekund; ustaw `params.fastAutoOnSeconds` na aktywnym modelu, aby go zmienić.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
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
    API OpenAI udostępnia przetwarzanie priorytetowe przez `service_tier`. Ustaw je per model w OpenClaw:

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
    `serviceTier` jest przekazywany tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz dowolnego z tych dostawców przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia OpenClaw w Plugin OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (albo `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki runtime OpenClaw oraz hooków dostawcy OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany przez domyślną trasę agenta OpenAI albo politykę runtime dostawcy/modelu.

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

  <Accordion title="Tryb ścisły agentic GPT">
    Dla uruchomień z rodziny GPT-5 na `openai/*` OpenClaw może używać bardziej rygorystycznego osadzonego kontraktu wykonania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Przy `strict-agentic` OpenClaw:
    - Automatycznie włącza `update_plan` dla większych prac
    - Ponawia strukturalnie puste tury albo tury zawierające tylko rozumowanie z kontynuacją widocznej odpowiedzi
    - Używa jawnych zdarzeń planu harnessu, gdy wybrany harness je udostępnia

    OpenClaw nie klasyfikuje prozy asystenta, aby zdecydować, czy tura jest planem, aktualizacją postępu, czy odpowiedzią końcową.

    <Note>
    Ograniczone tylko do uruchomień OpenAI i Codex z rodziny GPT-5. Inni dostawcy i starsze rodziny modeli zachowują domyślne zachowanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących wysiłek OpenAI `none`
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych hostach natywnych
    - Zachowują formatowanie żądań specyficzne dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używaj luźniejszego zachowania zgodności
    - Usuń `store` Completions z nienatywnych payloadów `openai-completions`
    - Akceptuj przekazywany JSON zaawansowanych `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptuj `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszaj ścisłych schematów narzędzi ani nagłówków wyłącznie natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Wspólne parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Wspólne parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="OAuth i uwierzytelnianie" href="/pl/gateway/authentication" icon="key">
    Szczegóły uwierzytelniania i reguły ponownego używania danych uwierzytelniających.
  </Card>
</CardGroup>
