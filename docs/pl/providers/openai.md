---
read_when:
    - Chcesz używać modeli OpenAI w OpenClaw
    - Chcesz używać uwierzytelniania za pomocą subskrypcji Codex zamiast kluczy API
    - Potrzebujesz bardziej rygorystycznego sposobu działania agenta GPT-5 podczas wykonywania zadań
summary: Używanie OpenAI przez klucze API lub subskrypcję Codex w OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-01T08:38:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7078798b1d73bd1efca4820eae6d3fb6510e802b2c9193d0c135d8ab28c58fca
    source_path: providers/openai.md
    workflow: 16
---

OpenAI udostępnia deweloperskie API dla modeli GPT, a Codex jest także dostępny jako
agent kodujący w planie ChatGPT przez klientów Codex firmy OpenAI. OpenClaw używa jednego
identyfikatora dostawcy, `openai`, dla obu kształtów uwierzytelniania.

OpenClaw używa `openai/*` jako kanonicznej trasy modeli OpenAI. Osadzone tury agentów
na modelach OpenAI domyślnie działają przez natywne środowisko uruchomieniowe serwera aplikacji Codex;
bezpośrednie uwierzytelnianie kluczem API OpenAI pozostaje dostępne dla nieagentowych
powierzchni OpenAI, takich jak obrazy, osadzania, mowa i realtime.

- **Modele agentów** - modele `openai/*` przez środowisko uruchomieniowe Codex; zaloguj się przy użyciu
  uwierzytelniania Codex do korzystania z subskrypcji ChatGPT/Codex albo skonfiguruj zgodny z Codex
  zapasowy profil klucza API OpenAI, gdy celowo chcesz używać uwierzytelniania kluczem API.
- **Nieagentowe API OpenAI** - bezpośredni dostęp do OpenAI Platform z rozliczaniem
  na podstawie użycia przez `OPENAI_API_KEY` albo wdrożenie klucza API OpenAI.
- **Konfiguracja legacy** - starsze odwołania do modeli Codex są naprawiane przez
  `openclaw doctor --fix` do `openai/*` oraz środowiska uruchomieniowego Codex.

OpenAI jawnie obsługuje użycie subskrypcyjnego OAuth w zewnętrznych narzędziach i przepływach pracy, takich jak OpenClaw.

Dostawca, model, środowisko uruchomieniowe i kanał to osobne warstwy. Jeśli te etykiety są
mieszane, przeczytaj [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes) przed
zmianą konfiguracji.

## Szybki wybór

| Cel                                                  | Użyj                                                     | Uwagi                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| Subskrypcja ChatGPT/Codex z natywnym środowiskiem uruchomieniowym Codex | `openai/gpt-5.5`                                         | Domyślna konfiguracja agenta OpenAI. Zaloguj się przy użyciu uwierzytelniania Codex. |
| Ograniczona wersja zapoznawcza GPT-5.6               | `openai/gpt-5.6-sol`, `-terra` lub `-luna`               | Wymaga organizacji API zatwierdzonej przez OpenAI albo obszaru roboczego Codex. |
| Bezpośrednie rozliczanie kluczem API dla modeli agentów | `openai/gpt-5.5` plus zgodny z Codex profil klucza API | Użyj `auth.order.openai`, aby umieścić zapas po uwierzytelnianiu subskrypcyjnym. |
| Bezpośrednie rozliczanie kluczem API przez jawne OpenClaw | `openai/gpt-5.5` plus środowisko uruchomieniowe dostawcy/modelu `openclaw` | Wybierz normalny profil klucza API `openai`. |
| Najnowszy alias API ChatGPT Instant                  | `openai/chat-latest`                                     | Tylko bezpośredni klucz API. Ruchomy alias do eksperymentów, nie domyślny. |
| Uwierzytelnianie subskrypcji ChatGPT/Codex przez OpenClaw | `openai/gpt-5.5` plus środowisko uruchomieniowe dostawcy/modelu `openclaw` | Wybierz profil OAuth `openai` dla trasy zgodności. |
| Generowanie lub edycja obrazów                       | `openai/gpt-image-2`                                     | Działa z `OPENAI_API_KEY` albo OAuth OpenAI Codex. |
| Obrazy z przezroczystym tłem                         | `openai/gpt-image-1.5`                                   | Użyj `outputFormat=png` lub `webp` i `openai.background=transparent`. |

## Mapa nazw

Nazwy są podobne, ale nie są zamienne:

| Nazwa, którą widzisz                    | Warstwa           | Znaczenie                                                                                         |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | Prefiks dostawcy  | Kanoniczna trasa modeli OpenAI; tury agentów używają środowiska uruchomieniowego Codex.          |
| starszy prefiks OpenAI Codex            | Starszy prefiks   | Starsza przestrzeń nazw modeli/profili. `openclaw doctor --fix` migruje ją do `openai`.          |
| Plugin `codex`                          | Plugin            | Dołączony Plugin OpenClaw, który udostępnia natywne środowisko uruchomieniowe serwera aplikacji Codex i kontrolki czatu `/codex`. |
| dostawca/model `agentRuntime.id: codex` | Środowisko uruchomieniowe agenta | Wymusza natywną uprząż serwera aplikacji Codex dla pasujących osadzonych tur. |
| `/codex ...`                            | Zestaw poleceń czatu | Powiąż/kontroluj wątki serwera aplikacji Codex z rozmowy.                                       |
| `runtime: "acp", agentId: "codex"`      | Trasa sesji ACP   | Jawna ścieżka awaryjna, która uruchamia Codex przez ACP/acpx.                                    |

