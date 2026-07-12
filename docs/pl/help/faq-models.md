---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zawiodły”
    - Profile uwierzytelniania — czym są i jak nimi zarządzać
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne modele, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-07-12T15:11:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące modeli oraz profili uwierzytelniania. Informacje o konfiguracji, sesjach, Gateway, kanałach i
  rozwiązywaniu problemów znajdziesz w głównej sekcji [Często zadawane pytania](/pl/help/faq).

  ## Modele: ustawienia domyślne, wybór, aliasy i przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Ustawia się go za pomocą:

    ```text
    agents.defaults.model.primary
    ```

    Modele są odwołaniami `dostawca/model` (przykład: `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Zawsze jawnie podawaj `dostawca/model`. Jeśli
    pominiesz dostawcę, OpenClaw najpierw próbuje dopasować alias, następnie
    unikatowego skonfigurowanego dostawcę dla danego identyfikatora modelu,
    a potem przechodzi do skonfigurowanego dostawcy domyślnego (przestarzała
    ścieżka zgodności). Jeśli ten dostawca nie oferuje już skonfigurowanego
    modelu domyślnego, OpenClaw wybiera pierwszy skonfigurowany duet
    dostawca/model zamiast nieaktualnego ustawienia domyślnego.

  </Accordion>

  <Accordion title="Jaki model jest zalecany?">
    Używaj najwydajniejszego modelu najnowszej generacji oferowanego przez
    używany zestaw dostawców, szczególnie w przypadku agentów korzystających
    z narzędzi lub przetwarzających niezaufane dane wejściowe — słabsze lub
    nadmiernie skwantyzowane modele są bardziej podatne na wstrzykiwanie
    poleceń i niebezpieczne zachowania (zobacz [Bezpieczeństwo](/pl/gateway/security)).
    Tańsze modele kieruj do rutynowych rozmów o niskim poziomie ryzyka,
    zależnie od roli agenta.

    Przypisuj modele poszczególnym agentom i używaj podagentów do równoległego
    wykonywania długich zadań (każdy podagent zużywa własne tokeny). Zobacz
    [Modele](/pl/concepts/models), [Podagenci](/pl/tools/subagents),
    [MiniMax](/pl/providers/minimax) i [Modele lokalne](/pl/gateway/local-models).

  </Accordion>

  <Accordion title="Jak przełączyć model bez usuwania konfiguracji?">
    Zmień wyłącznie pola modelu — unikaj zastępowania całej konfiguracji.

    - `/model` na czacie (dla danej sesji, zobacz [Polecenia z ukośnikiem](/pl/tools/slash-commands))
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - bezpośrednio edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    W przypadku zmian przez RPC najpierw sprawdź konfigurację za pomocą
    `config.schema.lookup` (znormalizowana ścieżka, skrócona dokumentacja
    schematu, podsumowania elementów podrzędnych), a następnie preferuj
    `config.patch` zamiast `config.apply` z obiektem częściowym. Jeśli
    konfiguracja została nadpisana, przywróć ją z kopii zapasowej lub uruchom
    `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja interaktywna](/pl/cli/configure),
    [Konfiguracja](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli hostowanych samodzielnie (llama.cpp, vLLM, Ollama)?">
    Tak — Ollama to najprostsze rozwiązanie. Szybka konfiguracja:

    1. Zainstaluj Ollama ze strony `https://ollama.com/download`
    2. Pobierz model lokalny, np. `ollama pull gemma4`
    3. Aby korzystać również z modeli chmurowych, uruchom `ollama signin`
    4. Uruchom `openclaw onboard`, wybierz `Ollama`, a następnie `Local` lub `Cloud + Local`

    `Cloud + Local` zapewnia dostęp zarówno do modeli chmurowych, jak i
    lokalnych modeli Ollama; modele chmurowe, takie jak `kimi-k2.5:cloud`,
    nie wymagają pobierania lokalnego. Aby przełączyć model ręcznie, użyj:
    `openclaw models list`, a następnie `openclaw models set ollama/<model>`.

    Mniejsze lub silnie skwantyzowane modele są bardziej podatne na
    wstrzykiwanie poleceń. Używaj dużych modeli dla każdego bota mającego
    dostęp do narzędzi; jeśli mimo to korzystasz z małych modeli, włącz
    izolację w piaskownicy oraz ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Izolacja w piaskownicy](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jak przełączać modele w locie (bez ponownego uruchamiania)?">
    Wyślij `/model <name>` jako osobną wiadomość. Pełną listę poleceń
    znajdziesz w sekcji [Polecenia z ukośnikiem](/pl/tools/slash-commands);
    obejmuje ona wybór według numeru (`/model`, `/model
    list`, `/model 3`), polecenie `/model default` usuwające zastąpienie dla
    sesji oraz `/model status` pokazujące szczegóły punktu końcowego i trybu API.

    Aby wymusić konkretny profil uwierzytelniania dla sesji, użyj `@profile`:

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Aby odpiąć profil ustawiony za pomocą `@profile`, ponownie uruchom `/model`
    bez przyrostka (np. `/model anthropic/claude-opus-4-6`) albo wybierz profil
    domyślny w `/model`. Użyj `/model status`, aby potwierdzić aktywny profil
    uwierzytelniania.

  </Accordion>

  <Accordion title="Jeśli dwóch dostawców udostępnia ten sam identyfikator modelu, którego z nich używa /model?">
    `/model provider/model` wybiera dokładnie tę ścieżkę dostawcy. Na przykład
    `qianfan/deepseek-v4-flash` i `deepseek/deepseek-v4-flash` są różnymi
    odwołaniami, mimo że identyfikator modelu jest taki sam — OpenClaw nie
    przełącza dostawców niejawnie wyłącznie na podstawie dopasowania
    niekwalifikowanego identyfikatora.

    Wybrane przez użytkownika odwołanie `/model` podlega ścisłym zasadom
    przełączania awaryjnego: jeśli dany dostawca/model stanie się niedostępny,
    odpowiedź zakończy się widocznym błędem zamiast przejść do
    `agents.defaults.model.fallbacks`. Skonfigurowane łańcuchy przełączania
    awaryjnego nadal mają zastosowanie do skonfigurowanych wartości domyślnych,
    modeli głównych zadań cron oraz automatycznie wybranego stanu awaryjnego.
    Gdy wykonanie bez zastąpienia dla sesji może użyć przełączania awaryjnego,
    OpenClaw najpierw próbuje żądanego dostawcę/model, następnie skonfigurowane
    modele awaryjne, a na końcu skonfigurowany model główny — dzięki temu
    zduplikowane niekwalifikowane identyfikatory modeli nigdy nie przeskakują
    bezpośrednio z powrotem do dostawcy domyślnego.

    Zobacz [Modele](/pl/concepts/models) i [Awaryjne przełączanie modeli](/pl/concepts/model-failover).

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do programowania?">
    Tak — wybór modelu i wybór środowiska wykonawczego są od siebie niezależne:

    - **Natywny agent programistyczny Codex:** ustaw `agents.defaults.model.primary` na
      `openai/gpt-5.5`. Zaloguj się za pomocą `openclaw models auth login --provider
      openai`, aby użyć uwierzytelniania subskrypcji ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API poza pętlą agenta:** skonfiguruj
      `OPENAI_API_KEY` dla obrazów, osadzeń, mowy, komunikacji w czasie
      rzeczywistym i innych interfejsów OpenAI API niezwiązanych z agentem.
    - **Uwierzytelnianie agenta OpenAI kluczem API:** użyj `/model openai/gpt-5.5`
      z uporządkowanym profilem klucza API `openai`.
    - **Podagenci:** kieruj zadania programistyczne do agenta ukierunkowanego
      na Codex, korzystającego z własnego modelu `openai/gpt-5.5`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia z ukośnikiem](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    - **Dla sesji:** wyślij `/fast on` podczas korzystania z `openai/gpt-5.5`.
    - **Domyślnie dla modelu:** ustaw
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` na `true`.
    - **Automatyczny próg:** `/fast auto` lub `params.fastMode: "auto"` uruchamia
      nowe wywołania modelu w trybie szybkim do osiągnięcia progu, a późniejsze
      ponowienia, przełączenia awaryjne, wywołania z wynikami narzędzi lub
      kontynuacje wykonuje bez trybu szybkiego. Domyślny próg wynosi
      60 sekund; można go zastąpić za pomocą `params.fastAutoOnSeconds` dla modelu.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    W natywnych żądaniach OpenAI Responses tryb szybki odpowiada ustawieniu
    `service_tier = "priority"`; istniejące wartości `service_tier` są
    zachowywane, a tryb szybki nie zmienia `reasoning` ani `text.verbosity`.
    Ustawienia `/fast` dla sesji mają pierwszeństwo przed wartościami
    domyślnymi konfiguracji.

    Zobacz [Rozumowanie i tryb szybki](/pl/tools/thinking) oraz sekcję dotyczącą
    trybu szybkiego w konfiguracji zaawansowanej na stronie dostawcy
    [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title='Dlaczego widzę komunikat „Model ... is not allowed”, po którym nie ma odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych**
    modeli dla `/model` i zastąpień dla sesji. Wybranie modelu spoza tej listy
    powoduje zwrócenie poniższego komunikatu zamiast zwykłej odpowiedzi:

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Rozwiązanie: dodaj dokładny model do `agents.defaults.models`, dodaj symbol
    wieloznaczny dostawcy, taki jak `"provider/*": {}`, dla katalogów
    dynamicznych, usuń listę dozwolonych modeli albo wybierz model z
    `/model list`. Jeśli polecenie zawierało również `--runtime codex`,
    najpierw zaktualizuj listę dozwolonych modeli, a następnie ponów to samo
    polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę komunikat „Unknown model: minimax/MiniMax-M3”?'>
    Jeśli używasz starszego wydania OpenClaw, najpierw wykonaj aktualizację
    (lub uruchom wersję ze źródeł z gałęzi `main`) i ponownie uruchom Gateway —
    modelu `MiniMax-M3` może jeszcze nie być w katalogu zainstalowanego wydania.
    W przeciwnym razie dostawca MiniMax nie jest skonfigurowany (nie znaleziono
    wpisu dostawcy ani profilu uwierzytelniania), więc nie można rozpoznać
    modelu. Pełną listę czynności naprawczych, tabelę identyfikatorów
    dostawców/modeli oraz przykład bloku konfiguracji znajdziesz w sekcji
    rozwiązywania problemów na stronie dostawcy [MiniMax](/pl/providers/minimax).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako modelu domyślnego, a OpenAI do złożonych zadań?">
    Tak. Używaj MiniMax jako modelu domyślnego i przełączaj modele dla
    poszczególnych sesji — modele awaryjne służą do obsługi błędów, a nie
    „trudnych zadań”, dlatego użyj `/model` lub osobnego agenta.

    **Opcja A: przełączanie dla poszczególnych sesji**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Następnie użyj `/model gpt`.

    **Opcja B: osobni agenci** — domyślnym modelem agenta A jest MiniMax,
    a agenta B — OpenAI; kieruj zadania według agenta lub użyj `/agent`,
    aby się przełączać.

    Dokumentacja: [Modele](/pl/concepts/models), [Kierowanie w systemie wieloagentowym](/pl/concepts/multi-agent),
    [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt są wbudowanymi skrótami?">
    Tak — są to wbudowane skróty stosowane tylko wtedy, gdy model docelowy
    istnieje w `agents.defaults.models`:

    | Alias | Wskazuje na |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Własny alias o tej samej nazwie zastępuje alias wbudowany.

  </Accordion>

  <Accordion title="Jak zdefiniować lub zastąpić skróty modeli (aliasy)?">
    Aliasy znajdują się w `agents.defaults.models.<modelId>.alias`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Następnie `/model sonnet` (lub `/<alias>`, jeśli jest obsługiwane) wskazuje
    na ten identyfikator modelu.

  </Accordion>

  <Accordion title="Jak dodać modele innych dostawców, takich jak OpenRouter lub Z.AI?">
    OpenRouter (opłata za token; wiele modeli):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modele GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Brak klucza dostawcy dla wskazanego dostawcy/modelu powoduje błąd
    uwierzytelniania w czasie wykonywania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dostawcy po dodaniu nowego agenta**

    Nowy agent ma pusty magazyn uwierzytelniania — dane uwierzytelniania są
    przechowywane osobno dla każdego agenta w:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Rozwiązanie: uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze albo
    skopiuj z magazynu głównego agenta wyłącznie przenośne, statyczne profile
    `api_key`/`token`. W przypadku OAuth zaloguj się z poziomu nowego agenta, gdy potrzebuje on
    własnego konta. Pełne zasady ponownego używania `agentDir` i udostępniania
    poświadczeń znajdziesz w sekcji [Routing wieloagentowy](/pl/concepts/multi-agent) — nigdy nie używaj
    ponownie tego samego `agentDir` dla różnych agentów.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Obejmuje dwa etapy:

    1. **Rotację profili uwierzytelniania** w ramach tego samego dostawcy.
    2. **Przejście na model zapasowy** — następny model w `agents.defaults.model.fallbacks`.

    Dla profili, w których występują błędy, obowiązują okresy karencji (wykładniczo rosnące opóźnienie), dzięki czemu OpenClaw
    nadal odpowiada, gdy dostawca ogranicza częstotliwość żądań lub tymczasowo nie działa.

    Kategoria ograniczenia częstotliwości obejmuje więcej niż zwykły kod `429`: `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okna użycia (`weekly/monthly limit reached`) są traktowane jako
    ograniczenia częstotliwości uzasadniające przełączenie awaryjne.

    Odpowiedzi dotyczące rozliczeń nie zawsze mają kod `402`, a niektóre odpowiedzi `402` pozostają w
    kategorii błędów przejściowych lub ograniczeń częstotliwości zamiast w kategorii rozliczeń. Jednoznaczny
    komunikat dotyczący rozliczeń w odpowiedzi `401`/`403` nadal może zostać zaklasyfikowany jako błąd rozliczeń; dopasowania
    tekstowe specyficzne dla dostawcy (np. `Key limit exceeded` w OpenRouter) pozostają ograniczone do
    danego dostawcy. Odpowiedź `402`, która wskazuje na ponawialny limit okna użycia lub
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), jest traktowana jako `rate_limit`, a nie
    długotrwałe wyłączenie z powodu rozliczeń.

    Błędy przepełnienia kontekstu są całkowicie wyłączone ze ścieżki przełączania awaryjnego — sygnatury
    takie jak `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` lub `ollama error: context length exceeded` prowadzą do
    Compaction i ponowienia próby zamiast przejścia do kolejnego modelu zapasowego.

    Ogólny tekst błędu serwera jest interpretowany węziej niż „wszystko, co zawiera unknown/error”.
    Do przejściowych formatów specyficznych dla dostawcy, które są traktowane jako sygnały
    przełączenia awaryjnego, należą: sam komunikat Anthropic `An unknown error occurred`, sam komunikat OpenRouter
    `Provider returned error`, błędy przyczyny zatrzymania, takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem błędu serwera (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`)
    oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, gdy kontekst dostawcy
    jest zgodny. Ogólny wewnętrzny komunikat awaryjny, taki jak `LLM request failed
    with an unknown error.`, jest traktowany zachowawczo i sam w sobie nie wywołuje przełączenia
    awaryjnego.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Identyfikator profilu uwierzytelniania `anthropic:default` nie ma poświadczeń w
    oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna rozwiązania problemu:**

    - Sprawdź, gdzie znajdują się profile — bieżąca lokalizacja:
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`; starsza:
      `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`).
    - Sprawdź, czy Gateway wczytuje Twoją zmienną środowiskową. Zmienna `ANTHROPIC_API_KEY` ustawiona wyłącznie w
      powłoce nie dotrze do Gateway uruchamianego przez systemd/launchd — umieść ją w
      `~/.openclaw/.env` lub włącz `env.shellEnv`.
    - Sprawdź, czy edytujesz właściwego agenta — konfiguracje wieloagentowe mają
      wiele plików `auth-profiles.json`.
    - Uruchom `openclaw models status`, aby zobaczyć skonfigurowane modele i stan
      uwierzytelniania dostawcy.

    **W przypadku „No credentials found for profile anthropic” (bez przyrostka adresu e-mail):**

    Uruchomienie jest przypisane do profilu Anthropic, którego Gateway nie może znaleźć.

    - Użyj Claude CLI: uruchom `openclaw models auth login --provider anthropic
      --method cli --set-default` na hoście Gateway.
    - Jeśli wolisz klucz API: umieść `ANTHROPIC_API_KEY` w
      `~/.openclaw/.env` na hoście Gateway, a następnie wyczyść przypisaną kolejność,
      która wymusza użycie brakującego profilu:

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Tryb zdalny: profile uwierzytelniania znajdują się na maszynie Gateway, a nie na Twoim
      laptopie — upewnij się, że uruchamiasz polecenia właśnie tam.

  </Accordion>

  <Accordion title="Dlaczego podjęto również próbę użycia Google Gemini, która się nie powiodła?">
    Jeśli konfiguracja modeli zawiera Google Gemini jako model zapasowy (lub
    przełączono ją na skróconą nazwę Gemini), OpenClaw próbuje go użyć podczas przełączania awaryjnego. Brak
    skonfigurowanych poświadczeń Google powoduje błąd `No API key found for provider
    "google"`. Rozwiązanie: dodaj uwierzytelnianie Google albo usuń modele Google z
    `agents.defaults.model.fallbacks`/aliasów.

    **Żądanie LLM odrzucone: wymagana sygnatura rozumowania (Google Antigravity)**

    Przyczyna: historia sesji zawiera bloki rozumowania bez sygnatur (często
    po przerwanym lub częściowym strumieniu); Google Antigravity wymaga sygnatur
    bloków rozumowania. OpenClaw usuwa niepodpisane bloki rozumowania dla Google
    Antigravity Claude; jeśli problem nadal występuje, rozpocznij nową sesję lub ustaw
    `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce obsługi wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Nazwany rekord poświadczeń (OAuth lub klucz API) powiązany z dostawcą i przechowywany
    w:

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Przeglądaj zapisane profile bez ujawniania sekretów za pomocą polecenia `openclaw models auth
    list` (opcjonalnie z `--provider <id>` lub `--json`). Zobacz
    [CLI modeli](/pl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    Z prefiksem dostawcy: `anthropic:default` (często używany, gdy nie istnieje tożsamość
    oparta na adresie e-mail), `anthropic:<email>` dla tożsamości OAuth lub wybrany
    niestandardowy identyfikator (np. `anthropic:work`).

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest używany jako pierwszy?">
    Tak. Konfiguracja `auth.order.<provider>` ustala kolejność rotacji dla każdego dostawcy
    (tylko metadane — bez przechowywania sekretów).

    OpenClaw może pominąć profil znajdujący się w krótkim **okresie karencji** (ograniczenia częstotliwości,
    przekroczenia limitu czasu, błędy uwierzytelniania) lub w dłuższym stanie **wyłączenia**
    (problemy z rozliczeniami/niewystarczające środki). Sprawdź to za pomocą `openclaw models status
    --json`, analizując `auth.unusableProfiles`. Dostosuj ustawienia za pomocą
    `auth.cooldowns.billingBackoffHours*`. Okresy karencji po ograniczeniu częstotliwości mogą być
    zależne od modelu — profil objęty karencją dla jednego modelu może nadal obsługiwać
    model pokrewny tego samego dostawcy; okna rozliczeń/wyłączenia blokują
    cały profil.

    Ustaw zastępczą kolejność dla konkretnego agenta (zapisywaną w jego pliku `auth-state.json`):

    ```bash
    # Domyślnie używa skonfigurowanego agenta domyślnego (pomiń --agent)
    openclaw models auth order get --provider anthropic

    # Ogranicz rotację do jednego profilu
    openclaw models auth order set --provider anthropic anthropic:default

    # Lub ustaw jawną kolejność (przełączanie awaryjne w ramach dostawcy)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Wyczyść zastąpienie (powrót do konfiguracji auth.order / rotacji cyklicznej)
    openclaw models auth order clear --provider anthropic

    # Wskaż konkretnego agenta
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Sprawdź, które profile rzeczywiście zostaną wypróbowane: `openclaw models status --probe`.
    Zapisany profil pominięty w jawnej kolejności zgłasza
    `excluded_by_auth_order`, zamiast zostać po cichu wypróbowany.

  </Accordion>

  <Accordion title="OAuth a klucz API — jaka jest różnica?">
    - **OAuth / logowanie przez CLI** często wykorzystuje dostęp w ramach subskrypcji, jeśli
      dostawca go obsługuje. W przypadku Anthropic mechanizm Claude CLI w OpenClaw
      używa polecenia Claude Code `claude -p`, które Anthropic obecnie traktuje jako
      użycie Agent SDK/programistyczne, obciążające limity użycia subskrypcji —
      bieżący stan wstrzymania rozliczeń oraz odnośniki do źródeł znajdziesz w sekcji [Anthropic](/pl/providers/anthropic).
    - **Klucze API** korzystają z rozliczeń za token.

    Kreator obsługuje Anthropic Claude CLI, OAuth OpenAI Codex oraz klucze
    API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [Często zadawane pytania](/pl/help/faq) — główna sekcja często zadawanych pytań
- [Często zadawane pytania — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
