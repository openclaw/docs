---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie przełączania awaryjnego modeli / "Wszystkie modele zakończyły się niepowodzeniem"
    - Zrozumienie profili uwierzytelniania i zarządzanie nimi
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne ustawienia modeli, wybór, aliasy, przełączanie, przełączanie awaryjne i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-05-11T20:32:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1bd3bcfdca583472d42782448271879a2bcaaa21858ab3304da48556ae922c
    source_path: help/faq-models.md
    workflow: 16
---

  Pytania i odpowiedzi dotyczące modeli oraz profili uwierzytelniania. Konfigurację, sesje, Gateway, kanały i
  rozwiązywanie problemów opisuje główne [FAQ](/pl/help/faq).

  ## Modele: ustawienia domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Czym jest „model domyślny”?'>
    Domyślny model OpenClaw to ten, który ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Modele są wskazywane jako `provider/model` (przykład: `openai/gpt-5.5` lub `anthropic/claude-sonnet-4-6`). Jeśli pominiesz dostawcę, OpenClaw najpierw spróbuje użyć aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem, jako przestarzałej ścieżki zgodności, wróci do skonfigurowanego dostawcy domyślnego. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wróci do pierwszej skonfigurowanej pary dostawca/model zamiast ujawniać nieaktualny domyślny model usuniętego dostawcy. Mimo to warto **jawnie** ustawić `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecacie?">
    **Zalecane ustawienie domyślne:** użyj najsilniejszego modelu najnowszej generacji dostępnego w twoim stosie dostawców.
    **Dla agentów z narzędziami lub niezaufanymi danymi wejściowymi:** stawiaj siłę modelu ponad koszt.
    **Dla rutynowego czatu o niskiej stawce:** używaj tańszych modeli zapasowych i kieruj ruch według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) i
    [Modele lokalne](/pl/gateway/local-models).

    Zasada praktyczna: używaj **najlepszego modelu, na jaki cię stać** do pracy o wysokiej stawce, a tańszego
    modelu do rutynowego czatu lub streszczeń. Możesz kierować modele dla poszczególnych agentów i używać subagentów do
    równoległego wykonywania długich zadań (każdy subagent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Subagenci](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze lub nadmiernie kwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowania. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Więcej kontekstu: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez czyszczenia konfiguracji?">
    Użyj **poleceń modeli** albo edytuj tylko pola **model**. Unikaj pełnego zastępowania konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, dla jednej sesji)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edycja `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że zamierzasz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź za pomocą `config.schema.lookup` i preferuj `config.patch`. Ładunek wyszukiwania podaje znormalizowaną ścieżkę, płytkie dokumenty/ograniczenia schematu oraz podsumowania bezpośrednich elementów potomnych.
    dla aktualizacji częściowych.
    Jeśli konfiguracja została nadpisana, przywróć ją z kopii zapasowej albo ponownie uruchom `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Konfiguracja](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama z `https://ollama.com/download`
    2. Pobierz model lokalny, na przykład `ollama pull gemma4`
    3. Jeśli chcesz też używać modeli chmurowych, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje modele chmurowe oraz twoje lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` i `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno kwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli nadal chcesz używać małych modeli, włącz sandboxing i ścisłe listy dozwolonych narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i zmieniać w czasie; nie ma stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie runtime na każdym Gateway poleceniem `openclaw models status`.
    - Dla agentów wrażliwych na bezpieczeństwo lub korzystających z narzędzi używaj najsilniejszego dostępnego modelu najnowszej generacji.

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

    To są wbudowane aliasy. Aliasów niestandardowych można dodać przez `agents.defaults.models`.

    Dostępne modele możesz wyświetlić za pomocą `/model`, `/model list` albo `/model status`.

    `/model` (oraz `/model list`) pokazuje kompaktowy, numerowany selektor. Wybierz numerem:

    ```
    /model 3
    ```

    Możesz też wymusić konkretny profil uwierzytelniania dla dostawcy (dla sesji):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Wskazówka: `/model status` pokazuje, który agent jest aktywny, który plik `auth-profiles.json` jest używany i który profil uwierzytelniania zostanie wypróbowany jako następny.
    Pokazuje też skonfigurowany endpoint dostawcy (`baseUrl`) oraz tryb API (`api`), jeśli są dostępne.

    **Jak odpiąć profil ustawiony za pomocą @profile?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do ustawienia domyślnego, wybierz je z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Jeśli dwóch dostawców udostępnia ten sam identyfikator modelu, którego używa /model?">
    `/model provider/model` wybiera dokładnie tę trasę dostawcy dla sesji.

    Na przykład `qianfan/deepseek-v4-flash` i `deepseek/deepseek-v4-flash` to różne referencje modeli, mimo że obie zawierają `deepseek-v4-flash`. OpenClaw nie powinien po cichu przełączać z jednego dostawcy na drugiego tylko dlatego, że sam identyfikator modelu pasuje.

    Wybrana przez użytkownika referencja `/model` jest również ścisła dla polityki fallback. Jeśli wybrany dostawca/model jest niedostępny, odpowiedź kończy się widocznym błędem zamiast odpowiedzi z `agents.defaults.model.fallbacks`. Skonfigurowane łańcuchy fallback nadal obowiązują dla skonfigurowanych ustawień domyślnych, głównych modeli zadań Cron oraz automatycznie wybranego stanu fallback.

    Jeśli przebieg rozpoczęty z nadpisania niesesyjnego może użyć fallback, OpenClaw najpierw próbuje żądanego dostawcy/modelu, potem skonfigurowanych fallback, a dopiero potem skonfigurowanego modelu głównego. To zapobiega bezpośredniemu przeskakiwaniu z duplikatów samych identyfikatorów modeli z powrotem do dostawcy domyślnego.

    Zobacz [Modele](/pl/concepts/models) i [Model failover](/pl/concepts/model-failover).

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań i Codex 5.5 do kodowania?">
    Tak. Traktuj wybór modelu i wybór runtime oddzielnie:

    - **Natywny agent kodujący Codex:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.5`. Zaloguj się za pomocą `openclaw models auth login --provider openai-codex`, gdy chcesz używać uwierzytelniania z subskrypcji ChatGPT/Codex.
    - **Bezpośrednie zadania OpenAI API poza pętlą agenta:** skonfiguruj `OPENAI_API_KEY` dla obrazów, embeddingów, mowy, realtime i innych powierzchni OpenAI API niebędących agentami.
    - **Uwierzytelnianie kluczem API agenta OpenAI:** użyj `/model openai/gpt-5.5` z uporządkowanym profilem klucza API `openai-codex`.
    - **Subagenci:** kieruj zadania kodowania do agenta skoncentrowanego na Codex z własnym modelem `openai/gpt-5.5`.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować tryb szybki dla GPT 5.5?">
    Użyj przełącznika sesji albo domyślnej konfiguracji:

    - **Dla sesji:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.5`.
    - **Domyślnie dla modelu:** ustaw `agents.defaults.models["openai/gpt-5.5"].params.fastMode` na `true`.

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

    Dla OpenAI tryb szybki mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Nadpisania sesji `/fast` mają pierwszeństwo przed domyślnymi ustawieniami konfiguracji.

    Zobacz [Myślenie i tryb szybki](/pl/tools/thinking) oraz [Tryb szybki OpenAI](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem nie ma odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **listą dozwolonych** dla `/model` oraz wszelkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Ten błąd jest zwracany **zamiast** normalnej odpowiedzi. Poprawka: dodaj dokładny model do
    `agents.defaults.models`, dodaj wildcard dostawcy, taki jak `"provider/*": {}` dla dynamicznych katalogów dostawców, usuń listę dozwolonych albo wybierz model z `/model list`.
    Jeśli polecenie zawierało też `--runtime codex`, najpierw zaktualizuj listę dozwolonych, a potem ponów
    to samo polecenie `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    Oznacza to, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji dostawcy MiniMax ani profilu
    uwierzytelniania), więc modelu nie da się rozwiązać.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącego wydania OpenClaw (albo uruchom ze źródła `main`), a potem zrestartuj Gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator albo JSON) albo że uwierzytelnianie MiniMax
       istnieje w env/profilach uwierzytelniania, aby można było wstrzyknąć pasującego dostawcę
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisany OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z uwzględnieniem wielkości liter) dla swojej ścieżki uwierzytelniania:
       `minimax/MiniMax-M2.7` albo `minimax/MiniMax-M2.7-highspeed` dla konfiguracji z kluczem API,
       albo `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` dla konfiguracji OAuth.
    4. Uruchom:

       ```bash
       openclaw models list
       ```

       i wybierz z listy (albo `/model list` na czacie).

    Zobacz [MiniMax](/pl/providers/minimax) i [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Czy mogę używać MiniMax jako domyślnego, a OpenAI do złożonych zadań?">
    Tak. Użyj **MiniMax jako domyślnego** i przełączaj modele **dla sesji**, gdy to potrzebne.
    Fallback służy do **błędów**, nie do „trudnych zadań”, więc używaj `/model` albo osobnego agenta.

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

    - Domyślny model agenta A: MiniMax
    - Domyślny model agenta B: OpenAI
    - Kieruj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing wielu agentów](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

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

    Jeśli odwołasz się do dostawcy/modelu, ale brakuje wymaganego klucza dostawcy, otrzymasz błąd autoryzacji w czasie działania (np. `No API key found for provider "zai"`).

    **Nie znaleziono klucza API dla dostawcy po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn uwierzytelniania. Uwierzytelnianie jest przypisane do agenta i
    przechowywane w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj uwierzytelnianie w kreatorze.
    - Albo skopiuj tylko przenośne statyczne profile `api_key` / `token` z magazynu uwierzytelniania głównego agenta do magazynu uwierzytelniania nowego agenta.
    - W przypadku profili OAuth zaloguj się z nowego agenta, gdy potrzebuje on własnego konta; w przeciwnym razie OpenClaw może czytać z domyślnego/głównego agenta bez klonowania tokenów odświeżania.

    Nie używaj ponownie `agentDir` między agentami; powoduje to kolizje uwierzytelniania/sesji.

  </Accordion>
</AccordionGroup>

## Awaryjne przełączanie modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa awaryjne przełączanie?">
    Awaryjne przełączanie odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w ramach tego samego dostawcy.
    2. **Przejście na model zapasowy** do następnego modelu w `agents.defaults.model.fallbacks`.

    Czasy odczekania dotyczą zawodzących profili (wykładnicze wycofywanie), dzięki czemu OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca ogranicza szybkość żądań albo tymczasowo zawodzi.

    Koszyk limitów szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okien użycia (`weekly/monthly limit reached`) jako limity szybkości
    uzasadniające awaryjne przełączenie.

    Niektóre odpowiedzi wyglądające na rozliczeniowe nie są `402`, a część
    odpowiedzi HTTP `402` również pozostaje w tym przejściowym koszyku. Jeśli dostawca zwróci
    jawny tekst rozliczeniowy przy `401` lub `403`, OpenClaw nadal może utrzymać go
    w ścieżce rozliczeń, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który jest ich właścicielem (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda natomiast jak ponawialny limit okna użycia albo
    limit wydatków organizacji/przestrzeni roboczej (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długie wyłączenie rozliczeniowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` lub `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast przesuwać
    przejście na model zapasowy.

    Ogólny tekst błędu serwera jest celowo węższy niż „cokolwiek z
    unknown/error w treści”. OpenClaw traktuje przejściowe kształty ograniczone do dostawcy,
    takie jak nagie `An unknown error occurred` od Anthropic, nagie
    `Provider returned error` od OpenRouter, błędy przyczyn zatrzymania takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy takie jak `ModelNotReadyException`, jako
    sygnały limitu czasu/przeciążenia uzasadniające awaryjne przełączenie, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst przejścia awaryjnego, taki jak `LLM request failed with an unknown
    error.`, pozostaje zachowawczy i sam z siebie nie uruchamia przejścia na model zapasowy.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć dla niego poświadczeń w oczekiwanym magazynie uwierzytelniania.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe i starsze ścieżki)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsze: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że Twoja zmienna środowiskowa jest wczytywana przez Gateway**
      - Jeśli ustawisz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchomisz Gateway przez systemd/launchd, może jej nie odziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje wieloagentowe oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Sprawdź stan modelu/uwierzytelniania**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i informację, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że uruchomienie jest przypięte do profilu uwierzytelniania Anthropic, ale Gateway
    nie może znaleźć go w swoim magazynie uwierzytelniania.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście bramy.
    - **Jeśli zamiast tego chcesz użyć klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście bramy**.
      - Wyczyść przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście bramy**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie bramy, a nie na Twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbował też Google Gemini i zakończyło się to błędem?">
    Jeśli Twoja konfiguracja modelu zawiera Google Gemini jako model zapasowy (albo przełączyłeś się na skrót Gemini), OpenClaw spróbuje go podczas awaryjnego przełączania modeli. Jeśli nie skonfigurowano poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Naprawa: podaj uwierzytelnianie Google albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby awaryjne przełączanie nie kierowało tam ruchu.

    **Żądanie LLM odrzucone: wymagana sygnatura myślenia (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki myślenia bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków myślenia.

    Naprawa: OpenClaw usuwa teraz niepodpisane bloki myślenia dla Google Antigravity Claude. Jeśli nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

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

    Aby sprawdzić zapisane profile bez ujawniania sekretów, uruchom `openclaw models auth list` (opcjonalnie `--provider <id>` albo `--json`). Szczegóły znajdziesz w [CLI modeli](/pl/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Jakie są typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - niestandardowe identyfikatory wybrane przez Ciebie (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili oraz kolejność dla każdego dostawcy (`auth.order.<provider>`). Nie przechowuje to sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli znajduje się w krótkim **czasie odczekania** (limity szybkości/limity czasu/błędy uwierzytelniania) albo dłuższym stanie **wyłączenia** (rozliczenia/niewystarczające środki). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Strojenie: `auth.cooldowns.billingBackoffHours*`.

    Czasy odczekania limitów szybkości mogą być ograniczone do modelu. Profil, który jest w czasie odczekania
    dla jednego modelu, może nadal być użyteczny dla pokrewnego modelu u tego samego dostawcy,
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

    Aby sprawdzić, co faktycznie zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty w jawnej kolejności, probe zgłasza
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth kontra klucz API - jaka jest różnica?">
    OpenClaw obsługuje oba rozwiązania:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma to zastosowanie).
    - **Klucze API** używają rozliczania za token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth oraz klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Awaryjne przełączanie modeli](/pl/concepts/model-failover)