Oznacza to, że konfiguracja może celowo zawierać odwołania do modeli `openai/*`, podczas gdy
profile uwierzytelniania wskazują na dane uwierzytelniające klucza API albo OAuth ChatGPT/Codex. Użyj
`auth.order.openai` do konfiguracji; `openclaw doctor --fix` przepisuje starsze
starsze odwołania do modeli Codex, starsze identyfikatory profili uwierzytelniania Codex i
starszą kolejność uwierzytelniania Codex na kanoniczną trasę OpenAI.

<Note>
GPT-5.5 jest dostępny zarówno przez bezpośredni dostęp kluczem API OpenAI Platform, jak i
trasy subskrypcji/OAuth. Dla subskrypcji ChatGPT/Codex oraz natywnego wykonywania Codex
użyj `openai/gpt-5.5`; nieustawiona konfiguracja środowiska uruchomieniowego wybiera teraz uprząż Codex
dla tur agentów OpenAI. Używaj profili klucza API OpenAI tylko wtedy, gdy chcesz
bezpośredniego uwierzytelniania kluczem API dla modelu agenta OpenAI.
</Note>

## Ograniczona wersja zapoznawcza GPT-5.6

OpenClaw rozpoznaje trzy publiczne identyfikatory modeli GPT-5.6:

- `openai/gpt-5.6-sol`
- `openai/gpt-5.6-terra`
- `openai/gpt-5.6-luna`

