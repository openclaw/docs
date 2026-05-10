---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zawiodły”
    - Zrozumienie profili uwierzytelniania i sposobu zarządzania nimi
sidebarTitle: Models FAQ
summary: 'FAQ: wartości domyślne modeli, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-05-10T19:40:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62ff4ee6f455e9b8786d79b71dc9be53e650afbe177e3d467665aa407cadfdfd
    source_path: help/faq-models.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące modeli i profili uwierzytelniania. Informacje o konfiguracji, sesjach, Gateway, kanałach i
  rozwiązywaniu problemów znajdziesz w głównym [FAQ](/pl/help/faq).

  ## Modele: wartości domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to wartość ustawiona jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.5` lub `anthropic/claude-sonnet-4-6`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, następnie unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego dostawcy domyślnego jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszej skonfigurowanej pary dostawca/model zamiast pokazywać nieaktualną wartość domyślną usuniętego dostawcy. Nadal warto **jawnie** ustawić `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecana wartość domyślna:** użyj najsilniejszego modelu najnowszej generacji dostępnego w twoim zestawie dostawców.
    **Dla agentów z włączonymi narzędziami lub obsługujących niezaufane dane wejściowe:** przedkładaj siłę modelu nad koszt.
    **Dla rutynowego czatu o niskiej stawce:** używaj tańszych modeli zapasowych i kieruj zadania według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) i
    [Modele lokalne](/pl/gateway/local-models).

    Zasada ogólna: używaj **najlepszego modelu, na jaki cię stać** do pracy o wysokiej stawce, a tańszego
    modelu do rutynowego czatu lub streszczeń. Możesz kierować modele per agent i używać podagentów do
    równoległego wykonywania długich zadań (każdy podagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Podagenty](/pl/tools/subagents).

    Silne ostrzeżenie: słabsze lub nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowania. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączać modele bez czyszczenia konfiguracji?">
    Użyj **poleceń modelu** albo edytuj tylko pola **model**. Unikaj pełnego zastępowania konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź przez `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup podaje znormalizowaną ścieżkę, płytkie dokumenty/ograniczenia schematu oraz podsumowania bezpośrednich elementów podrzędnych.
    dla częściowych aktualizacji.
    Jeśli konfiguracja została nadpisana, odtwórz ją z kopii zapasowej albo ponownie uruchom `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać samodzielnie hostowanych modeli (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz lokalny model, np. `ollama pull gemma4`
    3. Jeśli chcesz także modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele chmurowe oraz twoje lokalne modele Ollama
    - modele chmurowe takie jak `kimi-k2.5:cloud` nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub silnie skwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz piaskownicę i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Piaskownica](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać w czasie; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie runtime na każdym Gateway przez `openclaw models status`.
    - Dla agentów wrażliwych pod względem bezpieczeństwa lub z włączonymi narzędziami użyj najsilniejszego modelu najnowszej generacji dostępnego u dostawcy.

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

    To są wbudowane aliasy. Niestandardowe aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić za pomocą `/model`, `/model list` albo `/model status`.

    `/model` (oraz `/model list`) pokazuje kompaktowy, numerowany wybór. Wybierz numer:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (per sesja):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany endpoint dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do wartości domyślnej, wybierz ją z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań i Codex 5.5 do programowania?">
    Tak. Traktuj wybór modelu i wybór runtime oddzielnie:

    - **Natywny agent programistyczny Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5`. Zaloguj się przez `openclaw models auth login --provider openai-codex`, gdy chcesz użyć uwierzytelniania subskrypcją ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API poza pętlą agenta:** skonfiguruj `OPENAI_API_KEY` dla obrazów, embeddingów, mowy, realtime i innych powierzchni OpenAI API niezwiązanych z agentem.
    - **Uwierzytelnianie kluczem API agenta OpenAI:** użyj `/model openai/gpt-5.5` z uporządkowanym profilem klucza API `openai-codex`.
    - **Podagenty:** kieruj zadania programistyczne do agenta skoncentrowanego na Codex z własnym modelem `openai/gpt-5.5`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia ukośnikowe](/pl/tools/slash-commands).

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

    Dla OpenAI tryb szybki mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Nadpisania sesji `/fast` mają pierwszeństwo przed domyślnymi wartościami konfiguracji.

    Zobacz [Myślenie i tryb szybki](/pl/tools/thinking) oraz [Tryb szybki OpenAI](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem brak odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się to **listą dozwolonych** dla `/model` i wszystkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ten błąd jest zwracany **zamiast** zwykłej odpowiedzi. Naprawa: dodaj dokładny model do
    `agents.defaults.models`, dodaj wildcard dostawcy, np. `"provider/*": {}` dla dynamicznych katalogów dostawców, usuń listę dozwolonych albo wybierz model z `/model list`.
    Jeśli polecenie zawierało też `--runtime codex`, najpierw zaktualizuj listę dozwolonych, a następnie ponów
    to samo polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu uwierzytelniania), więc nie można rozwiązać modelu.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącej wersji OpenClaw (albo uruchom ze źródeł `main`), a następnie zrestartuj Gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator lub JSON) albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` lub zapisane OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z rozróżnianiem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` lub `minimax/MiniMax-M2.7-highspeed` dla konfiguracji
       z kluczem API albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego modelu, a OpenAI do złożonych zadań?">
    Tak. Używaj **MiniMax jako wartości domyślnej** i przełączaj modele **per sesja**, gdy to potrzebne.
    Fallbacki służą do **błędów**, nie do „trudnych zadań”, więc użyj `/model` albo osobnego agenta.

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

    - Domyślny model agenta A: MiniMax
    - Domyślny model agenta B: OpenAI
    - Kieruj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wieloagentowy](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt to wbudowane skróty?">
    Tak. OpenClaw zawiera kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Jeśli ustawisz własny alias o tej samej nazwie, twoja wartość ma pierwszeństwo.

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

    Następnie `/model sonnet` (albo `/<alias>`, gdy obsługiwane) rozwiązuje się do tego identyfikatora modelu.

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

## Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w obrębie tego samego dostawcy.
    2. **Model zastępczy** jako następny model w `agents.defaults.model.fallbacks`.

    Okresy wyciszenia dotyczą profili, które zawodzą (wykładnicze wycofywanie), dzięki czemu OpenClaw może nadal odpowiadać, nawet gdy dostawca ma limit szybkości albo tymczasowo zawodzi.

    Koszyk limitu szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    kwalifikujące się do przełączenia awaryjnego.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym koszyku. Jeśli dostawca zwróci
    jednoznaczny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może umieścić go
    w ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który jest ich właścicielem (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak możliwe do ponowienia okno użycia albo
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długotrwałe wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast uruchamiać
    model zastępczy.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje przejściowe kształty ograniczone do dostawcy,
    takie jak surowe Anthropic `An unknown error occurred`, surowe OpenRouter
    `Provider returned error`, błędy przyczyn zatrzymania, takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy, takie jak `ModelNotReadyException`, jako
    sygnały limitu czasu/przeciążenia kwalifikujące się do przełączenia awaryjnego, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst zastępczy, taki jak `LLM request failed with an unknown
    error.`, pozostaje zachowawczy i sam z siebie nie wyzwala modelu zastępczego.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?' >
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe i starsze ścieżki)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że zmienna środowiskowa jest ładowana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje z wieloma agentami oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź orientacyjnie stan modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i informację, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może go znaleźć w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść każdą przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbował też Google Gemini i zakończyło się to błędem?">
    Jeśli konfiguracja modelu zawiera Google Gemini jako model zastępczy (albo przełączono na skrót Gemini), OpenClaw spróbuje go użyć podczas przełączania awaryjnego modeli. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj uwierzytelnianie Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby ścieżka zastępcza tam nie prowadziła.

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
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth lub klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Aby sprawdzić zapisane profile bez ujawniania sekretów, uruchom `openclaw models auth list` (opcjonalnie `--provider <id>` lub `--json`). Szczegóły znajdziesz w [CLI modeli](/pl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (typowe, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - wybrane przez Ciebie niestandardowe identyfikatory (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane dla profili i kolejność per dostawca (`auth.order.<provider>`). Nie przechowuje to sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się w krótkim **okresie wyciszenia** (limity szybkości/limity czasu/błędy uwierzytelniania) albo w dłuższym stanie **wyłączonym** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Okresy wyciszenia limitów szybkości mogą być ograniczone do modelu. Profil, który jest wyciszony
    dla jednego modelu, nadal może być użyteczny dla pokrewnego modelu u tego samego dostawcy,
    natomiast okna rozliczeniowe/wyłączenia nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **per agent** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Domyślnie używa skonfigurowanego agenta domyślnego (pomiń --agent)
    openclaw models auth order get --provider anthropic

    # Zablokuj rotację do jednego profilu (próbuj tylko tego)
    openclaw models auth order set --provider anthropic anthropic:default

    # Albo ustaw jawną kolejność (zastępowanie w obrębie dostawcy)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Wyczyść nadpisanie (wróć do auth.order z konfiguracji / round-robin)
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

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, sonda zgłasza
    `excluded_by_auth_order` dla tego profilu, zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth a klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba rozwiązania:

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
