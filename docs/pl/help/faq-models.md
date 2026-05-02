---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zawiodły”
    - Profile uwierzytelniania i zarządzanie nimi
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne ustawienia modeli, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-05-02T09:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  Modele i profile uwierzytelniania: pytania i odpowiedzi. Informacje o konfiguracji, sesjach, Gateway, kanałach i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Modele: wartości domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.5` lub `openai-codex/gpt-5.5`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikatowego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw wraca do pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać nieaktualną wartość domyślną usuniętego dostawcy. Nadal należy **jawnie** ustawić `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecana wartość domyślna:** użyj najsilniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z włączonymi narzędziami lub danymi wejściowymi z niezaufanych źródeł:** przedkładaj siłę modelu nad koszt.
    **Do rutynowego czatu o niskim ryzyku:** używaj tańszych modeli zapasowych i trasuj według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) i
    [Modele lokalne](/pl/gateway/local-models).

    Ogólna zasada: używaj **najlepszego modelu, na jaki Cię stać** do pracy o wysokiej stawce, a tańszego
    modelu do rutynowego czatu lub podsumowań. Możesz trasować modele per agent i używać podagentów do
    równoległego wykonywania długich zadań (każdy podagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Podagenci](/pl/tools/subagents).

    Ważne ostrzeżenie: słabsze lub nadmiernie skwantyzowane modele są bardziej podatne na
    wstrzykiwanie poleceń i niebezpieczne zachowanie. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez czyszczenia konfiguracji?">
    Użyj **poleceń modelu** albo edytuj tylko pola **model**. Unikaj pełnego zastępowania konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, dla bieżącej sesji)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edycja `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź `config.schema.lookup` i preferuj `config.patch`. Ładunek wyszukiwania podaje znormalizowaną ścieżkę, płytką dokumentację schematu/ograniczenia oraz podsumowania bezpośrednich elementów potomnych.
    dla częściowych aktualizacji.
    Jeśli konfiguracja została nadpisana, przywróć ją z kopii zapasowej albo ponownie uruchom `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli hostowanych samodzielnie (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz model lokalny, na przykład `ollama pull gemma4`
    3. Jeśli chcesz także modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele chmurowe oraz Twoje lokalne modele Ollama
    - modele chmurowe takie jak `kimi-k2.5:cloud` nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno skwantyzowane modele są bardziej podatne na wstrzykiwanie
    poleceń. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać z czasem; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie środowiska wykonawczego na każdym Gateway za pomocą `openclaw models status`.
    - Dla agentów wrażliwych na bezpieczeństwo lub z włączonymi narzędziami używaj najsilniejszego modelu najnowszej generacji dostępnego w danym środowisku.

  </Accordion>

  <Accordion title="Jak przełączać modele w locie (bez restartu)?">
    Użyj polecenia `/model` jako samodzielnej wiadomości:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    To wbudowane aliasy. Własne aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić za pomocą `/model`, `/model list` albo `/model status`.

    `/model` (i `/model list`) pokazuje kompaktowy, numerowany wybór. Wybierz według numeru:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (dla bieżącej sesji):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany punkt końcowy dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony za pomocą @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do wartości domyślnej, wybierz ją z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do kodowania?">
    Tak. Traktuj wybór modelu i wybór środowiska wykonawczego oddzielnie:

    - **Natywny agent kodujący Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5` i `agents.defaults.agentRuntime.id` na `"codex"`. Zaloguj się przez `openclaw models auth login --provider openai-codex`, gdy chcesz używać uwierzytelniania subskrypcji ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API przez PI:** użyj `/model openai/gpt-5.5` bez nadpisania środowiska wykonawczego Codex i skonfiguruj `OPENAI_API_KEY`.
    - **Codex OAuth przez PI:** używaj `/model openai-codex/gpt-5.5` tylko wtedy, gdy celowo chcesz używać normalnego uruchamiacza PI z Codex OAuth.
    - **Podagenci:** kieruj zadania kodowania do agenta wyłącznie Codex z własnym modelem i domyślnym `agentRuntime`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    Użyj przełącznika sesji albo wartości domyślnej w konfiguracji:

    - **Dla sesji:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.5` albo `openai-codex/gpt-5.5`.
    - **Domyślnie dla modelu:** ustaw `agents.defaults.models["openai/gpt-5.5"].params.fastMode` albo `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` na `true`.

    Przykład:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Dla OpenAI tryb szybki mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Sesyjne nadpisania `/fast` mają pierwszeństwo przed wartościami domyślnymi konfiguracji.

    Zobacz [Myślenie i tryb szybki](/pl/tools/thinking) oraz [Tryb szybki OpenAI](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem brak odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` i wszystkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ten błąd jest zwracany **zamiast** zwykłej odpowiedzi. Poprawka: dodaj model do
    `agents.defaults.models`, usuń listę dozwolonych albo wybierz model z `/model list`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu
    uwierzytelniania), więc modelu nie można rozwiązać.

    Lista kontrolna poprawek:

    1. Zaktualizuj do bieżącego wydania OpenClaw (albo uruchom ze źródeł `main`), a potem zrestartuj Gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator albo JSON), albo że uwierzytelnianie MiniMax
       istnieje w środowisku/profilach uwierzytelniania, aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisany MiniMax
       OAuth dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z uwzględnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed` dla konfiguracji
       z kluczem API, albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego, a OpenAI do złożonych zadań?">
    Tak. Użyj **MiniMax jako wartości domyślnej** i przełączaj modele **dla sesji**, gdy to potrzebne.
    Fallbacki są przeznaczone dla **błędów**, a nie „trudnych zadań”, więc użyj `/model` albo osobnego agenta.

    **Opcja A: przełączanie dla sesji**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Następnie:

    ```
    /model gpt
    ```

    **Opcja B: osobni agenci**

    - Domyślny agent A: MiniMax
    - Domyślny agent B: OpenAI
    - Trasuj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Trasowanie wielu agentów](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt to wbudowane skróty?">
    Tak. OpenClaw dostarcza kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` dla konfiguracji z kluczem API albo `openai-codex/gpt-5.5`, gdy skonfigurowano Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jeśli ustawisz własny alias o tej samej nazwie, Twoja wartość ma pierwszeństwo.

  </Accordion>

  <Accordion title="Jak zdefiniować/nadpisać skróty modeli (aliasy)?">
    Aliasy pochodzą z `agents.defaults.models.<modelId>.alias`. Przykład:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Następnie `/model sonnet` (albo `/<alias>`, gdy jest obsługiwane) rozwiązuje się do tego identyfikatora modelu.

  </Accordion>

  <Accordion title="Jak dodać modele od innych dostawców, takich jak OpenRouter albo Z.AI?">
    OpenRouter (płatność za token; wiele modeli):

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
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Jeśli odwołasz się do dostawcy/modelu, ale brakuje wymaganego klucza dostawcy, otrzymasz błąd autoryzacji w czasie działania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn autoryzacji. Autoryzacja jest przypisana do agenta i
    przechowywana w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj autoryzację w kreatorze.
    - Albo skopiuj tylko przenośne statyczne profile `api_key` / `token` z magazynu autoryzacji głównego agenta do magazynu autoryzacji nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje on własnego konta; w przeciwnym razie OpenClaw może odczytywać dane z domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje autoryzacji/sesji.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „Wszystkie modele nie powiodły się”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili autoryzacji** w ramach tego samego dostawcy.
    2. **Zastępczy model** jako następny model w `agents.defaults.model.fallbacks`.

    Okresy wyciszenia dotyczą profili, które zawodzą (wykładnicze wycofywanie), dzięki czemu OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca nakłada limity szybkości lub tymczasowo zawodzi.

    Koszyk limitów szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    uzasadniające przełączenie awaryjne.

    Niektóre odpowiedzi wyglądające jak rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym koszyku. Jeśli dostawca zwróci
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może utrzymać to
    w ścieżce rozliczeniowej, ale dopasowania tekstowe specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak ponawialne okno użycia lub
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długotrwałe wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponawiania zamiast przechodzić do
    zastępczego modelu.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje jako sygnały limitu czasu/przeciążenia
    uzasadniające przełączenie awaryjne kształty przejściowe ograniczone do dostawcy,
    takie jak czyste Anthropic `An unknown error occurred`, czyste OpenRouter
    `Provider returned error`, błędy przyczyny zatrzymania, takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, gdy pasuje
    kontekst dostawcy.
    Ogólny wewnętrzny tekst zastępczy, taki jak `LLM request failed with an unknown
    error.`, pozostaje konserwatywny i sam nie wyzwala zastępczego modelu.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć identyfikatora profilu autoryzacji `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie autoryzacji.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile autoryzacji** (nowe i starsze ścieżki)
      - Bieżąca: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsza: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`)
    - **Potwierdź, że zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje wieloagentowe oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź podstawowo status modelu/autoryzacji**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu autoryzacji Anthropic, ale Gateway
    nie może go znaleźć w swoim magazynie autoryzacji.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście Gateway.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście Gateway**.
      - Wyczyść przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście Gateway**
      - W trybie zdalnym profile autoryzacji znajdują się na maszynie Gateway, a nie na laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbowano też Google Gemini i wystąpił błąd?">
    Jeśli konfiguracja modelu obejmuje Google Gemini jako model zastępczy (albo przełączono się na skrót Gemini), OpenClaw wypróbuje go podczas przełączania awaryjnego modelu. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj autoryzację Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby przełączanie awaryjne nie kierowało tam ruchu.

    **Żądanie LLM odrzucone: wymagany podpis myślenia (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki myślenia bez podpisów** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga podpisów dla bloków myślenia.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki myślenia dla Google Antigravity Claude. Jeśli nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile autoryzacji: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil autoryzacji?">
    Profil autoryzacji to nazwany rekord poświadczeń (OAuth lub klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - wybrane przez Ciebie niestandardowe identyfikatory (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil autoryzacji jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili i kolejność dla każdego dostawcy (`auth.order.<provider>`). Nie przechowuje to sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się w krótkim **okresie wyciszenia** (limity szybkości/limity czasu/błędy autoryzacji) albo w dłuższym stanie **wyłączonym** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Okresy wyciszenia limitów szybkości mogą być ograniczone do modelu. Profil, który jest wyciszony
    dla jednego modelu, może nadal nadawać się do użycia dla pokrewnego modelu u tego samego dostawcy,
    podczas gdy okna rozliczeniowe/wyłączenia nadal blokują cały profil.

    Możesz też ustawić zastąpienie kolejności **dla konkretnego agenta** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Aby wskazać konkretnego agenta:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Aby zweryfikować, co faktycznie zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, sonda zgłosi
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth kontra klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma to zastosowanie).
    - **Klucze API** używają rozliczeń za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth i klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja pierwszego uruchomienia](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