Wszystkie trzy udostępniają rozumowanie `max` w bieżącym katalogu serwera aplikacji Codex. Komunikat
OpenAI o premierze opisuje Sol jako poziom flagowy, Terra jako poziom
zrównoważony, a Luna jako szybki poziom o niższym koszcie. Zobacz
[komunikat o premierze GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
i [przewodnik dostępu do wersji zapoznawczej](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Dostęp jest przyznawany z listy dozwolonych podczas wersji zapoznawczej i może być nadany osobno dla
API oraz Codex. Sam płatny plan ChatGPT nie daje dostępu. OpenClaw zachowuje
`openai/gpt-5.5` jako domyślne; wybranie odwołania GPT-5.6 bez dostępu zwraca
błąd dostępu z upstreamu zamiast cicho przełączać się na alternatywę.

<Note>
Tury modeli agentów OpenAI wymagają dołączonego Plugin serwera aplikacji Codex. Jawna
konfiguracja środowiska uruchomieniowego OpenClaw pozostaje dostępna jako opcjonalna trasa zgodności. Gdy OpenClaw jest
jawnie wybrane z profilem OAuth `openai`, OpenClaw zachowuje
publiczne odwołanie do modelu jako `openai/*` i wewnętrznie trasuje przez transport
uwierzytelniania Codex. Uruchom `openclaw doctor --fix`, aby naprawić nieaktualne
starsze odwołania do modeli Codex, `codex-cli/*` albo stare przypięcia sesji środowiska uruchomieniowego, które nie pochodzą z
jawnej konfiguracji środowiska uruchomieniowego.
</Note>

## Zakres funkcji OpenClaw

| Możliwość OpenAI          | Powierzchnia OpenClaw                                                                         | Status                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Czat / Responses          | dostawca modelu `openai/<model>`                                                              | Tak                                                                    |
| Modele subskrypcji Codex  | `openai/<model>` z OpenAI OAuth                                                               | Tak                                                                    |
| Starsze odwołania do modeli Codex | starsze odwołania do modeli Codex lub `codex-cli/<model>`                              | Naprawiane przez doctor do `openai/<model>`                            |
| Uprząż serwera aplikacji Codex | `openai/<model>` z pominiętym środowiskiem uruchomieniowym albo `agentRuntime.id: codex` dostawcy/modelu | Tak                                                                    |
| Wyszukiwanie w sieci po stronie serwera | Natywne narzędzie OpenAI Responses                                                  | Tak, gdy wyszukiwanie w sieci jest włączone i nie przypięto dostawcy   |
| Obrazy                    | `image_generate`                                                                              | Tak                                                                    |
| Wideo                     | `video_generate`                                                                              | Tak                                                                    |
| Tekst na mowę             | `messages.tts.provider: "openai"` / `tts`                                                     | Tak                                                                    |
| Wsadowa mowa na tekst     | `tools.media.audio` / rozumienie mediów                                                       | Tak                                                                    |
| Strumieniowa mowa na tekst | Voice Call `streaming.provider: "openai"`                                                    | Tak                                                                    |
| Głos realtime             | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | Tak (wymaga środków OpenAI Platform, nie subskrypcji Codex/ChatGPT) |
| Osadzania                 | dostawca osadzania pamięci                                                                    | Tak                                                                    |

<Note>
  Głos realtime OpenAI (używany przez `realtime.provider: "openai"` w Voice Call i
  Control UI Talk z `talk.realtime.provider: "openai"`) przechodzi przez
  publiczne **API Realtime OpenAI Platform**, rozliczane ze środków OpenAI
  Platform zamiast z limitu subskrypcji Codex/ChatGPT. Konto
  ze zdrowym OAuth OpenAI, które bez problemów uruchamia modele czatu wspierane przez Codex,
  nadal potrzebuje profilu uwierzytelniania kluczem API OpenAI albo klucza API Platform z opłaconym
  rozliczaniem Platform dla głosu realtime.

Naprawa: doładuj środki Platform na
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
dla organizacji obsługującej twoje dane uwierzytelniające realtime. Głos realtime akceptuje
profil uwierzytelniania kluczem API `openai` utworzony przez `openclaw onboard --auth-choice openai-api-key`,
klucz Platform `OPENAI_API_KEY` skonfigurowany przez `talk.realtime.providers.openai.apiKey`
dla Control UI Talk, `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
dla Voice Call albo zmienną środowiskową `OPENAI_API_KEY`. Profile OAuth OpenAI
nadal mogą uruchamiać wspierane przez Codex modele czatu `openai/*` w tej samej
instalacji OpenClaw, ale nie konfigurują głosu realtime.
</Note>

## Osadzania pamięci

OpenClaw może używać OpenAI albo zgodnego z OpenAI punktu końcowego osadzania do
indeksowania `memory_search` i osadzań zapytań:

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

Dla zgodnych z OpenAI punktów końcowych, które wymagają asymetrycznych etykiet osadzania, ustaw
`queryInputType` i `documentInputType` pod `memorySearch`. OpenClaw przekazuje
je jako specyficzne dla dostawcy pola żądania `input_type`: osadzania zapytań używają
`queryInputType`; zaindeksowane fragmenty pamięci i indeksowanie wsadowe używają
`documentInputType`. Zobacz [odwołanie konfiguracji pamięci](/pl/reference/memory-config#provider-specific-config), aby poznać pełny przykład.

## Pierwsze kroki

Wybierz preferowaną metodę uwierzytelniania i wykonaj kroki konfiguracji.

<Tabs>
  <Tab title="Klucz API (OpenAI Platform)">
    **Najlepsze dla:** bezpośredniego dostępu do API i rozliczania na podstawie użycia.

    <Steps>
      <Step title="Uzyskaj klucz API">
        Utwórz albo skopiuj klucz API z [panelu OpenAI Platform](https://platform.openai.com/api-keys).
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

    | Odwołanie do modelu    | Konfiguracja środowiska wykonawczego | Trasa                       | Uwierzytelnianie |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | pominięta / provider/model `agentRuntime.id: "codex"` | mechanizm app-server Codex | profil OpenAI zgodny z Codex |
    | `openai/gpt-5.4-mini` | pominięta / provider/model `agentRuntime.id: "codex"` | mechanizm app-server Codex | profil OpenAI zgodny z Codex |
    | `openai/gpt-5.5`      | provider/model `agentRuntime.id: "openclaw"`              | osadzone środowisko wykonawcze OpenClaw      | wybrany profil `openai` |

    <Note>
    Modele agentów `openai/*` używają mechanizmu app-server Codex. Aby używać
    uwierzytelniania kluczem API dla modelu agenta, utwórz profil klucza API
    zgodny z Codex i ustaw jego kolejność przez `auth.order.openai`; `OPENAI_API_KEY`
    pozostaje bezpośrednim mechanizmem awaryjnym dla powierzchni API OpenAI
    innych niż agenty. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
    wpisy kolejności uwierzytelniania starszego typu Codex.
    </Note>

    ### Przykład konfiguracji

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    Aby wypróbować bieżący model Instant ChatGPT z API OpenAI, ustaw model
    na `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` to ruchomy alias. OpenAI dokumentuje go jako najnowszy model
    Instant używany w ChatGPT i zaleca `gpt-5.5` do produkcyjnego użycia API, więc
    zachowaj `openai/gpt-5.5` jako stabilną wartość domyślną, chyba że wyraźnie
    chcesz zachowania tego aliasu. Alias obecnie akceptuje tylko `medium` dla
    szczegółowości tekstu, więc OpenClaw normalizuje niezgodne nadpisania
    szczegółowości tekstu OpenAI dla tego modelu.

    <Warning>
    OpenClaw **nie** udostępnia `gpt-5.3-codex-spark` na bezpośredniej trasie klucza API OpenAI. Jest dostępny tylko przez wpisy katalogu subskrypcji Codex, gdy zalogowane konto go udostępnia.
    </Warning>

  </Tab>

  <Tab title="Subskrypcja Codex">
    **Najlepsze do:** używania subskrypcji ChatGPT/Codex z natywnym wykonywaniem app-server Codex zamiast osobnego klucza API. Chmura Codex wymaga zalogowania się w ChatGPT.

    <Steps>
      <Step title="Uruchom OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Albo uruchom OAuth bezpośrednio:

        ```bash
        openclaw models auth login --provider openai
        ```

        W konfiguracjach bez interfejsu graficznego lub nieprzyjaznych dla wywołań zwrotnych dodaj `--device-code`, aby zalogować się przepływem kodu urządzenia ChatGPT zamiast wywołania zwrotnego przeglądarki localhost:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Użyj kanonicznej trasy modelu OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        Dla domyślnej ścieżki nie jest wymagana żadna konfiguracja środowiska
        wykonawczego. Tury agentów OpenAI automatycznie wybierają natywne
        środowisko wykonawcze app-server Codex, a OpenClaw instaluje lub naprawia
        dołączony Plugin Codex, gdy ta trasa zostanie wybrana.
      </Step>
      <Step title="Sprawdź, czy uwierzytelnianie Codex jest dostępne">
        ```bash
        openclaw models list --provider openai
        ```

        Po uruchomieniu Gateway wyślij `/codex status` lub `/codex models`
        na czacie, aby zweryfikować natywne środowisko wykonawcze app-server.
      </Step>
    </Steps>

    ### Podsumowanie tras

    | Odwołanie do modelu | Konfiguracja środowiska wykonawczego | Trasa | Uwierzytelnianie |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | pominięta / provider/model `agentRuntime.id: "codex"` | natywny mechanizm app-server Codex | logowanie Codex lub uporządkowany profil uwierzytelniania `openai` |
    | `openai/gpt-5.5` | provider/model `agentRuntime.id: "openclaw"` | osadzone środowisko wykonawcze OpenClaw z wewnętrznym transportem uwierzytelniania Codex | wybrany profil OAuth `openai` |
    | starsze odwołanie Codex GPT-5.5 | naprawione przez doctor | starsza trasa przepisana na `openai/gpt-5.5` | zmigrowany profil OAuth OpenAI |
    | `codex-cli/gpt-5.5` | naprawione przez doctor | starsza trasa CLI przepisana na `openai/gpt-5.5` | uwierzytelnianie app-server Codex |

    <Warning>
    Preferuj `openai/gpt-5.5` dla nowej konfiguracji agentów opartej na subskrypcji. Starsze
    odwołania GPT Codex starszego typu to starsze trasy OpenClaw, a nie natywna ścieżka
    środowiska wykonawczego Codex; uruchom `openclaw doctor --fix`, gdy chcesz zmigrować je
    do kanonicznych odwołań `openai/*`. `gpt-5.3-codex-spark` pozostaje ograniczony do kont,
    których katalog subskrypcji Codex reklamuje ten model; bezpośredni klucz API OpenAI i
    odwołania Azure dla niego pozostają ukryte.
    </Warning>

    <Note>
    Prefiks modelu Codex starszego typu to starsza konfiguracja naprawiana przez doctor. W
    typowej konfiguracji subskrypcji z natywnym środowiskiem wykonawczym zaloguj się przez
    uwierzytelnianie Codex, ale pozostaw odwołanie do modelu jako `openai/gpt-5.5`. Nowa
    konfiguracja powinna umieszczać kolejność uwierzytelniania agentów OpenAI pod
    `auth.order.openai`; doctor migruje starsze wpisy kolejności uwierzytelniania
    starszego typu Codex.
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

    Z zapasowym kluczem API pozostaw model na `openai/gpt-5.5` i umieść
    kolejność uwierzytelniania pod `openai`. OpenClaw najpierw spróbuje subskrypcji,
    a potem klucza API, pozostając przy mechanizmie Codex:

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
    Onboarding nie importuje już materiału OAuth z `~/.codex`. Zaloguj się przez OAuth w przeglądarce (domyślnie) albo powyższy przepływ kodu urządzenia — OpenClaw zarządza wynikowymi poświadczeniami we własnym magazynie uwierzytelniania agentów.
    </Note>

    ### Sprawdzanie i odzyskiwanie routingu OAuth Codex

    Użyj tych poleceń, aby zobaczyć, którego modelu, środowiska wykonawczego i trasy
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

    Jeśli starsza konfiguracja nadal ma starsze odwołania GPT Codex lub nieaktualne
    przypięcie sesji środowiska wykonawczego OpenAI bez jawnej konfiguracji środowiska
    wykonawczego, napraw ją:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Jeśli `models auth list --provider openai` nie pokazuje żadnego użytecznego profilu,
    zaloguj się ponownie:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Użyj `--profile-id`, gdy chcesz mieć wiele logowań OAuth Codex w tym samym
    agencie i później kontrolować je przez kolejność uwierzytelniania lub `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    `openai/*` to trasa modelu dla tur agentów OpenAI przez Codex. Uruchom
    `openclaw doctor --fix`, aby zmigrować starsze identyfikatory profili z prefiksem OpenAI Codex starszego typu i
    wpisy kolejności, zanim zaczniesz polegać na kolejności profili.

    ### Wskaźnik statusu

    Czat `/status` pokazuje, które środowisko wykonawcze modelu jest aktywne dla bieżącej sesji.
    Dołączony mechanizm app-server Codex pojawia się jako `Runtime: OpenAI Codex` dla
    tur modeli agentów OpenAI. Nieaktualne przypięcia sesji środowiska wykonawczego OpenAI są naprawiane do Codex, chyba że
    konfiguracja jawnie przypina OpenClaw.

    ### Ostrzeżenie doctor

    Jeśli starsze odwołania do modeli Codex lub nieaktualne przypięcia środowiska wykonawczego OpenAI pozostają w konfiguracji albo
    stanie sesji, `openclaw doctor --fix` przepisuje je na `openai/*` ze
    środowiskiem wykonawczym Codex, chyba że OpenClaw jest jawnie skonfigurowany.

    ### Limit okna kontekstu

    OpenClaw traktuje metadane modelu i limit kontekstu środowiska wykonawczego jako oddzielne wartości.

    Dla `openai/gpt-5.5` przez katalog OAuth Codex:

    - Natywne `contextWindow`: `1000000`
    - Domyślny limit `contextTokens` środowiska wykonawczego: `272000`

    Mniejszy domyślny limit ma w praktyce lepsze cechy opóźnienia i jakości. Nadpisz go za pomocą `contextTokens`:

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
    Użyj `contextWindow`, aby zadeklarować natywne metadane modelu. Użyj `contextTokens`, aby ograniczyć budżet kontekstu środowiska wykonawczego.
    </Note>

    ### Odzyskiwanie katalogu

    OpenClaw używa metadanych katalogu upstream Codex dla `gpt-5.5`, gdy są
    obecne. Jeśli wykrywanie Codex na żywo pomija wiersz `gpt-5.5`, gdy
    konto jest uwierzytelnione, OpenClaw syntetyzuje ten wiersz modelu OAuth, aby
    Cron, podagent i skonfigurowane uruchomienia domyślnego modelu nie kończyły się błędem
    `Unknown model`.

  </Tab>
</Tabs>

## Natywne uwierzytelnianie app-server Codex

Natywny mechanizm app-server Codex używa odwołań do modeli `openai/*` oraz pominiętej
konfiguracji środowiska wykonawczego lub provider/model `agentRuntime.id: "codex"`, ale jego uwierzytelnianie
nadal opiera się na koncie. OpenClaw wybiera uwierzytelnianie w tej kolejności:

1. Uporządkowane profile uwierzytelniania OpenAI dla agenta, najlepiej pod
   `auth.order.openai`. Uruchom `openclaw doctor --fix`, aby zmigrować starsze
   identyfikatory profili uwierzytelniania starszego typu Codex i starszą kolejność uwierzytelniania Codex.
2. Istniejące konto app-server, takie jak lokalne logowanie ChatGPT w Codex CLI.
3. Tylko dla lokalnych uruchomień app-server stdio: `CODEX_API_KEY`, a następnie
   `OPENAI_API_KEY`, gdy app-server nie zgłasza konta i nadal wymaga
   uwierzytelniania OpenAI.

Oznacza to, że lokalne logowanie subskrypcji ChatGPT/Codex nie jest zastępowane tylko dlatego,
że proces Gateway ma również `OPENAI_API_KEY` dla bezpośrednich modeli OpenAI
lub osadzeń. Awaryjny klucz API ze zmiennej środowiskowej to tylko lokalna ścieżka stdio bez konta; nie jest
wysyłany do połączeń WebSocket app-server. Gdy wybrany jest profil Codex
w stylu subskrypcji, OpenClaw także nie przekazuje `CODEX_API_KEY` ani `OPENAI_API_KEY`
do uruchomionego procesu podrzędnego stdio app-server i wysyła wybrane poświadczenia
przez RPC logowania app-server. Gdy ten profil subskrypcji jest blokowany przez
limit użycia Codex, OpenClaw może przełączyć się na następny uporządkowany profil klucza API
`openai:*` bez zmiany wybranego modelu ani opuszczania mechanizmu Codex.
Po upływie czasu resetu subskrypcji profil subskrypcji znów się kwalifikuje.

## Generowanie obrazów

Dołączony Plugin `openai` rejestruje generowanie obrazów przez narzędzie `image_generate`.
Obsługuje zarówno generowanie obrazów za pomocą klucza API OpenAI, jak i generowanie obrazów
przez OAuth Codex za pomocą tego samego odwołania do modelu `openai/gpt-image-2`.

| Możliwość                | Klucz API OpenAI                   | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Odwołanie modelu          | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Uwierzytelnianie          | `OPENAI_API_KEY`                   | Logowanie OpenAI Codex OAuth         |
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

`gpt-image-2` jest domyślny zarówno dla generowania obrazów z tekstu OpenAI, jak i
edycji obrazów. `gpt-image-1.5`, `gpt-image-1` i `gpt-image-1-mini` pozostają dostępne jako
jawne nadpisania modelu. Użyj `openai/gpt-image-1.5` dla wyjścia
PNG/WebP z przezroczystym tłem; bieżące API `gpt-image-2` odrzuca
`background: "transparent"`.

W przypadku żądania z przezroczystym tłem agenci powinni wywołać `image_generate` z
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` lub `"webp"` oraz
`background: "transparent"`; starsza opcja dostawcy `openai.background` jest
nadal akceptowana. OpenClaw chroni też publiczne ścieżki OpenAI i
OpenAI Codex OAuth, przepisując domyślne przezroczyste żądania `openai/gpt-image-2`
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
Użyj `--quality low|medium|high|auto`, gdy musisz kontrolować jakość i koszt
OpenAI Images. Użyj `--openai-moderation low|auto`, aby przekazać
specyficzną dla dostawcy wskazówkę moderacji OpenAI z `image generate` albo `image edit`.

W przypadku instalacji ChatGPT/Codex OAuth zachowaj to samo odwołanie `openai/gpt-image-2`. Gdy
skonfigurowany jest profil OAuth `openai`, OpenClaw rozwiązuje zapisany token dostępu
OAuth i wysyła żądania obrazów przez backend Codex Responses. Nie próbuje najpierw
`OPENAI_API_KEY` ani po cichu nie wraca do klucza API dla tego żądania.
Skonfiguruj `models.providers.openai` jawnie z kluczem API,
niestandardowym bazowym URL-em albo punktem końcowym Azure, gdy chcesz zamiast tego użyć
bezpośredniej ścieżki OpenAI Images API.
Jeśli ten niestandardowy punkt końcowy obrazów znajduje się w zaufanej sieci LAN/adresacji prywatnej, ustaw też
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw utrzymuje
prywatne/wewnętrzne punkty końcowe obrazów zgodne z OpenAI zablokowane, chyba że ta zgoda
jest obecna.

Generowanie:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

Wygeneruj przezroczysty PNG:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Edycja:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## Generowanie wideo

Dołączony Plugin `openai` rejestruje generowanie wideo przez narzędzie `video_generate`.

| Możliwość        | Wartość                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| Model domyślny   | `openai/sora-2`                                                                   |
| Tryby            | Tekst-na-wideo, obraz-na-wideo, edycja pojedynczego wideo                         |
| Wejścia referencyjne | 1 obraz lub 1 wideo                                                           |
| Nadpisania rozmiaru | Obsługiwane dla tekst-na-wideo i obraz-na-wideo                               |
| Inne nadpisania  | `aspectRatio`, `resolution`, `audio`, `watermark` są ignorowane z ostrzeżeniem narzędzia |

Żądania OpenAI obraz-na-wideo używają `POST /v1/videos` z obrazem
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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać wspólne parametry narzędzia, wybór dostawcy i zachowanie przełączania awaryjnego.
</Note>

## Wkład do promptu GPT-5

OpenClaw dodaje wspólny wkład do promptu GPT-5 dla uruchomień z rodziny GPT-5 na powierzchniach promptów składanych przez OpenClaw. Ma zastosowanie według identyfikatora modelu, więc ścieżki OpenClaw/dostawcy, takie jak starsze odwołania sprzed naprawy (starsze odwołanie Codex GPT-5.5), `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` i inne zgodne odwołania GPT-5 otrzymują tę samą nakładkę. Starsze modele GPT-4.x jej nie otrzymują.

Dołączony natywny harness Codex nie otrzymuje tej nakładki OpenClaw GPT-5 przez instrukcje deweloperskie serwera aplikacji Codex. Natywny Codex zachowuje bazę, model i zachowanie dokumentów projektu należące do Codex, a OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków, aby pliki osobowości obszaru roboczego agenta pozostały nadrzędne. OpenClaw wnosi tylko kontekst środowiska uruchomieniowego, taki jak dostarczanie kanałem, dynamiczne narzędzia OpenClaw, delegowanie ACP, kontekst obszaru roboczego i OpenClaw Skills.

Wkład GPT-5 dodaje otagowany kontrakt zachowania dotyczący trwałości persony, bezpieczeństwa wykonywania, dyscypliny narzędzi, kształtu wyjścia, kontroli ukończenia i weryfikacji na pasujących promptach składanych przez OpenClaw. Zachowanie odpowiedzi specyficzne dla kanału i wiadomości cichych pozostaje we wspólnym prompcie systemowym OpenClaw i zasadach dostarczania wychodzącego. Warstwa przyjaznego stylu interakcji jest osobna i konfigurowalna.

| Wartość                | Efekt                                         |
| ---------------------- | --------------------------------------------- |
| `"friendly"` (domyślnie) | Włącza warstwę przyjaznego stylu interakcji |
| `"on"`                 | Alias dla `"friendly"`                        |
| `"off"`                | Wyłącza tylko warstwę przyjaznego stylu       |

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
Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane jako awaryjna zgodność, gdy wspólne ustawienie `agents.defaults.promptOverlays.gpt5.personality` nie jest ustawione.
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

    `extraBody` jest scalane z JSON-em żądania `/audio/speech` po polach wygenerowanych przez OpenClaw, więc używaj go dla punktów końcowych zgodnych z OpenAI, które wymagają dodatkowych kluczy, takich jak `lang`. Klucze prototypu są ignorowane.

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
    Ustaw `OPENAI_TTS_BASE_URL`, aby nadpisać bazowy URL TTS bez wpływu na punkt końcowy API czatu. OpenAI TTS i głos Realtime są konfigurowane przez klucz API OpenAI Platform; instalacje wyłącznie OAuth nadal mogą używać modeli czatu wspieranych przez Codex, ale nie odsłuchu na żywo OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Mowa-na-tekst">
    Dołączony Plugin `openai` rejestruje wsadowe rozpoznawanie mowy na tekst przez
    powierzchnię transkrypcji rozumienia mediów OpenClaw.

    - Model domyślny: `gpt-4o-transcribe`
    - Punkt końcowy: OpenAI REST `/v1/audio/transcriptions`
    - Ścieżka wejściowa: przesyłanie wieloczęściowego pliku audio
    - Obsługiwane przez OpenClaw wszędzie tam, gdzie przychodząca transkrypcja audio używa
      `tools.media.audio`, w tym segmenty kanałów głosowych Discord i
      załączniki audio kanałów

    Aby wymusić OpenAI dla przychodzącej transkrypcji audio:

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

    Wskazówki dotyczące języka i promptu są przekazywane do OpenAI, gdy zostaną dostarczone przez
    wspólną konfigurację mediów audio albo żądanie transkrypcji dla pojedynczego wywołania.

  </Accordion>

  <Accordion title="Transkrypcja Realtime">
    Dołączony Plugin `openai` rejestruje transkrypcję Realtime dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Język | `...openai.language` | (nieustawione) |
    | Prompt | `...openai.prompt` | (nieustawione) |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `800` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Uwierzytelnianie | `...openai.apiKey`, `OPENAI_API_KEY` lub `openai` OAuth | Klucze API łączą się bezpośrednio; OAuth tworzy sekret klienta transkrypcji Realtime |

    <Note>
    Używa połączenia WebSocket z `wss://api.openai.com/v1/realtime` z dźwiękiem G.711 u-law (`g711_ulaw` / `audio/pcmu`). Gdy skonfigurowany jest tylko `openai` OAuth, Gateway tworzy efemeryczny sekret klienta transkrypcji Realtime przed otwarciem WebSocket. Ten dostawca strumieniowania jest przeznaczony dla ścieżki transkrypcji Realtime w Voice Call; głos Discord obecnie nagrywa krótkie segmenty i zamiast tego używa wsadowej ścieżki transkrypcji `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Głos Realtime">
    Dołączony Plugin `openai` rejestruje głos Realtime dla Plugin Voice Call.

    | Ustawienie | Ścieżka konfiguracji | Domyślnie |
    |---------|------------|---------|
    | Model | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | Głos | `...openai.voice` | `alloy` |
    | Temperatura (mostek wdrożenia Azure) | `...openai.temperature` | `0.8` |
    | Próg VAD | `...openai.vadThreshold` | `0.5` |
    | Czas trwania ciszy | `...openai.silenceDurationMs` | `500` |
    | Dopełnienie prefiksu | `...openai.prefixPaddingMs` | `300` |
    | Nakład wnioskowania | `...openai.reasoningEffort` | (nie ustawiono) |
    | Uwierzytelnianie | profil uwierzytelniania kluczem API `openai`, `...openai.apiKey` lub `OPENAI_API_KEY` | Wymagany klucz API OpenAI Platform; OpenAI OAuth nie konfiguruje głosu Realtime |

    Dostępne wbudowane głosy Realtime dla `gpt-realtime-2`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI zaleca `marin` i `cedar`, aby uzyskać najlepszą jakość Realtime. To
    oddzielny zestaw względem powyższych głosów Text-to-speech; nie zakładaj, że głos TTS
    taki jak `fable`, `nova` lub `onyx` jest poprawny dla sesji Realtime.

    <Note>
    Mostki OpenAI realtime po stronie backendu używają kształtu sesji GA Realtime WebSocket, który nie akceptuje `session.temperature`. Wdrożenia Azure OpenAI pozostają dostępne przez `azureEndpoint` i `azureDeployment` oraz zachowują kształt sesji zgodny z wdrożeniem. Obsługuje dwukierunkowe wywoływanie narzędzi i dźwięk G.711 u-law.
    </Note>

    <Note>
    Głos Realtime jest wybierany podczas tworzenia sesji. OpenAI pozwala później zmieniać większość
    pól sesji, ale głosu nie można zmienić po tym, gdy
    model wyemituje dźwięk w tej sesji. OpenClaw obecnie udostępnia
    wbudowane identyfikatory głosów Realtime jako ciągi znaków.
    </Note>

    <Note>
    Control UI Talk używa przeglądarkowych sesji OpenAI realtime z wygenerowanym przez Gateway
    efemerycznym sekretem klienta oraz bezpośrednią wymianą WebRTC SDP w przeglądarce z
    OpenAI Realtime API. Gateway tworzy ten sekret klienta z wybranym
    profilem uwierzytelniania kluczem API `openai` albo skonfigurowanym kluczem API OpenAI Platform. Przekaźnik Gateway
    i backendowe mostki Realtime WebSocket Voice Call używają tej samej
    ścieżki uwierzytelniania wyłącznie kluczem API dla natywnych punktów końcowych OpenAI. Weryfikacja live
    dla opiekunów jest dostępna przez
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    odcinki OpenAI weryfikują zarówno backendowy mostek WebSocket, jak i przeglądarkową
    wymianę WebRTC SDP bez logowania sekretów.
    </Note>

  </Accordion>
</AccordionGroup>

## Punkty końcowe Azure OpenAI

Dołączony provider `openai` może kierować generowanie obrazów do zasobu Azure OpenAI
przez nadpisanie bazowego adresu URL. Na ścieżce generowania obrazów OpenClaw
wykrywa nazwy hostów Azure w `models.providers.openai.baseUrl` i automatycznie przełącza się na
kształt żądania Azure.

<Note>
Głos Realtime używa oddzielnej ścieżki konfiguracji
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
i nie zależy od `models.providers.openai.baseUrl`. Zobacz akordeon **Głos Realtime**
w sekcji [Głos i mowa](#voice-and-speech), aby poznać jego ustawienia Azure.
</Note>

Użyj Azure OpenAI, gdy:

- Masz już subskrypcję Azure OpenAI, limit lub umowę enterprise
- Potrzebujesz regionalnej rezydencji danych albo kontroli zgodności zapewnianych przez Azure
- Chcesz utrzymać ruch w istniejącej dzierżawie Azure

### Konfiguracja

Aby generować obrazy w Azure przez dołączonego providera `openai`, wskaż
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
- Używa ścieżek o zakresie wdrożenia (`/openai/deployments/{deployment}/...`)
- Dołącza `?api-version=...` do każdego żądania
- Używa domyślnego limitu czasu żądania 600 s dla wywołań generowania obrazów Azure.
  Wartości `timeoutMs` dla pojedynczego wywołania nadal nadpisują tę wartość domyślną.

Inne bazowe adresy URL (publiczne OpenAI, proxy zgodne z OpenAI) zachowują standardowy
kształt żądania obrazu OpenAI.

<Note>
Routing Azure dla ścieżki generowania obrazów providera `openai` wymaga
OpenClaw 2026.4.22 lub nowszego. Wcześniejsze wersje traktują każdy niestandardowy
`openai.baseUrl` jak publiczny punkt końcowy OpenAI i nie zadziałają z wdrożeniami
obrazów Azure.
</Note>

### Wersja API

Ustaw `AZURE_OPENAI_API_VERSION`, aby przypiąć konkretną wersję zapoznawczą Azure lub GA
dla ścieżki generowania obrazów Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Wartość domyślna to `2024-12-01-preview`, gdy zmienna nie jest ustawiona.

### Nazwy modeli są nazwami wdrożeń

Azure OpenAI wiąże modele z wdrożeniami. Dla żądań generowania obrazów Azure
kierowanych przez dołączonego providera `openai` pole `model` w OpenClaw
musi być **nazwą wdrożenia Azure** skonfigurowaną w portalu Azure, a nie
publicznym identyfikatorem modelu OpenAI.

Jeśli utworzysz wdrożenie o nazwie `gpt-image-2-prod`, które obsługuje `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

Ta sama reguła nazwy wdrożenia dotyczy wywołań generowania obrazów kierowanych przez
dołączonego providera `openai`.

### Dostępność regionalna

Generowanie obrazów Azure jest obecnie dostępne tylko w części regionów
(na przykład `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Przed utworzeniem wdrożenia sprawdź aktualną listę regionów Microsoftu
i potwierdź, że konkretny model jest oferowany w Twoim regionie.

### Różnice parametrów

Azure OpenAI i publiczne OpenAI nie zawsze akceptują te same parametry obrazów.
Azure może odrzucać opcje, na które publiczne OpenAI pozwala (na przykład określone
wartości `background` w `gpt-image-2`), albo udostępniać je tylko w określonych wersjach
modelu. Te różnice pochodzą z Azure i bazowego modelu, a nie z
OpenClaw. Jeśli żądanie Azure kończy się błędem walidacji, sprawdź
zestaw parametrów obsługiwany przez konkretne wdrożenie i wersję API w
portalu Azure.

<Note>
Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje
ukrytych nagłówków atrybucji OpenClaw — zobacz akordeon **Trasy natywne a zgodne z OpenAI**
w sekcji [Konfiguracja zaawansowana](#advanced-configuration).

Dla ruchu chat lub Responses w Azure (poza generowaniem obrazów) użyj
przepływu onboardingu albo dedykowanej konfiguracji providera Azure — samo `openai.baseUrl`
nie wybiera kształtu API/uwierzytelniania Azure. Istnieje osobny
provider `azure-openai-responses/*`; zobacz
akordeon Compaction po stronie serwera poniżej.
</Note>

## Konfiguracja zaawansowana

<AccordionGroup>
  <Accordion title="Transport (WebSocket a SSE)">
    OpenClaw używa najpierw WebSocket, z fallbackiem do SSE (`"auto"`) dla `openai/*`.

    W trybie `"auto"` OpenClaw:
    - Ponawia jedną wczesną awarię WebSocket przed przejściem na SSE
    - Po awarii oznacza WebSocket jako zdegradowany na około 60 sekund i używa SSE podczas okresu wygaszania
    - Dołącza stabilne nagłówki tożsamości sesji i tury dla ponowień oraz ponownych połączeń
    - Normalizuje liczniki użycia (`input_tokens` / `prompt_tokens`) między wariantami transportu

    | Wartość | Zachowanie |
    |-------|----------|
    | `"auto"` (domyślnie) | Najpierw WebSocket, fallback do SSE |
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

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Konfiguracja:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Po włączeniu OpenClaw mapuje tryb szybki na priorytetowe przetwarzanie OpenAI (`service_tier = "priority"`). Istniejące wartości `service_tier` są zachowywane, a tryb szybki nie przepisuje `reasoning` ani `text.verbosity`. `fastMode: "auto"` uruchamia nowe wywołania modelu w trybie szybkim aż do automatycznego progu odcięcia, a potem uruchamia późniejsze wywołania ponowienia, fallbacku, wyniku narzędzia lub kontynuacji bez trybu szybkiego. Próg odcięcia domyślnie wynosi 60 sekund; ustaw `params.fastAutoOnSeconds` w aktywnym modelu, aby go zmienić.

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
    Nadpisania sesji mają pierwszeństwo przed konfiguracją. Wyczyszczenie nadpisania sesji w interfejsie Sessions przywraca sesję do skonfigurowanej wartości domyślnej.
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
    `serviceTier` jest przekazywany tylko do natywnych punktów końcowych OpenAI (`api.openai.com`) i natywnych punktów końcowych Codex (`chatgpt.com/backend-api`). Jeśli kierujesz któregoś providera przez proxy, OpenClaw pozostawia `service_tier` bez zmian.
    </Warning>

  </Accordion>

  <Accordion title="Compaction po stronie serwera (Responses API)">
    Dla bezpośrednich modeli OpenAI Responses (`openai/*` na `api.openai.com`) wrapper strumienia OpenClaw w Plugin OpenAI automatycznie włącza Compaction po stronie serwera:

    - Wymusza `store: true` (chyba że zgodność modelu ustawia `supportsStore: false`)
    - Wstrzykuje `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Domyślny `compact_threshold`: 70% `contextWindow` (lub `80000`, gdy jest niedostępne)

    Dotyczy to wbudowanej ścieżki runtime OpenClaw oraz hooków providera OpenAI używanych przez osadzone uruchomienia. Natywny harness serwera aplikacji Codex zarządza własnym kontekstem przez Codex i jest konfigurowany przez domyślną trasę agenta OpenAI albo politykę runtime providera/modelu.

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
    Dla uruchomień z rodziny GPT-5 w `openai/*` OpenClaw może używać ściślejszego osadzonego kontraktu wykonywania:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Z `strict-agentic` OpenClaw:
    - Automatycznie włącza `update_plan` dla większych prac
    - Ponawia strukturalnie puste tury lub tury zawierające tylko rozumowanie z kontynuacją zawierającą widoczną odpowiedź
    - Używa jawnych zdarzeń planu harnessa, gdy wybrany harness je udostępnia

    OpenClaw nie klasyfikuje prozy asystenta, aby decydować, czy tura jest planem, aktualizacją postępu, czy odpowiedzią końcową.

    <Note>
    Zakres ograniczony tylko do uruchomień z rodziny OpenAI i Codex GPT-5. Inni dostawcy i starsze rodziny modeli zachowują domyślne działanie.
    </Note>

  </Accordion>

  <Accordion title="Trasy natywne a zgodne z OpenAI">
    OpenClaw traktuje bezpośrednie punkty końcowe OpenAI, Codex i Azure OpenAI inaczej niż ogólne proxy `/v1` zgodne z OpenAI:

    **Trasy natywne** (`openai/*`, Azure OpenAI):
    - Zachowują `reasoning: { effort: "none" }` tylko dla modeli obsługujących wartość effort `none` OpenAI
    - Pomijają wyłączone rozumowanie dla modeli lub proxy, które odrzucają `reasoning.effort: "none"`
    - Domyślnie ustawiają schematy narzędzi w trybie ścisłym
    - Dołączają ukryte nagłówki atrybucji tylko na zweryfikowanych hostach natywnych
    - Zachowują kształtowanie żądań specyficzne dla OpenAI (`service_tier`, `store`, zgodność rozumowania, wskazówki pamięci podręcznej promptów)

    **Trasy proxy/zgodne:**
    - Używają luźniejszego działania zgodności
    - Usuwają `store` Completions z nienatywnych ładunków `openai-completions`
    - Akceptują zaawansowane przekazywanie JSON `params.extra_body`/`params.extraBody` dla proxy Completions zgodnych z OpenAI
    - Akceptują `params.chat_template_kwargs` dla proxy Completions zgodnych z OpenAI, takich jak vLLM
    - Nie wymuszają ścisłych schematów narzędzi ani nagłówków wyłącznie natywnych

    Azure OpenAI używa natywnego transportu i zachowania zgodności, ale nie otrzymuje ukrytych nagłówków atrybucji.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i działania przełączania awaryjnego.
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
