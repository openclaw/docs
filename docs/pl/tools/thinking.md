---
read_when:
    - Dostosowywanie parsowania lub wartości domyślnych dyrektyw thinking, fast-mode albo verbose
summary: Składnia dyrektyw /think, /fast, /verbose, /trace oraz widoczność procesu rozumowania
title: Poziomy rozumowania
x-i18n:
    generated_at: "2026-07-12T15:46:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa wbudowana w dowolną treść wiadomości przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, w przybliżeniu odpowiadające klasycznej drabinie magicznych fraz Anthropic: „myśl” < „myśl intensywnie” < „myśl jeszcze intensywniej” < „myśl ultraintensywnie”:
  - minimal ~ „myśl”
  - low ~ „myśl intensywnie”
  - medium ~ „myśl jeszcze intensywniej”
  - high ~ „myśl ultraintensywnie” (maksymalny budżet)
  - xhigh ~ „myśl ultraintensywnie+” (GPT-5.2+ i modele Codex oraz poziom wysiłku Anthropic Claude Opus 4.7+)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane przez Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7+ oraz dynamiczne myślenie Google Gemini)
  - max → maksymalne wnioskowanie dostawcy (Anthropic Claude Opus 4.7+; Ollama mapuje je na najwyższy natywny poziom wysiłku `think`)
  - ultra → maksymalne wnioskowanie dostawcy oraz proaktywna orkiestracja podagentów, gdy obsługuje ją wybrany model lub środowisko uruchomieniowe
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` są mapowane na `xhigh`.
  - `highest` jest mapowane na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane przez profil dostawcy. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh`, `max` i `ultra` są oferowane wyłącznie dla profili dostawcy, modelu i środowiska uruchomieniowego, które je obsługują. Wpisane dyrektywy z nieobsługiwanymi poziomami są odrzucane wraz z prawidłowymi opcjami dla danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są ponownie mapowane według rangi w profilu dostawcy. `adaptive` przechodzi na `medium` w modelach bez obsługi adaptacyjnej, natomiast `xhigh` i `max` przechodzą na największy obsługiwany poziom inny niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, jeśli nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.8 i Opus 4.7 zachowują wyłączone myślenie, chyba że jawnie ustawisz poziom myślenia. Po włączeniu adaptacyjnego myślenia domyślnym poziomem wysiłku zarządzanym przez dostawcę dla Opus 4.8 jest `high`.
  - Anthropic Claude Opus 4.7+ mapuje `/think xhigh` na adaptacyjne myślenie oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus.
  - Anthropic Claude Opus 4.7+ udostępnia również `/think max`; jest ono mapowane na tę samą ścieżkę maksymalnego wysiłku zarządzaną przez dostawcę.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba poziomy są mapowane na `reasoning_effort: "max"` DeepSeek, natomiast niższe poziomy inne niż `off` są mapowane na `high`.
  - Modele DeepSeek V4 kierowane przez OpenRouter udostępniają `/think xhigh` i wysyłają obsługiwane przez OpenRouter wartości `reasoning.effort` zamiast natywnego pola najwyższego poziomu `reasoning_effort` DeepSeek. Niższe poziomy inne niż `off` są mapowane na `high`, a zapisane nadpisania `max` przechodzą na `xhigh`.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` jest mapowane na natywne `think: "high"`, ponieważ natywne API Ollama przyjmuje ciągi poziomu wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` za pośrednictwem obsługi poziomu wysiłku specyficznej dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek wnioskowania zamiast wysyłać nieobsługiwaną wartość.
  - GPT-5.6 Sol i Terra udostępniają natywne `/think ultra` za pośrednictwem środowiska uruchomieniowego Codex. GPT-5.6 Luna udostępnia poziomy do `max`, ponieważ jej katalog Codex nie deklaruje obsługi Ultra.
  - Wbudowane środowisko uruchomieniowe OpenClaw udostępnia logiczne `/think ultra` dla GPT-5.6 Sol, Terra i Luna. Wysyła maksymalny poziom wysiłku dostawcy i dodaje wskazówki dotyczące proaktywnej orkiestracji podagentów w zakresie danego uruchomienia.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć obsługę `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Wykorzystuje to te same metadane zgodności, które mapują wychodzące ładunki poziomu wysiłku wnioskowania OpenAI, dzięki czemu menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane odwołania OpenRouter Hunter Alpha pomijają wstrzykiwanie wnioskowania przez serwer proxy, ponieważ ta wycofana trasa mogła zwracać tekst końcowej odpowiedzi w polach wnioskowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie zarządzane przez dostawcę Gemini. Żądania Gemini 3 pomijają stałe `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal są mapowane na najbliższe `thinkingLevel` Gemini lub budżet dla danej rodziny modeli.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) w ścieżce strumieniowej zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub żądania. Zapobiega to wyciekowi przyrostów `reasoning_content` z nienatywnego formatu strumienia Anthropic w M2.x. MiniMax-M3 (oraz M3.x) jest wyjątkiem: M3 emituje prawidłowe bloki myślenia Anthropic i zwraca pustą treść, gdy myślenie jest wyłączone, dlatego OpenClaw pozostawia M3 na ścieżce pominiętego lub adaptacyjnego myślenia dostawcy.
  - Z.AI (`zai/*`) jest binarne (`on`/`off`) dla większości modeli GLM. Wyjątkiem jest GLM-5.2: udostępnia `/think off|low|high|max`, mapuje `low` i `high` na `reasoning_effort: "high"` Z.AI oraz mapuje `max` na `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) zawsze myśli. Jego profil udostępnia tylko `on`, a OpenClaw pomija wychodzące pole `thinking` zgodnie z wymaganiami Moonshot. Inne modele `moonshot/*` mapują `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje dla `tool_choice` wyłącznie `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa wbudowana w wiadomość (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Wartość domyślna dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Wartość zapasowa: wartość domyślna deklarowana przez dostawcę, jeśli jest dostępna; w przeciwnym razie modele obsługujące wnioskowanie przyjmują `medium` lub najbliższy obsługiwany poziom inny niż `off` dla danego modelu, a modele bez wnioskowania pozostają na `off`.

## Ustawianie wartości domyślnej sesji

- Wyślij wiadomość zawierającą **wyłącznie** dyrektywę (dozwolone są białe znaki), np. `/think:medium` lub `/t high`.
- Ustawienie obowiązuje w bieżącej sesji (domyślnie osobno dla każdego nadawcy). Użyj `/think default`, aby usunąć nadpisanie sesji i odziedziczyć skonfigurowaną wartość domyślną lub wartość dostawcy; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- `/think off` zapisuje jawne nadpisanie wyłączające. Wyłącza ono myślenie do czasu zmiany lub usunięcia nadpisania sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Poziom myślenia ustawiono na wysoki.` / `Myślenie wyłączone.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone ze wskazówką, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Stosowanie przez agenta

- **Wbudowany OpenClaw**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta OpenClaw.
- **Backend Claude CLI**: podczas używania `claude-cli` konkretne poziomy inne niż wyłączony są przekazywane do Claude Code jako `--effort`; `adaptive` usuwa skonfigurowane flagi poziomu wysiłku i przekazuje ustalenie efektywnego poziomu środowisku, ustawieniom oraz domyślnym wartościom modelu Claude Code. Zobacz [backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `auto|on|off|default`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i odpowiada `Tryb szybki ustawiono na automatyczny.`, `Tryb szybki włączony.` lub `Tryb szybki wyłączony.`. Użyj `/fast default`, aby usunąć nadpisanie sesji i odziedziczyć skonfigurowaną wartość domyślną; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w następującej kolejności:
  1. Nadpisanie `/fast auto|on|off` wbudowane w wiadomość lub będące jej jedyną treścią (`/fast default` usuwa tę warstwę)
  2. Nadpisanie sesji
  3. Wartość domyślna dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Wartość zapasowa: `off`
- `auto` zachowuje tryb sesji lub konfiguracji jako automatyczny, ale rozstrzyga każde nowe wywołanie modelu niezależnie. Wywołania rozpoczęte przed limitem czasu trybu automatycznego mają włączony tryb szybki; późniejsze ponowienia, przejścia na wartość zapasową, wywołania po wyniku narzędzia lub kontynuacje rozpoczynają się z wyłączonym trybem szybkim. Domyślny limit wynosi 60 sekund; ustaw `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` dla aktywnego modelu, aby go zmienić.
- Dla `openai/*` tryb szybki jest mapowany na priorytetowe przetwarzanie OpenAI przez wysyłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla modeli `openai/*` / `openai-codex/*` opartych na Codex tryb szybki wysyła tę samą flagę `service_tier=priority` w żądaniach Responses Codex. Natywne tury serwera aplikacji Codex otrzymują poziom usługi wyłącznie przy `turn/start` albo rozpoczęciu lub wznowieniu wątku, dlatego `auto` nie może zmienić poziomu już trwającej tury serwera aplikacji; zostanie zastosowane do następnej tury modelu uruchomionej przez OpenClaw.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki jest mapowany na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` w ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) zamienia `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` zastępują domyślną wartość trybu szybkiego, gdy ustawiono oba. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla adresów bazowych serwera proxy innych niż Anthropic.
- `/status` pokazuje `Fast`, gdy tryb szybki jest włączony, oraz `Fast:auto`, gdy skonfigurowanym trybem jest automatyczny.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Włączono szczegółowe rejestrowanie.` / `Wyłączono szczegółowe rejestrowanie.`; nieprawidłowe poziomy zwracają wskazówkę bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; usuń je w interfejsie sesji, wybierając `inherit`.
- Autoryzowani nadawcy zewnętrznych kanałów mogą utrwalać nadpisanie szczegółowości sesji. Wewnętrzni klienci Gateway/czatu internetowego potrzebują uprawnienia `operator.admin`, aby je utrwalić.
- Dyrektywa wbudowana dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są wartości domyślne sesji lub globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi odsyłają każde wywołanie narzędzia jako osobną wiadomość zawierającą wyłącznie metadane, poprzedzoną prefiksem `<emoji> <tool-name>: <arg>`, jeśli jest dostępny. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (w osobnych dymkach), a nie jako strumieniowe przyrosty.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w trybie normalnym, ale przyrostki z nieprzetworzonymi szczegółami błędów są ukryte, chyba że szczegółowość ma wartość `full`.
- Gdy szczegółowość ma wartość `full`, wyniki narzędzi są również przekazywane po zakończeniu (w osobnym dymku, skrócone do bezpiecznej długości). Jeśli podczas trwającego uruchomienia przełączysz `/verbose on|full|off`, kolejne dymki narzędzi będą respektować nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje postać podsumowań narzędzi `/verbose` oraz wierszy narzędzi w roboczych komunikatach o postępie. Użyj `"explain"` (domyślne), aby otrzymywać zwięzłe, czytelne dla człowieka etykiety, takie jak `🛠️ Exec: sprawdzanie składni JS`; użyj `"raw"`, jeśli na potrzeby debugowania chcesz również dołączyć nieprzetworzone polecenie lub szczegóły. Ustawienie `agents.list[].toolProgressDetail` dla agenta zastępuje wartość domyślną.
  - `explain`: `🛠️ Exec: sprawdź składnię JS dla /tmp/app.js`
  - `raw`: `🛠️ Exec: sprawdź składnię JS dla /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Pluginu (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza dane wyjściowe śledzenia Pluginu w sesji i odpowiada `Włączono śledzenie Pluginu.` / `Wyłączono śledzenie Pluginu.`.
- Dyrektywa wbudowana dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są wartości domyślne sesji lub globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` ma węższy zakres niż `/verbose`: udostępnia tylko wiersze śledzenia lub debugowania należące do Pluginu, takie jak podsumowania debugowania Active Memory.
- Wiersze śledzenia mogą pojawiać się w `/status` oraz jako uzupełniająca wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.

## Widoczność wnioskowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyświetlanie bloków rozumowania w odpowiedziach.
- Po włączeniu rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Thinking`.
- `stream`: przesyła strumieniowo rozumowanie podczas generowania odpowiedzi, jeśli aktywny kanał obsługuje podgląd rozumowania, a następnie wysyła ostateczną odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa w treści, następnie nadpisanie sesji, później wartość domyślna dla agenta (`agents.list[].reasoningDefault`), globalna wartość domyślna (`agents.defaults.reasoningDefault`), a na końcu wartość zapasowa (`off`).

Nieprawidłowe znaczniki rozumowania lokalnego modelu są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w zwykłych odpowiedziach, a niezamknięte rozumowanie występujące po już widocznym tekście również jest ukrywane. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty znacznik otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowy znacznik otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonych uprawnień znajduje się w sekcji [Tryb podwyższonych uprawnień](/pl/tools/elevated).

## Heartbeat

- Treścią sondy Heartbeat jest skonfigurowany monit Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy w treści wiadomości Heartbeat są stosowane jak zwykle (należy jednak unikać zmieniania wartości domyślnych sesji za pomocą Heartbeat).
- Domyślnie Heartbeat dostarcza tylko końcowy ładunek. Aby wysłać również osobną wiadomość `Thinking` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub dla konkretnego agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu internetowego

- Selektor rozumowania w czacie internetowym po załadowaniu strony odzwierciedla poziom sesji zapisany w magazynie lub konfiguracji sesji przychodzącej.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji za pomocą `sessions.patch`; nie czeka na kolejne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Wysłanie wiadomości w czasie, gdy zmiany selektora modelu, rozumowania lub szybkości są nadal stosowane, czeka na wszystkie oczekujące poprawki selektorów; jeśli zmiana się nie powiedzie, wiadomość pozostaje niewysłana do sprawdzenia.
- Pierwszą opcją jest zawsze wyczyszczenie nadpisania. Wyświetla ona `Dziedziczony: <rozstrzygnięty poziom>`, w tym `Dziedziczony: Wyłączone`, gdy dziedziczone rozumowanie jest wyłączone.
- Jawne opcje selektora używają bezpośrednich etykiet poziomów, zachowując etykiety dostawcy, jeśli są dostępne (na przykład `Maksymalny` dla oznaczonej przez dostawcę opcji `max`).
- Selektor używa `thinkingLevels` zwracanych przez wiersz sesji lub wartości domyślne Gateway, a `thinkingOptions` pozostaje starszą listą etykiet. Interfejs przeglądarkowy nie przechowuje własnej listy wyrażeń regularnych dostawców; pluginy definiują zestawy poziomów właściwe dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, dzięki czemu dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane poziomy modelu i poziom domyślny.
- Pluginy dostawców pośredniczące w dostępie do modeli Claude powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi pośredników pozostały spójne.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` lub `ultra`) i może zawierać wyświetlaną etykietę `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Punkty zaczepienia profili otrzymują scalone dane katalogowe, jeśli są dostępne, w tym `reasoning`, `compat.thinkingFormat` i `compat.supportedReasoningEfforts`. Używaj tych danych do udostępniania profili binarnych lub niestandardowych tylko wtedy, gdy skonfigurowany kontrakt żądania obsługuje odpowiedni ładunek.
- Pluginy narzędzi, które muszą zweryfikować jawne nadpisanie rozumowania, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` wraz z `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców ani modeli. Przekaż `agentRuntime`, gdy narzędzie jest właścicielem ścieżki wykonania, na przykład w przypadku zawsze osadzonego uruchomienia.
- Pluginy narzędzi mające dostęp do skonfigurowanych niestandardowych metadanych modelu mogą przekazać `catalog` do `resolveThinkingPolicy`, aby opcjonalne włączenia `compat.supportedReasoningEfforts` były uwzględniane podczas walidacji po stronie pluginu.
- Opublikowane starsze punkty zaczepienia (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze i wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` oraz `thinkingDefault`, dzięki czemu klienci ACP i czatu renderują te same identyfikatory i etykiety profili, których używa walidacja w czasie wykonywania.
