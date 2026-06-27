---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zakończyły się niepowodzeniem”
    - Zrozumienie profili uwierzytelniania i zarządzanie nimi
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne modele, wybór, aliasy, przełączanie, failover i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-06-27T17:40:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  Model- i profil uwierzytelniania: pytania i odpowiedzi. Informacje o konfiguracji, sesjach, Gateway, kanałach i
  rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Modele: wartości domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.5` lub `anthropic/claude-sonnet-4-6`). Jeśli pominiesz dostawcę, OpenClaw najpierw spróbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem, jako przestarzałą ścieżkę zgodności, wróci do skonfigurowanego domyślnego dostawcy. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wróci do pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać nieaktualny domyślny model usuniętego dostawcy. Nadal należy **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecana wartość domyślna:** użyj najsilniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z narzędziami lub niezaufanym wejściem:** stawiaj siłę modelu ponad koszt.
    **Dla rutynowego czatu o niskim ryzyku:** używaj tańszych modeli zapasowych i kieruj ruch według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) oraz
    [Modele lokalne](/pl/gateway/local-models).

    Praktyczna zasada: używaj **najlepszego modelu, na jaki możesz sobie pozwolić** do pracy o wysokiej stawce, a tańszego
    modelu do rutynowego czatu lub streszczeń. Możesz kierować modele per agent i używać podagentów do
    równoległego wykonywania długich zadań (każdy podagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Podagenci](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze lub nadmiernie skwantyzowane modele są bardziej podatne na
    wstrzykiwanie promptu i niebezpieczne zachowanie. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez wyczyszczenia konfiguracji?">
    Użyj **poleceń modelu** albo edytuj tylko pola **model**. Unikaj zastępowania całej konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, dla pojedynczej sesji)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edycja `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z obiektem częściowym, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź za pomocą `config.schema.lookup` i preferuj `config.patch`. Ładunek wyszukiwania podaje znormalizowaną ścieżkę, płytkie dokumenty/ograniczenia schematu oraz podsumowania bezpośrednich elementów podrzędnych
    dla aktualizacji częściowych.
    Jeśli konfiguracja została nadpisana, przywróć ją z kopii zapasowej albo uruchom ponownie `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli hostowanych samodzielnie (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najłatwiejsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz lokalny model, na przykład `ollama pull gemma4`
    3. Jeśli chcesz także modele w chmurze, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele w chmurze oraz Twoje lokalne modele Ollama
    - modele w chmurze, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno skwantyzowane modele są bardziej podatne na wstrzykiwanie
    promptu. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać z czasem; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie środowiska wykonawczego na każdym Gateway za pomocą `openclaw models status`.
    - Dla agentów wrażliwych na bezpieczeństwo lub korzystających z narzędzi używaj najsilniejszego modelu najnowszej generacji dostępnego w danym środowisku.

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

    To są wbudowane aliasy. Własne aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić za pomocą `/model`, `/model list` albo `/model status`.

    `/model` (oraz `/model list`) pokazuje zwięzły, numerowany wybór. Wybierz numerem:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (dla sesji):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany oraz który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany punkt końcowy dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do domyślnego ustawienia, wybierz je z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Jeśli dwóch dostawców udostępnia ten sam identyfikator modelu, którego używa /model?">
    `/model provider/model` wybiera dokładnie tę trasę dostawcy dla sesji.

    Na przykład `qianfan/deepseek-v4-flash` i `deepseek/deepseek-v4-flash` to różne odwołania do modeli, mimo że oba zawierają `deepseek-v4-flash`. OpenClaw nie powinien po cichu przełączać się z jednego dostawcy na drugiego tylko dlatego, że sam identyfikator modelu pasuje.

    Wybrane przez użytkownika odwołanie `/model` jest też ścisłe dla zasad awaryjnych. Jeśli wybrana para dostawca/model jest niedostępna, odpowiedź zakończy się widocznym błędem zamiast odpowiedzieć z `agents.defaults.model.fallbacks`. Skonfigurowane łańcuchy awaryjne nadal obowiązują dla skonfigurowanych wartości domyślnych, głównych modeli zadań Cron i automatycznie wybranego stanu awaryjnego.

    Jeśli uruchomienie rozpoczęte z nadpisania spoza sesji może użyć ścieżki awaryjnej, OpenClaw najpierw próbuje żądanej pary dostawca/model, potem skonfigurowanych modeli awaryjnych, a dopiero potem skonfigurowanego modelu głównego. Zapobiega to sytuacji, w której zduplikowane same identyfikatory modeli przeskakują bezpośrednio z powrotem do domyślnego dostawcy.

    Zobacz [Modele](/pl/concepts/models) i [Przełączanie awaryjne modeli](/pl/concepts/model-failover).

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do kodowania?">
    Tak. Traktuj wybór modelu i wybór środowiska wykonawczego oddzielnie:

    - **Natywny agent kodujący Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5`. Zaloguj się za pomocą `openclaw models auth login --provider openai`, gdy chcesz używać uwierzytelniania subskrypcją ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API poza pętlą agenta:** skonfiguruj `OPENAI_API_KEY` dla obrazów, osadzeń, mowy, realtime i innych powierzchni OpenAI API niezwiązanych z agentem.
    - **Uwierzytelnianie agenta OpenAI kluczem API:** użyj `/model openai/gpt-5.5` z uporządkowanym profilem klucza API `openai`.
    - **Podagenci:** kieruj zadania kodowania do agenta skoncentrowanego na Codex z własnym modelem `openai/gpt-5.5`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    Użyj przełącznika sesji albo domyślnej konfiguracji:

    - **Dla sesji:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.5`.
    - **Domyślnie dla modelu:** ustaw `agents.defaults.models["openai/gpt-5.5"].params.fastMode` na `true`.
    - **Automatyczny próg:** użyj `/fast auto` albo `params.fastMode: "auto"`, aby zaczynać nowe wywołania modelu szybko aż do automatycznego progu, a późniejsze ponowienia, wywołania awaryjne, wyniki narzędzi lub kontynuacje uruchamiać bez trybu szybkiego. Domyślny próg to 60 sekund; ustaw `params.fastAutoOnSeconds` na aktywnym modelu, aby go zmienić.

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

    Dla OpenAI tryb szybki mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Nadpisania sesyjne `/fast` mają pierwszeństwo przed domyślną konfiguracją. Tury serwera aplikacji Codex mogą otrzymać warstwę tylko na początku tury, więc `auto` stosuje się przy następnej turze modelu rozpoczętej przez OpenClaw, a nie wewnątrz już działającej tury serwera aplikacji.

    Zobacz [Myślenie i tryb szybki](/pl/tools/thinking) oraz [Tryb szybki OpenAI](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem nie ma odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` i wszystkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ten błąd jest zwracany **zamiast** zwykłej odpowiedzi. Poprawka: dodaj dokładny model do
    `agents.defaults.models`, dodaj symbol wieloznaczny dostawcy, taki jak `"provider/*": {}` dla dynamicznych katalogów dostawców, usuń listę dozwolonych albo wybierz model z `/model list`.
    Jeśli polecenie zawierało też `--runtime codex`, najpierw zaktualizuj listę dozwolonych, a potem ponów
    to samo polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M3”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu
    uwierzytelniania), więc modelu nie można rozwiązać.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącego wydania OpenClaw (albo uruchom ze źródeł `main`), a następnie zrestartuj Gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator lub JSON), albo że uwierzytelnianie MiniMax
       istnieje w zmiennych środowiskowych/profilach uwierzytelniania, aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisany OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z uwzględnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` albo
       `minimax/MiniMax-M2.7-highspeed` dla konfiguracji z kluczem API, albo
       `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` albo
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego modelu, a OpenAI do złożonych zadań?">
    Tak. Użyj **MiniMax jako domyślnego** i przełączaj modele **per sesja**, gdy trzeba.
    Modele awaryjne służą do **błędów**, nie do „trudnych zadań”, więc użyj `/model` albo osobnego agenta.

    **Opcja A: przełączanie per sesja**

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

    - Domyślny model Agenta A: MiniMax
    - Domyślny model Agenta B: OpenAI
    - Kieruj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wielu agentów](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

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

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest osobne dla każdego agenta i
    przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj tylko przenośne statyczne profile `api_key` / `token` z magazynu uwierzytelniania głównego agenta do magazynu uwierzytelniania nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje własnego konta; w przeciwnym razie OpenClaw może czytać przez domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w ramach tego samego dostawcy.
    2. **Model fallback** do następnego modelu w `agents.defaults.model.fallbacks`.

    Okresy wygaszenia dotyczą zawodzących profili (wykładnicze opóźnianie ponowień), więc OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca ogranicza szybkość żądań lub tymczasowo zawodzi.

    Koszyk limitu szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    kwalifikujące się do przełączania awaryjnego.

    Niektóre odpowiedzi wyglądające jak rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym koszyku. Jeśli dostawca zwraca
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może zachować go
    w ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak ponawialny limit okna użycia lub
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długie wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przechodzić do
    fallbacku modelu.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje przejściowe kształty ograniczone do dostawcy
    jako kwalifikujące się do przełączania awaryjnego sygnały timeoutu/przeciążenia,
    takie jak czyste Anthropic `An unknown error occurred`, czyste OpenRouter
    `Provider returned error`, błędy przyczyny zatrzymania typu `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy takie jak `ModelNotReadyException`,
    gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst fallbacku, taki jak `LLM request failed with an unknown
    error.`, pozostaje traktowany konserwatywnie i sam nie uruchamia fallbacku modelu.

  </Accordion>

  <Accordion title='Co oznacza "No credentials found for profile anthropic:default"?'>
    Oznacza to, że system próbował użyć ID profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe vs starsze ścieżki)
      - Bieżąca: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsza: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`)
    - **Potwierdź, że Twoja zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` lub włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje z wieloma agentami oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź podstawowo status modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla "No credentials found for profile anthropic"**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może znaleźć go w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego spróbował też Google Gemini i zawiódł?">
    Jeśli Twoja konfiguracja modelu obejmuje Google Gemini jako fallback (albo przełączono na skrót Gemini), OpenClaw spróbuje go podczas fallbacku modelu. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj uwierzytelnianie Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby fallback tam nie kierował.

    **Żądanie LLM odrzucone: wymagana sygnatura thinking (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki thinking bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków thinking.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki thinking dla Google Antigravity Claude. Jeśli nadal się pojawia, rozpocznij **nową sesję** lub ustaw `/thinking off` dla tego agenta.

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

    Aby sprawdzić zapisane profile bez ujawniania sekretów, uruchom `openclaw models auth list` (opcjonalnie `--provider <id>` lub `--json`). Szczegóły znajdziesz w [CLI modeli](/pl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Jakie są typowe ID profili?">
    OpenClaw używa ID z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - wybrane przez Ciebie niestandardowe ID (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane dla profili oraz kolejność dla każdego dostawcy (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje ID na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się on w krótkim **okresie wygaszenia** (limity szybkości/timeouty/błędy uwierzytelniania) lub dłuższym stanie **wyłączenia** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Strojenie: `auth.cooldowns.billingBackoffHours*`.

    Okresy wygaszenia limitów szybkości mogą być ograniczone do modelu. Profil, który jest wygaszany
    dla jednego modelu, może nadal nadawać się do użycia dla siostrzanego modelu u tego samego dostawcy,
    podczas gdy okna rozliczeniowe/wyłączenia nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **dla konkretnego agenta** (przechowywane w `auth-state.json` tego agenta) za pomocą CLI:

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

    Aby sprawdzić, co faktycznie zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, probe zgłasza
    `excluded_by_auth_order` dla tego profilu, zamiast po cichu go próbować.

  </Accordion>

  <Accordion title="OAuth kontra klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba:

    - **OAuth / logowanie CLI** często wykorzystuje dostęp z subskrypcji tam, gdzie
      dostawca go obsługuje. W przypadku Anthropic backend Claude CLI w OpenClaw używa
      Claude Code `claude -p`; Anthropic obecnie traktuje to jako użycie Agent
      SDK/programistyczne, z osobnym miesięcznym kredytem Agent SDK od
      15 czerwca 2026 r.
    - **Klucze API** używają rozliczeń za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth i klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Model failover](/pl/concepts/model-failover)
