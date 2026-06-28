---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zawiodły”
    - Zrozumienie profili uwierzytelniania i sposobów zarządzania nimi
sidebarTitle: Models FAQ
summary: 'FAQ: wartości domyślne modeli, wybór, aliasy, przełączanie, failover i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-06-28T20:43:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3bfff016fc8b5afff5dde2b939b7fa431aa5a0309aa2833e7dd4675b638ca225
    source_path: help/faq-models.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące modeli oraz profili uwierzytelniania. Informacje o konfiguracji, sesjach, Gateway, kanałach i rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Modele: wartości domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.5` lub `anthropic/claude-sonnet-4-6`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać nieaktualną wartość domyślną usuniętego dostawcy. Nadal należy **jawnie** ustawić `provider/model`.

  </Accordion>

  <Accordion title="Jaki model zalecacie?">
    **Zalecana wartość domyślna:** użyj najsilniejszego modelu najnowszej generacji dostępnego w twoim stosie dostawców.
    **Dla agentów z narzędziami lub niezaufanymi danymi wejściowymi:** przedkładaj siłę modelu nad koszt.
    **Dla rutynowego czatu o niskim ryzyku:** używaj tańszych modeli rezerwowych i trasuj według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) oraz
    [Modele lokalne](/pl/gateway/local-models).

    Zasada ogólna: używaj **najlepszego modelu, na jaki możesz sobie pozwolić** do pracy o wysokim ryzyku, a tańszego
    modelu do rutynowego czatu lub streszczeń. Możesz trasować modele dla poszczególnych agentów i używać podagentów do
    równoległego wykonywania długich zadań (każdy podagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Podagenci](/pl/tools/subagents).

    Silne ostrzeżenie: słabsze lub nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowania. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez kasowania konfiguracji?">
    Użyj **poleceń modeli** albo edytuj tylko pola **modelu**. Unikaj pełnych podmian konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, dla jednej sesji)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup podaje znormalizowaną ścieżkę, płytką dokumentację schematu/ograniczenia oraz podsumowania bezpośrednich elementów podrzędnych
    do częściowych aktualizacji.
    Jeśli konfiguracja została nadpisana, przywróć ją z kopii zapasowej albo uruchom ponownie `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli hostowanych samodzielnie (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz model lokalny, na przykład `ollama pull gemma4`
    3. Jeśli chcesz też używać modeli chmurowych, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele chmurowe oraz lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub silnie skwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać z czasem; nie ma stałego zalecenia dotyczącego dostawcy.
    - Sprawdź bieżące ustawienie runtime na każdym Gateway poleceniem `openclaw models status`.
    - Dla agentów wrażliwych na bezpieczeństwo lub z włączonymi narzędziami używaj najsilniejszego dostępnego modelu najnowszej generacji.

  </Accordion>

  <Accordion title="Jak przełączać modele w locie (bez restartu)?">
    Użyj polecenia `/model` jako osobnej wiadomości:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    To są wbudowane aliasy. Niestandardowe aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić za pomocą `/model`, `/model list` albo `/model status`.

    `/model` (oraz `/model list`) pokazuje zwarty, numerowany wybór. Wybierz według numeru:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (dla sesji):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje także skonfigurowany punkt końcowy dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do wartości domyślnej, wybierz ją z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Jeśli dwóch dostawców udostępnia ten sam identyfikator modelu, którego użyje /model?">
    `/model provider/model` wybiera dokładnie tę trasę dostawcy dla sesji.

    Na przykład `qianfan/deepseek-v4-flash` i `deepseek/deepseek-v4-flash` to różne referencje modeli, mimo że obie zawierają `deepseek-v4-flash`. OpenClaw nie powinien po cichu przełączać się z jednego dostawcy na drugiego tylko dlatego, że sam identyfikator modelu pasuje.

    Wybrana przez użytkownika referencja `/model` jest też ścisła dla polityki modeli rezerwowych. Jeśli wybrany dostawca/model jest niedostępny, odpowiedź kończy się widocznym błędem zamiast odpowiedzią z `agents.defaults.model.fallbacks`. Skonfigurowane łańcuchy modeli rezerwowych nadal mają zastosowanie do skonfigurowanych wartości domyślnych, głównych modeli zadań Cron oraz automatycznie wybranego stanu rezerwowego.

    Jeśli uruchomienie rozpoczęte z nadpisania spoza sesji może używać modelu rezerwowego, OpenClaw najpierw próbuje żądanego dostawcy/modelu, potem skonfigurowanych modeli rezerwowych, a dopiero potem skonfigurowanego modelu głównego. To zapobiega przeskakiwaniu zduplikowanych samych identyfikatorów modeli bezpośrednio z powrotem do domyślnego dostawcy.

    Zobacz [Modele](/pl/concepts/models) i [Przełączanie awaryjne modeli](/pl/concepts/model-failover).

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do kodowania?">
    Tak. Traktuj wybór modelu i wybór runtime osobno:

    - **Natywny agent kodujący Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5`. Zaloguj się przez `openclaw models auth login --provider openai`, gdy chcesz używać uwierzytelniania subskrypcji ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API poza pętlą agenta:** skonfiguruj `OPENAI_API_KEY` dla obrazów, embeddingów, mowy, realtime i innych powierzchni OpenAI API spoza agenta.
    - **Uwierzytelnianie agenta OpenAI kluczem API:** użyj `/model openai/gpt-5.5` z uporządkowanym profilem klucza API `openai`.
    - **Podagenci:** trasuj zadania kodowania do agenta skoncentrowanego na Codex z jego własnym modelem `openai/gpt-5.5`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia slash](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    Użyj przełącznika sesji albo domyślnej konfiguracji:

    - **Dla sesji:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.5`.
    - **Domyślnie dla modelu:** ustaw `agents.defaults.models["openai/gpt-5.5"].params.fastMode` na `true`.
    - **Automatyczny próg:** użyj `/fast auto` albo `params.fastMode: "auto"`, aby rozpoczynać nowe wywołania modelu szybko aż do automatycznego progu, a późniejsze ponowienia, modele rezerwowe, wyniki narzędzi lub kontynuacje rozpoczynać bez trybu szybkiego. Domyślny próg to 60 sekund; ustaw `params.fastAutoOnSeconds` na aktywnym modelu, aby go zmienić.

    Przykład:

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

    Dla OpenAI tryb szybki mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Nadpisania sesji `/fast` mają pierwszeństwo przed domyślnymi ustawieniami konfiguracji. Tury app-server Codex mogą otrzymać poziom tylko na początku tury, więc `auto` stosuje się do następnej tury modelu rozpoczętej przez OpenClaw, a nie wewnątrz już działającej tury app-server.

    Zobacz [Thinking i tryb szybki](/pl/tools/thinking) oraz [Tryb szybki OpenAI](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem brak odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` i wszelkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ten błąd jest zwracany **zamiast** normalnej odpowiedzi. Naprawa: dodaj dokładny model do
    `agents.defaults.models`, dodaj wildcard dostawcy, taki jak `"provider/*": {}` dla dynamicznych katalogów dostawców, usuń listę dozwolonych albo wybierz model z `/model list`.
    Jeśli polecenie zawierało też `--runtime codex`, najpierw zaktualizuj listę dozwolonych, a potem ponów
    to samo polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M3”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu uwierzytelniania), więc modelu nie można rozwiązać.

    Lista kontrolna naprawy:

    1. Uaktualnij do bieżącego wydania OpenClaw (albo uruchom ze źródeł `main`), a następnie zrestartuj Gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator lub JSON) albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisany OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z rozróżnianiem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` albo
       `minimax/MiniMax-M2.7-highspeed` dla konfiguracji klucza API, albo
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` albo
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
    Modele rezerwowe są przeznaczone na **błędy**, a nie „trudne zadania”, więc użyj `/model` albo osobnego agenta.

    **Opcja A: przełączanie dla sesji**

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

    Następnie:

    ```
    /model gpt
    ```

    **Opcja B: osobni agenci**

    - Domyślny dla agenta A: MiniMax
    - Domyślny dla agenta B: OpenAI
    - Trasuj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wieloagentowy](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt to wbudowane skróty?">
    Tak. OpenClaw dostarcza kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

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
          },
        },
      },
    }
    ```

    Następnie `/model sonnet` (lub `/<alias>`, gdy jest obsługiwane) rozwiązuje się do tego ID modelu.

  </Accordion>

  <Accordion title="Jak dodać modele od innych dostawców, takich jak OpenRouter lub Z.AI?">
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

    Jeśli odwołujesz się do dostawcy/modelu, ale brakuje wymaganego klucza dostawcy, otrzymasz błąd uwierzytelniania w czasie działania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest per agent i
    przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj tylko przenośne statyczne profile `api_key` / `token` z magazynu uwierzytelniania głównego agenta do magazynu uwierzytelniania nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje własnego konta; w przeciwnym razie OpenClaw może odczytywać dane z domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w ramach tego samego dostawcy.
    2. **Model fallback** do następnego modelu w `agents.defaults.model.fallbacks`.

    Okresy wyciszenia dotyczą zawodzących profili (wykładnicze opóźnianie ponowień), więc OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca ogranicza limity lub tymczasowo zawodzi.

    Koszyk limitów szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    kwalifikujące się do przełączenia awaryjnego.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie są `402`, a część odpowiedzi HTTP `402`
    także pozostaje w tym przejściowym koszyku. Jeśli dostawca zwraca
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może
    utrzymać go w ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który jest ich właścicielem (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda zamiast tego jak ponawialny limit okna użycia lub
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie jako długie wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przechodzić do
    fallback modelu.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje kształty przejściowe ograniczone do dostawcy,
    takie jak surowe Anthropic `An unknown error occurred`, surowe OpenRouter
    `Provider returned error`, błędy przyczyny zatrzymania takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, jako
    sygnały timeout/przeciążenia kwalifikujące się do przełączenia awaryjnego, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst fallback, taki jak `LLM request failed with an unknown
    error.`, pozostaje konserwatywny i sam w sobie nie wyzwala fallback modelu.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć ID profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe i starsze ścieżki)
      - Aktualne: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że Twoja zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje wieloagentowe oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź sensowność statusu modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może znaleźć go w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść wszelką przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbował też Google Gemini i zawiódł?">
    Jeśli konfiguracja modelu obejmuje Google Gemini jako fallback (lub przełączono na skrót Gemini), OpenClaw spróbuje go podczas fallback modelu. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: albo podaj uwierzytelnianie Google, albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby fallback nie kierował tam ruchu.

    **Żądanie LLM odrzucone: wymagana sygnatura thinking (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki thinking bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków thinking.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki thinking dla Google Antigravity Claude. Jeśli nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth lub klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Aby sprawdzić zapisane profile bez wypisywania sekretów, uruchom `openclaw models auth list` (opcjonalnie `--provider <id>` lub `--json`). Szczegóły znajdziesz w [CLI modeli](/pl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Jakie są typowe ID profili?">
    OpenClaw używa ID z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - własne ID wybrane przez Ciebie (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane dla profili oraz kolejność per dostawca (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje ID na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli jest w krótkim **okresie wyciszenia** (limity szybkości/timeouty/błędy uwierzytelniania) lub w dłuższym stanie **wyłączonym** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Strojenie: `auth.cooldowns.billingBackoffHours*`.

    Okresy wyciszenia limitów szybkości mogą być ograniczone do modelu. Profil, który jest w okresie wyciszenia
    dla jednego modelu, nadal może być użyteczny dla pokrewnego modelu u tego samego dostawcy,
    podczas gdy okna rozliczeniowe/wyłączenia nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **per agent** (przechowywane w `auth-state.json` tego agenta) przez CLI:

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

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, probe zgłosi
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth kontra klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba rozwiązania:

    - **OAuth / logowanie CLI** często wykorzystuje dostęp subskrypcyjny tam, gdzie
      dostawca go obsługuje. Dla Anthropic backend Claude CLI w OpenClaw używa
      Claude Code `claude -p`; Anthropic obecnie traktuje to jako użycie Agent
      SDK/programistyczne. Anthropic wstrzymał osobną zmianę kredytów Agent
      SDK z 15 czerwca 2026 r., więc na razie nadal korzysta to z limitów użycia
      subskrypcji. Zobacz [artykuł Anthropic o planie Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
      aby uzyskać aktualną informację o wstrzymaniu.
    - **Klucze API** używają rozliczeń za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth oraz klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja pierwszego uruchomienia](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modelu](/pl/concepts/model-failover)
