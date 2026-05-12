---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / "Wszystkie modele zakończyły się niepowodzeniem"
    - Czym są profile uwierzytelniania i jak nimi zarządzać
sidebarTitle: Models FAQ
summary: 'Często zadawane pytania: domyślne ustawienia modeli, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-05-12T04:10:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: a42a8c24798908c7782a9f0c6f0af3fac0c1ad4e5f80d64778f6fd7e1e174f3b
    source_path: help/faq-models.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące modeli oraz profili uwierzytelniania. Konfigurację, sesje, Gateway, kanały i
  rozwiązywanie problemów opisuje główne [FAQ](/pl/help/faq).

  ## Modele: domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.5` lub `anthropic/claude-sonnet-4-6`). Jeśli pominiesz dostawcę, OpenClaw najpierw spróbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla dokładnego identyfikatora modelu, a dopiero potem wróci do skonfigurowanego domyślnego dostawcy jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw użyje pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać nieaktualny domyślny model usuniętego dostawcy. Nadal należy **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecany domyślny:** użyj najsilniejszego modelu najnowszej generacji dostępnego w stosie Twoich dostawców.
    **Dla agentów z narzędziami lub z niezaufanymi danymi wejściowymi:** priorytetem powinna być siła modelu, nie koszt.
    **Do rutynowego czatu o niskim ryzyku:** używaj tańszych modeli zapasowych i kieruj ruch według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) oraz
    [Modele lokalne](/pl/gateway/local-models).

    Ogólna zasada: używaj **najlepszego modelu, na jaki Cię stać** do pracy wysokiego ryzyka, a tańszego
    modelu do rutynowego czatu lub streszczeń. Możesz kierować modele per agent i używać podagentów do
    równoległego wykonywania długich zadań (każdy podagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) oraz
    [Podagenci](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze lub nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowania. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez czyszczenia konfiguracji?">
    Użyj **poleceń modeli** albo edytuj tylko pola **model**. Unikaj pełnego zastępowania konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edycja `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z obiektem częściowym, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup podaje znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu oraz podsumowania bezpośrednich elementów podrzędnych
    dla częściowych aktualizacji.
    Jeśli nadpiszesz konfigurację, przywróć ją z kopii zapasowej albo ponownie uruchom `openclaw doctor`, aby ją naprawić.

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

    - `Cloud + Local` daje modele chmurowe oraz lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno skwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać w czasie; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie środowiska uruchomieniowego na każdym Gateway za pomocą `openclaw models status`.
    - Dla agentów wrażliwych bezpieczeństwowo lub z narzędziami używaj najsilniejszego modelu najnowszej generacji dostępnego w danym momencie.

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

    To są wbudowane aliasy. Aliasów niestandardowych można dodać przez `agents.defaults.models`.

    Dostępne modele można wyświetlić za pomocą `/model`, `/model list` lub `/model status`.

    `/model` (oraz `/model list`) pokazuje kompaktowy, numerowany wybór. Wybierz po numerze:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (per sesja):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany endpoint dostawcy (`baseUrl`) oraz tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony za pomocą @profile?**

    Ponownie uruchom `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do ustawienia domyślnego, wybierz je z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Jeśli dwóch dostawców udostępnia ten sam identyfikator modelu, którego użyje /model?">
    `/model provider/model` wybiera dokładną trasę tego dostawcy dla sesji.

    Na przykład `qianfan/deepseek-v4-flash` i `deepseek/deepseek-v4-flash` to różne referencje modeli, mimo że obie zawierają `deepseek-v4-flash`. OpenClaw nie powinien po cichu przełączać z jednego dostawcy na drugiego tylko dlatego, że pasuje sam identyfikator modelu.

    Wybrana przez użytkownika referencja `/model` jest też ścisła dla polityki fallback. Jeśli wybrany dostawca/model jest niedostępny, odpowiedź zakończy się widocznym błędem zamiast odpowiedzi z `agents.defaults.model.fallbacks`. Skonfigurowane łańcuchy fallback nadal mają zastosowanie do skonfigurowanych ustawień domyślnych, modeli podstawowych zadań Cron oraz automatycznie wybranego stanu fallback.

    Jeśli uruchomienie rozpoczęte z obejścia innego niż sesyjne może użyć fallback, OpenClaw najpierw próbuje żądanego dostawcy/modelu, potem skonfigurowanych fallback, a dopiero potem skonfigurowanego modelu podstawowego. Zapobiega to sytuacji, w której zduplikowane same identyfikatory modeli od razu wracają do domyślnego dostawcy.

    Zobacz [Modele](/pl/concepts/models) oraz [Failover modeli](/pl/concepts/model-failover).

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do programowania?">
    Tak. Traktuj wybór modelu i wybór środowiska uruchomieniowego osobno:

    - **Natywny agent programistyczny Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5`. Zaloguj się przez `openclaw models auth login --provider openai-codex`, gdy chcesz używać uwierzytelniania z subskrypcji ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API poza pętlą agenta:** skonfiguruj `OPENAI_API_KEY` dla obrazów, embeddings, mowy, realtime i innych powierzchni OpenAI API niebędących agentem.
    - **Uwierzytelnianie OpenAI agent kluczem API:** użyj `/model openai/gpt-5.5` z uporządkowanym profilem klucza API `openai-codex`.
    - **Podagenci:** kieruj zadania programistyczne do agenta skupionego na Codex z własnym modelem `openai/gpt-5.5`.

    Zobacz [Modele](/pl/concepts/models) oraz [Polecenia ukośnika](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    Użyj przełącznika sesji albo domyślnej konfiguracji:

    - **Per sesja:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.5`.
    - **Domyślnie per model:** ustaw `agents.defaults.models["openai/gpt-5.5"].params.fastMode` na `true`.

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

    Dla OpenAI tryb szybki mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Sesyjne nadpisania `/fast` mają pierwszeństwo przed domyślną konfiguracją.

    Zobacz [Myślenie i tryb szybki](/pl/tools/thinking) oraz [Tryb szybki OpenAI](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem nie ma odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` i wszystkich
    obejść sesyjnych. Wybór modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ten błąd jest zwracany **zamiast** normalnej odpowiedzi. Poprawka: dodaj dokładny model do
    `agents.defaults.models`, dodaj wildcard dostawcy, taki jak `"provider/*": {}` dla dynamicznych katalogów dostawcy, usuń listę dozwolonych albo wybierz model z `/model list`.
    Jeśli polecenie zawierało też `--runtime codex`, najpierw zaktualizuj listę dozwolonych, a potem ponów
    to samo polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani
    profilu uwierzytelniania), więc modelu nie można rozwiązać.

    Lista kontrolna poprawek:

    1. Uaktualnij do bieżącego wydania OpenClaw (albo uruchom ze źródeł `main`), a następnie zrestartuj Gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator lub JSON), albo że uwierzytelnianie MiniMax
       istnieje w zmiennych środowiskowych/profilach uwierzytelniania, aby można było wstrzyknąć pasującego dostawcę
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` lub zapisane OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z uwzględnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` lub `minimax/MiniMax-M2.7-highspeed` dla konfiguracji z kluczem API,
       albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) oraz [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego, a OpenAI do złożonych zadań?">
    Tak. Użyj **MiniMax jako domyślnego** i przełączaj modele **per sesja**, gdy jest to potrzebne.
    Fallback służy do **błędów**, nie do „trudnych zadań”, więc używaj `/model` albo osobnego agenta.

    **Opcja A: przełączanie per sesja**

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

    - Agent A domyślnie: MiniMax
    - Agent B domyślnie: OpenAI
    - Kieruj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wielu agentów](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt to wbudowane skróty?">
    Tak. OpenClaw zawiera kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-7`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
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

    Jeśli odwołasz się do dostawcy/modelu, ale brakuje wymaganego klucza dostawcy, otrzymasz błąd uwierzytelniania w czasie wykonywania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest przypisane do agenta i
    przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj tylko przenośne statyczne profile `api_key` / `token` z magazynu uwierzytelniania głównego agenta do magazynu uwierzytelniania nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje on własnego konta; w przeciwnym razie OpenClaw może odczytywać dane z domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „Wszystkie modele zakończyły się niepowodzeniem”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w ramach tego samego dostawcy.
    2. **Awaryjny wybór modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

    Okresy wyciszenia dotyczą profili, które kończą się niepowodzeniem (wykładniczy backoff), więc OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca ogranicza liczbę żądań lub tymczasowo zawodzi.

    Zasobnik limitów szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje także komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    kwalifikujące się do przełączenia awaryjnego.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    także pozostają w tym przejściowym zasobniku. Jeśli dostawca zwraca
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może zachować go
    w ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak ponawialny limit okna użycia albo
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długotrwałe wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przechodzić do
    awaryjnego wyboru modelu.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje przejściowe kształty ograniczone do dostawcy,
    takie jak surowe Anthropic `An unknown error occurred`, surowe OpenRouter
    `Provider returned error`, błędy przyczyny zatrzymania, takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, jako
    kwalifikujące się do przełączenia awaryjnego sygnały limitu czasu/przeciążenia, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst awaryjny, taki jak `LLM request failed with an unknown
    error.`, pozostaje zachowawczy i sam nie wyzwala awaryjnego wyboru modelu.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć ID profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego danych uwierzytelniających w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe i starsze ścieżki)
      - Bieżąca: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsza: `~/.openclaw/agent/*` (migrowana przez `openclaw doctor`)
    - **Potwierdź, że Twoja zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie dziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje z wieloma agentami oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź zdroworozsądkowo status modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i sprawdzić, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

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

  <Accordion title="Dlaczego próbował też Google Gemini i zakończył się niepowodzeniem?">
    Jeśli konfiguracja modelu obejmuje Google Gemini jako opcję awaryjną (albo przełączono się na skrót Gemini), OpenClaw spróbuje go podczas awaryjnego wyboru modelu. Jeśli nie skonfigurowano danych uwierzytelniających Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj uwierzytelnianie Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby awaryjny wybór modelu nie kierował tam ruchu.

    **Żądanie LLM odrzucone: wymagana sygnatura myślenia (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki myślenia bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków myślenia.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki myślenia dla Google Antigravity Claude. Jeśli problem nadal występuje, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord danych uwierzytelniających (OAuth lub klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Aby sprawdzić zapisane profile bez ujawniania sekretów, uruchom `openclaw models auth list` (opcjonalnie `--provider <id>` lub `--json`). Szczegóły znajdziesz w [Models CLI](/pl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Jakie są typowe ID profili?">
    OpenClaw używa ID z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - wybrane przez Ciebie niestandardowe ID (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania zostanie wypróbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili i kolejność per dostawca (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje ID na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli jest w krótkim **okresie wyciszenia** (limity szybkości/limity czasu/niepowodzenia uwierzytelniania) albo dłuższym stanie **wyłączenia** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Okresy wyciszenia limitów szybkości mogą być ograniczone do modelu. Profil, który jest w okresie wyciszenia
    dla jednego modelu, może nadal być użyteczny dla pokrewnego modelu u tego samego dostawcy,
    natomiast okna rozliczeniowe/wyłączenia nadal blokują cały profil.

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

    Aby sprawdzić, co faktycznie zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, probe zgłosi
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth a klucz API — jaka jest różnica?">
    OpenClaw obsługuje oba:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma to zastosowanie).
    - **Klucze API** używają rozliczeń za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth oraz klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
