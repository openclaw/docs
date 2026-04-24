---
read_when:
    - Wybieranie lub przełączanie modeli, konfigurowanie aliasów
    - Debugowanie failoveru modeli / „Wszystkie modele zawiodły”
    - Zrozumienie profili uwierzytelniania i sposobu zarządzania nimi
sidebarTitle: Models FAQ
summary: 'FAQ: domyślne modele, wybór, aliasy, przełączanie, failover i profile uwierzytelniania'
title: 'FAQ: modele i uwierzytelnianie'
x-i18n:
    generated_at: "2026-04-24T09:13:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Modelowe i związane z profilami uwierzytelniania pytania i odpowiedzi. W przypadku konfiguracji, sesji, gateway, kanałów i
  rozwiązywania problemów zobacz główne [FAQ](/pl/help/faq).

  ## Modele: wartości domyślne, wybór, aliasy, przełączanie

  <AccordionGroup>
  <Accordion title='Co oznacza „domyślny model”?'>
    Domyślnym modelem OpenClaw jest to, co ustawisz jako:

    ```
    agents.defaults.model.primary
    ```

    Do modeli odwołujesz się jako `provider/model` (przykład: `openai/gpt-5.4` albo `openai-codex/gpt-5.5`). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero na końcu wraca do skonfigurowanego domyślnego dostawcy jako przestarzałej ścieżki zgodności. Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast ujawniać nieaktualną domyślną wartość usuniętego dostawcy. Nadal powinieneś **jawnie** ustawiać `provider/model`.

  </Accordion>

  <Accordion title="Jaki model polecasz?">
    **Zalecana wartość domyślna:** używaj najmocniejszego modelu najnowszej generacji dostępnego w twoim stosie dostawców.
    **Dla agentów z narzędziami lub niezaufanym wejściem:** stawiaj siłę modelu ponad koszt.
    **Do rutynowego/niskiego ryzyka czatu:** używaj tańszych modeli fallback i kieruj według roli agenta.

    MiniMax ma własną dokumentację: [MiniMax](/pl/providers/minimax) i
    [Modele lokalne](/pl/gateway/local-models).

    Zasada praktyczna: używaj **najlepszego modelu, na jaki cię stać** do zadań wysokiej wagi, a tańszego
    modelu do rutynowego czatu lub podsumowań. Możesz kierować modele per agent i używać sub-agentów do
    równoległego wykonywania długich zadań (każdy sub-agent zużywa tokeny). Zobacz [Modele](/pl/concepts/models) i
    [Sub-agenci](/pl/tools/subagents).

    Mocne ostrzeżenie: słabsze / nadmiernie skwantyzowane modele są bardziej podatne na prompt
    injection i niebezpieczne zachowanie. Zobacz [Bezpieczeństwo](/pl/gateway/security).

    Szerszy kontekst: [Modele](/pl/concepts/models).

  </Accordion>

  <Accordion title="Jak przełączyć modele bez wymazywania konfiguracji?">
    Użyj **poleceń modeli** albo edytuj tylko pola **modelu**. Unikaj pełnej podmiany konfiguracji.

    Bezpieczne opcje:

    - `/model` na czacie (szybko, per sesja)
    - `openclaw models set ...` (aktualizuje tylko konfigurację modelu)
    - `openclaw configure --section model` (interaktywnie)
    - edytuj `agents.defaults.model` w `~/.openclaw/openclaw.json`

    Unikaj `config.apply` z częściowym obiektem, chyba że rzeczywiście chcesz zastąpić całą konfigurację.
    Przy edycjach RPC najpierw sprawdź przez `config.schema.lookup` i preferuj `config.patch`.
    Ładunek lookup daje znormalizowaną ścieżkę, płytką dokumentację/ograniczenia schematu i podsumowania bezpośrednich elementów podrzędnych.
    dla częściowych aktualizacji.
    Jeśli nadpisałeś konfigurację, przywróć ją z kopii zapasowej albo uruchom ponownie `openclaw doctor`, aby ją naprawić.

    Dokumentacja: [Modele](/pl/concepts/models), [Configure](/pl/cli/configure), [Config](/pl/cli/config), [Doctor](/pl/gateway/doctor).

  </Accordion>

  <Accordion title="Czy mogę używać modeli self-hosted (llama.cpp, vLLM, Ollama)?">
    Tak. Ollama to najprostsza ścieżka dla modeli lokalnych.

    Najszybsza konfiguracja:

    1. Zainstaluj Ollama ze strony `https://ollama.com/download`
    2. Pobierz model lokalny, na przykład `ollama pull gemma4`
    3. Jeśli chcesz też modele chmurowe, uruchom `ollama signin`
    4. Uruchom `openclaw onboard` i wybierz `Ollama`
    5. Wybierz `Local` albo `Cloud + Local`

    Uwagi:

    - `Cloud + Local` daje ci modele chmurowe oraz twoje lokalne modele Ollama
    - modele chmurowe, takie jak `kimi-k2.5:cloud`, nie wymagają lokalnego pobrania
    - do ręcznego przełączania użyj `openclaw models list` oraz `openclaw models set ollama/<model>`

    Uwaga dotycząca bezpieczeństwa: mniejsze lub mocno skwantyzowane modele są bardziej podatne na prompt
    injection. Zdecydowanie zalecamy **duże modele** dla każdego bota, który może używać narzędzi.
    Jeśli mimo to chcesz używać małych modeli, włącz sandboxing i ścisłe allowlisty narzędzi.

    Dokumentacja: [Ollama](/pl/providers/ollama), [Modele lokalne](/pl/gateway/local-models),
    [Dostawcy modeli](/pl/concepts/model-providers), [Bezpieczeństwo](/pl/gateway/security),
    [Sandboxing](/pl/gateway/sandboxing).

  </Accordion>

  <Accordion title="Jakich modeli używają OpenClaw, Flawd i Krill?">
    - Te wdrożenia mogą się różnić i mogą zmieniać się w czasie; nie ma jednej stałej rekomendacji dostawcy.
    - Sprawdź bieżące ustawienie czasu działania na każdym gateway przez `openclaw models status`.
    - Dla agentów wrażliwych na bezpieczeństwo / korzystających z narzędzi używaj najmocniejszego dostępnego modelu najnowszej generacji.
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

    `/model` (oraz `/model list`) pokazuje kompaktowy, numerowany wybór. Wybierz numerem:

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

    **Jak odpiąć profil ustawiony przez `@profile`?**

    Uruchom ponownie `/model` **bez** sufiksu `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Jeśli chcesz wrócić do wartości domyślnej, wybierz ją z `/model` (albo wyślij `/model <default provider/model>`).
    Użyj `/model status`, aby potwierdzić, który profil uwierzytelniania jest aktywny.

  </Accordion>

  <Accordion title="Czy mogę używać GPT 5.5 do codziennych zadań, a Codex 5.5 do kodowania?">
    Tak. Ustaw jeden jako domyślny i przełączaj w razie potrzeby:

    - **Szybkie przełączenie (per sesja):** `/model openai/gpt-5.4` dla bieżących zadań bezpośredniego OpenAI API z kluczem API albo `/model openai-codex/gpt-5.5` dla zadań GPT-5.5 Codex OAuth.
    - **Domyślnie:** ustaw `agents.defaults.model.primary` na `openai/gpt-5.4` dla użycia z kluczem API albo `openai-codex/gpt-5.5` dla użycia GPT-5.5 Codex OAuth.
    - **Sub-agenci:** kieruj zadania kodowania do sub-agentów z innym modelem domyślnym.

    Bezpośredni dostęp z kluczem API do `openai/gpt-5.5` będzie obsługiwany, gdy OpenAI włączy
    GPT-5.5 w publicznym API. Do tego czasu GPT-5.5 pozostaje dostępny tylko przez subskrypcję/OAuth.

    Zobacz [Modele](/pl/concepts/models) i [Polecenia ukośnikowe](/pl/tools/slash-commands).

  </Accordion>

  <Accordion title="Jak skonfigurować fast mode dla GPT 5.5?">
    Użyj przełącznika sesji albo domyślnego ustawienia w konfiguracji:

    - **Per sesja:** wyślij `/fast on`, gdy sesja używa `openai/gpt-5.4` albo `openai-codex/gpt-5.5`.
    - **Domyślnie per model:** ustaw `agents.defaults.models["openai/gpt-5.4"].params.fastMode` albo `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` na `true`.

    Przykład:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Dla OpenAI fast mode mapuje się na `service_tier = "priority"` w obsługiwanych natywnych żądaniach Responses. Sesyjne nadpisania `/fast` mają pierwszeństwo przed domyślnymi ustawieniami z konfiguracji.

    Zobacz [Thinking i fast mode](/pl/tools/thinking) oraz [OpenAI fast mode](/pl/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Dlaczego widzę „Model ... is not allowed”, a potem brak odpowiedzi?'>
    Jeśli ustawiono `agents.defaults.models`, staje się ono **allowlistą** dla `/model` i wszelkich
    nadpisań sesji. Wybranie modelu, którego nie ma na tej liście, zwraca:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ten błąd jest zwracany **zamiast** zwykłej odpowiedzi. Poprawka: dodaj model do
    `agents.defaults.models`, usuń allowlistę albo wybierz model z `/model list`.

  </Accordion>

  <Accordion title='Dlaczego widzę „Unknown model: minimax/MiniMax-M2.7”?'>
    To oznacza, że **dostawca nie jest skonfigurowany** (nie znaleziono konfiguracji MiniMax ani
    profilu uwierzytelniania), więc model nie może zostać rozwiązany.

    Lista kontrolna naprawy:

    1. Zaktualizuj do bieżącego wydania OpenClaw (albo uruchamiaj ze źródła `main`), a następnie uruchom ponownie gateway.
    2. Upewnij się, że MiniMax jest skonfigurowany (kreator albo JSON) lub że auth MiniMax
       istnieje w env/profilach uwierzytelniania, tak aby pasujący dostawca mógł zostać wstrzyknięty
       (`MINIMAX_API_KEY` dla `minimax`, `MINIMAX_OAUTH_TOKEN` albo zapisany OAuth MiniMax
       dla `minimax-portal`).
    3. Użyj dokładnego identyfikatora modelu (z uwzględnieniem wielkości liter) dla swojej ścieżki auth:
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
    Tak. Używaj **MiniMax jako domyślnego** i przełączaj modele **per sesja** w razie potrzeby.
    Fallbacki służą do obsługi **błędów**, a nie „trudnych zadań”, więc użyj `/model` albo osobnego agenta.

    **Opcja A: przełączanie per sesja**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Następnie:

    ```
    /model gpt
    ```

    **Opcja B: oddzielni agenci**

    - Agent A domyślnie: MiniMax
    - Agent B domyślnie: OpenAI
    - Kieruj według agenta albo użyj `/agent`, aby przełączyć

    Dokumentacja: [Modele](/pl/concepts/models), [Routing Multi-Agent](/pl/concepts/multi-agent), [MiniMax](/pl/providers/minimax), [OpenAI](/pl/providers/openai).

  </Accordion>

  <Accordion title="Czy opus / sonnet / gpt to wbudowane skróty?">
    Tak. OpenClaw dostarcza kilka domyślnych skrótów (stosowanych tylko wtedy, gdy model istnieje w `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` dla konfiguracji z kluczem API albo `openai-codex/gpt-5.5`, gdy skonfigurowano Codex OAuth
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

    Następnie `/model sonnet` (albo `/<alias>`, gdy jest obsługiwane) zostanie rozwiązane do tego identyfikatora modelu.

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

    Jeśli odwołujesz się do `provider/model`, ale brakuje wymaganego klucza dostawcy, dostaniesz błąd auth w czasie działania (np. `No API key found for provider "zai"`).

    **No API key found for provider po dodaniu nowego agenta**

    Zwykle oznacza to, że **nowy agent** ma pusty magazyn auth. Auth jest per agent i
    znajduje się w:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opcje naprawy:

    - Uruchom `openclaw agents add <id>` i skonfiguruj auth podczas kreatora.
    - Albo skopiuj `auth-profiles.json` z `agentDir` głównego agenta do `agentDir` nowego agenta.

    **Nie** używaj ponownie `agentDir` między agentami; powoduje to kolizje auth/sesji.

  </Accordion>
</AccordionGroup>

## Failover modeli i „Wszystkie modele zawiodły”

<AccordionGroup>
  <Accordion title="Jak działa failover?">
    Failover odbywa się w dwóch etapach:

    1. **Rotacja profili uwierzytelniania** w obrębie tego samego dostawcy.
    2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

    Do zawodzących profili stosowane są cooldowny (wykładniczy backoff), dzięki czemu OpenClaw może nadal odpowiadać nawet wtedy, gdy dostawca jest objęty limitem szybkości lub tymczasowo zawodzi.

    Koszyk limitu szybkości obejmuje więcej niż zwykłe odpowiedzi `429`. OpenClaw
    traktuje też komunikaty takie jak `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` oraz okresowe
    limity okna użycia (`weekly/monthly limit reached`) jako limity szybkości
    kwalifikujące się do failoveru.

    Niektóre odpowiedzi wyglądające na billingowe nie są `402`, a niektóre odpowiedzi HTTP `402`
    również pozostają w tym przejściowym koszyku. Jeśli dostawca zwróci
    jawny tekst billingowy przy `401` lub `403`, OpenClaw nadal może utrzymać to w
    ścieżce billingowej, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do
    dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Jeśli komunikat `402`
    wygląda zamiast tego jak limit okna użycia lub
    limit wydatków organizacji/obszaru roboczego kwalifikujący się do ponowienia (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw traktuje go jako
    `rate_limit`, a nie długie wyłączenie billingowe.

    Błędy przepełnienia kontekstu są inne: sygnatury takie jak
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` albo `ollama error: context length
    exceeded` pozostają na ścieżce Compaction/ponowienia zamiast uruchamiać
    fallback modelu.

    Ogólny tekst błędów serwera jest celowo węższy niż „cokolwiek zawierające
    unknown/error”. OpenClaw traktuje jednak przejściowe kształty ograniczone do dostawcy,
    takie jak surowe `An unknown error occurred` w Anthropic, surowe
    `Provider returned error` w OpenRouter, błędy stop-reason takie jak `Unhandled stop reason:
    error`, ładunki JSON `api_error` z przejściowym tekstem serwera
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) oraz błędy zajętości dostawcy takie jak `ModelNotReadyException` jako
    sygnały timeout/przeciążenia kwalifikujące się do failoveru, gdy kontekst dostawcy
    pasuje.
    Ogólny wewnętrzny tekst fallbacku, taki jak `LLM request failed with an unknown
    error.`, pozostaje zachowawczy i sam z siebie nie uruchamia fallbacku modelu.

  </Accordion>

  <Accordion title='Co oznacza „No credentials found for profile anthropic:default”?'>
    Oznacza to, że system próbował użyć identyfikatora profilu uwierzytelniania `anthropic:default`, ale nie mógł znaleźć poświadczeń dla niego w oczekiwanym magazynie auth.

    **Lista kontrolna naprawy:**

    - **Potwierdź, gdzie znajdują się profile uwierzytelniania** (nowe vs starsze ścieżki)
      - Obecnie: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Starsza ścieżka: `~/.openclaw/agent/*` (migrowane przez `openclaw doctor`)
    - **Potwierdź, że twoja zmienna env jest ładowana przez Gateway**
      - Jeśli ustawiasz `ANTHROPIC_API_KEY` w swojej powłoce, ale uruchamiasz Gateway przez systemd/launchd, może jej nie dziedziczyć. Umieść ją w `~/.openclaw/.env` albo włącz `env.shellEnv`.
    - **Upewnij się, że edytujesz właściwego agenta**
      - Konfiguracje wieloagentowe oznaczają, że może istnieć wiele plików `auth-profiles.json`.
    - **Szybko sprawdź stan modelu/auth**
      - Użyj `openclaw models status`, aby zobaczyć skonfigurowane modele i to, czy dostawcy są uwierzytelnieni.

    **Lista kontrolna naprawy dla „No credentials found for profile anthropic”**

    Oznacza to, że przebieg jest przypięty do profilu uwierzytelniania Anthropic, ale Gateway
    nie może go znaleźć w swoim magazynie auth.

    - **Użyj Claude CLI**
      - Uruchom `openclaw models auth login --provider anthropic --method cli --set-default` na hoście gateway.
    - **Jeśli zamiast tego chcesz używać klucza API**
      - Umieść `ANTHROPIC_API_KEY` w `~/.openclaw/.env` na **hoście gateway**.
      - Wyczyść wszelką przypiętą kolejność, która wymusza brakujący profil:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Potwierdź, że uruchamiasz polecenia na hoście gateway**
      - W trybie zdalnym profile uwierzytelniania znajdują się na maszynie gateway, a nie na twoim laptopie.

  </Accordion>

  <Accordion title="Dlaczego próbował też Google Gemini i zawiódł?">
    Jeśli konfiguracja twojego modelu obejmuje Google Gemini jako fallback (albo przełączyłeś się na skrót Gemini), OpenClaw spróbuje użyć go podczas fallbacku modelu. Jeśli nie skonfigurowałeś poświadczeń Google, zobaczysz `No API key found for provider "google"`.

    Poprawka: albo podaj auth Google, albo usuń/unikaj modeli Google w `agents.defaults.model.fallbacks` / aliasach, aby fallback tam nie kierował.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Przyczyna: historia sesji zawiera **bloki thinking bez sygnatur** (często z
    przerwanego/częściowego strumienia). Google Antigravity wymaga sygnatur dla bloków thinking.

    Poprawka: OpenClaw usuwa teraz bloki thinking bez sygnatur dla Google Antigravity Claude. Jeśli nadal się pojawia, rozpocznij **nową sesję** albo ustaw `/thinking off` dla tego agenta.

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

  </Accordion>

  <Accordion title="Jak wyglądają typowe identyfikatory profili?">
    OpenClaw używa identyfikatorów z prefiksem dostawcy, takich jak:

    - `anthropic:default` (częste, gdy nie istnieje tożsamość e-mail)
    - `anthropic:<email>` dla tożsamości OAuth
    - własne identyfikatory, które wybierzesz (np. `anthropic:work`)

  </Accordion>

  <Accordion title="Czy mogę kontrolować, który profil uwierzytelniania jest próbowany jako pierwszy?">
    Tak. Konfiguracja obsługuje opcjonalne metadane profili i kolejność per dostawca (`auth.order.<provider>`). To **nie** przechowuje sekretów; mapuje identyfikatory na dostawcę/tryb i ustawia kolejność rotacji.

    OpenClaw może tymczasowo pominąć profil, jeśli jest w krótkim **cooldown** (limity szybkości, timeouty, błędy auth) albo w dłuższym stanie **disabled** (billing/brak środków). Aby to sprawdzić, uruchom `openclaw models status --json` i sprawdź `auth.unusableProfiles`. Dostrajanie: `auth.cooldowns.billingBackoffHours*`.

    Cooldowny limitu szybkości mogą być ograniczone do modelu. Profil, który jest w cooldown
    dla jednego modelu, nadal może być użyteczny dla modelu siostrzanego u tego samego dostawcy,
    podczas gdy okna billingowe/disabled nadal blokują cały profil.

    Możesz też ustawić **nadpisanie kolejności per agent** (przechowywane w `auth-state.json` tego agenta) przez CLI:

    ```bash
    # Domyślnie używa skonfigurowanego domyślnego agenta (pomiń --agent)
    openclaw models auth order get --provider anthropic

    # Zablokuj rotację do jednego profilu (próbuj tylko tego)
    openclaw models auth order set --provider anthropic anthropic:default

    # Albo ustaw jawną kolejność (fallback w obrębie dostawcy)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Wyczyść nadpisanie (powrót do config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Aby wskazać konkretnego agenta:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Aby sprawdzić, co rzeczywiście zostanie wypróbowane, użyj:

    ```bash
    openclaw models status --probe
    ```

    Jeśli zapisany profil zostanie pominięty z jawnej kolejności, sonda zgłosi
    `excluded_by_auth_order` dla tego profilu zamiast próbować go po cichu.

  </Accordion>

  <Accordion title="OAuth vs klucz API — jaka jest różnica?">
    OpenClaw obsługuje oba:

    - **OAuth** często wykorzystuje dostęp subskrypcyjny (tam, gdzie ma to zastosowanie).
    - **Klucze API** używają rozliczania pay-per-token.

    Kreator jawnie obsługuje Anthropic Claude CLI, OpenAI Codex OAuth i klucze API.

  </Accordion>
</AccordionGroup>

## Powiązane

- [FAQ](/pl/help/faq) — główne FAQ
- [FAQ — szybki start i konfiguracja przy pierwszym uruchomieniu](/pl/help/faq-first-run)
- [Wybór modelu](/pl/concepts/model-providers)
- [Failover modeli](/pl/concepts/model-failover)
