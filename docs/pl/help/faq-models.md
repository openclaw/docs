---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / „Wszystkie modele zawiodły”
    - Omówienie profili uwierzytelniania i sposobu zarządzania nimi
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne modele, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-05-05T01:47:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące modeli i profili uwierzytelniania. Konfigurację, sesje, Gateway, kanały i
  rozwiązywanie problemów opisuje główne [FAQ](/pl/help/faq).

  ## Modele: ustawienia domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to model ustawiony jako:

    ```
    agents.defaults.model.primary
    ```

    Do modeli odwołuje się jako `provider/model` (przykład: `openai/gpt-5.5` lub `openai-codex/gpt-5.5`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast pokazywać nieaktualną wartość domyślną usuniętego dostawcy. Nadal należy **jawnie** ustawić `provider/model`.

  </Accordion>

  <Accordion title="Jaki model rekomendujecie?">
    **Rekomendowana wartość domyślna:** użyj najsilniejszego modelu najnowszej generacji dostępnego w Twoim stosie dostawców.
    **Dla agentów z narzędziami lub niezaufanym wejściem:** przedkładaj siłę modelu nad koszt.
    **Dla rutynowego czatu o niskim ryzyku:** używaj tańszych modeli zapasowych i kieruj zadania według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) i
    [Modele lokalne](/pl/gateway/local-models).

    Ogólna zasada: używaj **najlepszego modelu, na jaki Cię stać**, do pracy o wysokiej stawce, a tańszego
    modelu do rutynowego czatu lub streszczeń. Możesz kierować modele per agent i używać podagentów do
    równoleglenia długich zadań (każdy podagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Podagenci](/pl/tools/subagents).

    Ważne ostrzeżenie: słabsze lub nadmiernie skwantyzowane modele są bardziej podatne na wstrzykiwanie
    promptów i niebezpieczne zachowanie. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez czyszczenia konfiguracji?">
    Użyj **poleceń modeli** albo edytuj tylko pola **model**. Unikaj pełnych podmian konfiguracji.

    Bezpieczne opcje:

    - `/model` w czacie (szybko, dla danej sesji)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edycja `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że chcesz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź przez `config.schema.lookup` i preferuj `config.patch`. Ładunek lookup podaje znormalizowaną ścieżkę, płytką dokumentację schematu/ograniczeń oraz podsumowania bezpośrednich elementów potomnych.
    dla częściowych aktualizacji.
    Jeśli konfiguracja została nadpisana, przywróć ją z kopii zapasowej albo uruchom ponownie `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz model lokalny, na przykład `ollama pull gemma4`
    3. Jeśli chcesz także modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje Ci modele chmurowe oraz lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub silnie skwantyzowane modele są bardziej podatne na wstrzykiwanie
    promptów. Zdecydowanie rekomendujemy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać z czasem; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie runtime na każdym gatewayu poleceniem `openclaw models status`.
    - Dla agentów wrażliwych bezpieczeństwowo lub korzystających z narzędzi używaj najsilniejszego modelu najnowszej generacji, jaki jest dostępny.

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

    To są wbudowane aliasy. Własne aliasy można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić przez `/model`, `/model list` albo `/model status`.

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
    Pokazuje też skonfigurowany punkt końcowy dostawcy (`baseUrl`) i tryb API (`api`), gdy są dostępne.

    **Jak odpiąć profil ustawiony przez @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do wartości domyślnej, wybierz ją z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do programowania?">
    Tak. Traktuj wybór modelu i wybór runtime osobno:

    - **Natywny agent programistyczny Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5` i `agents.defaults.agentRuntime.id` na `"codex"`. Zaloguj się przez `openclaw models auth login --provider openai-codex`, gdy chcesz używać uwierzytelniania subskrypcji ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API przez PI:** użyj `/model openai/gpt-5.5` bez nadpisania runtime Codex i skonfiguruj `OPENAI_API_KEY`.
    - **Codex OAuth przez PI:** używaj `/model openai-codex/gpt-5.5` tylko wtedy, gdy celowo chcesz normalnego runnera PI z Codex OAuth.
    - **Podagenci:** kieruj zadania programistyczne do agenta tylko dla Codex z własnym modelem i domyślnym `agentRuntime`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    Użyj przełącznika sesji albo domyślnej konfiguracji:

    - **Per sesja:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.5` albo `openai-codex/gpt-5.5`.
    - **Domyślnie per model:** ustaw `agents.defaults.models["openai/gpt-5.5"].params.fastMode` albo `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` na `true`.

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

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem brak odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` i wszystkich
    nadpisań sesji. Wybranie modelu spoza tej listy zwraca:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ten błąd jest zwracany **zamiast** normalnej odpowiedzi. Naprawa: dodaj model do
    `agents.defaults.models`, usuń listę dozwolonych albo wybierz model z `/model list`.
    Jeśli polecenie zawierało też `--runtime codex`, najpierw dodaj model, a potem ponów
    to samo polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu
    uwierzytelniania), więc nie można rozwiązać modelu.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącego wydania OpenClaw (albo uruchom ze źródeł `main`), a następnie zrestartuj gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator lub JSON), albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, aby można było wstrzyknąć pasującego dostawcę
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` lub zapisane MiniMax
       OAuth dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z rozróżnianiem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed` dla konfiguracji
       z kluczem API, albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` w czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego modelu, a OpenAI do złożonych zadań?">
    Tak. Użyj **MiniMax jako wartości domyślnej** i przełączaj modele **per sesja**, gdy to potrzebne.
    Mechanizmy fallback służą do **błędów**, a nie do „trudnych zadań”, więc użyj `/model` albo osobnego agenta.

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

    Wtedy `/model sonnet` (albo `/<alias>`, gdy obsługiwane) rozwiązuje się do tego identyfikatora modelu.

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

    Jeśli odwołujesz się do dostawcy/modelu, ale brakuje wymaganego klucza dostawcy, otrzymasz błąd uwierzytelniania w czasie wykonywania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest osobne dla każdego agenta i
    przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj wyłącznie przenośne statyczne profile `api_key` / `token` z magazynu uwierzytelniania głównego agenta do magazynu uwierzytelniania nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje on własnego konta; w przeciwnym razie OpenClaw może odczytywać dane z domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Przełączanie awaryjne modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa przełączanie awaryjne?">
    Przełączanie awaryjne odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w obrębie tego samego dostawcy.
    2. **Przejście na model zapasowy** do następnego modelu w `agents.defaults.model.fallbacks`.

    Okresy karencji dotyczą zawodzących profili (wykładnicze opóźnienie ponawiania), więc OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca jest objęty limitem żądań albo tymczasowo zawodzi.

    Kategoria limitów żądań obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okna użycia (`weekly/monthly limit reached`) jako limity żądań
    uzasadniające przełączenie awaryjne.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie mają statusu `402`, a niektóre odpowiedzi HTTP `402`
    także pozostają w tej przejściowej kategorii. Jeśli dostawca zwraca
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może zachować go w
    ścieżce rozliczeniowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak możliwe do ponowienia ograniczenie okna użycia albo
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie jako długotrwałe wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` albo `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przechodzić do modelu
    zapasowego.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z fragmentem unknown/error”.
    OpenClaw traktuje jako sygnały przekroczenia czasu/przeciążenia uzasadniające
    przełączenie awaryjne przejściowe wzorce ograniczone do dostawcy, takie jak samo
    Anthropic `An unknown error occurred`, samo OpenRouter
    `Provider returned error`, błędy przyczyny zatrzymania takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem błędu serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy takie jak `ModelNotReadyException`, gdy
    kontekst dostawcy pasuje.
    Ogólny wewnętrzny tekst błędu, taki jak `LLM request failed with an unknown
    error.`, pozostaje traktowany zachowawczo i samodzielnie nie wyzwala przełączenia
    modelu zapasowego.

  </Accordion>

  <Accordion title='Co oznacza „Nie znaleziono poświadczeń dla profilu anthropic:default”?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe ścieżki kontra starsze)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że zmienna środowiskowa jest wczytywana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje z wieloma agentami oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź stan modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele oraz to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „Nie znaleziono poświadczeń dla profilu anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może znaleźć go w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście Gateway.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście Gateway**.
      - Wyczyść każdą przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście Gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie Gateway, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego spróbował też Google Gemini i zakończył się niepowodzeniem?">
    Jeśli konfiguracja modeli obejmuje Google Gemini jako model zapasowy (albo przełączysz się na skrót Gemini), OpenClaw spróbuje go podczas przełączania na model zapasowy. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj uwierzytelnianie Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby przełączanie na model zapasowy nie kierowało tam żądań.

    **Żądanie LLM odrzucone: wymagany podpis rozumowania (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki rozumowania bez podpisów** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga podpisów dla bloków rozumowania.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki rozumowania dla Google Antigravity Claude. Jeśli problem nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

  </Accordion>
</AccordionGroup>

## Profile uwierzytelniania: czym są i jak nimi zarządzać

Powiązane: [/concepts/oauth](/pl/concepts/oauth) (przepływy OAuth, przechowywanie tokenów, wzorce wielu kont)

<AccordionGroup>
  <Accordion title="Czym jest profil uwierzytelniania?">
    Profil uwierzytelniania to nazwany rekord poświadczeń (OAuth albo klucz API) powiązany z dostawcą. Profile znajdują się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Aby sprawdzić zapisane profile bez wypisywania sekretów, uruchom `openclaw models auth list` (opcjonalnie `--provider <id>` albo `--json`). Szczegóły znajdziesz w [CLI modeli](/pl/cli/models#openclaw-models-auth-list).

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (typowe, gdy nie ma tożsamości e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - wybrane przez Ciebie identyfikatory niestandardowe (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili oraz kolejność dla każdego dostawcy (`auth.order.<provider>`). Nie przechowuje to sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się on w krótkim **okresie karencji** (limity żądań/przekroczenia czasu/błędy uwierzytelniania) albo w dłuższym stanie **wyłączenia** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Okresy karencji dla limitów żądań mogą być ograniczone do modelu. Profil, który jest w okresie karencji
    dla jednego modelu, nadal może być używalny dla pokrewnego modelu u tego samego dostawcy,
    podczas gdy okna rozliczeniowe/wyłączenia nadal blokują cały profil.

    Możesz też ustawić nadpisanie kolejności **dla agenta** (przechowywane w `auth-state.json` tego agenta) za pomocą CLI:

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

    Aby sprawdzić, co faktycznie zostanie spróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, sprawdzenie zgłasza
    `excluded_by_auth_order` dla tego profilu zamiast po cichu go próbować.

  </Accordion>

  <Accordion title="OAuth kontra klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba warianty:

    - **OAuth** często wykorzystuje dostęp z subskrypcji (tam, gdzie ma to zastosowanie).
    - **Klucze API** używają rozliczeń za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OAuth OpenAI Codex oraz klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Przełączanie awaryjne modeli](/pl/concepts/model-failover)
