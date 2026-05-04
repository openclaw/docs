---
read_when:
    - Dostosowywanie parsowania dyrektyw thinking, fast-mode lub verbose albo ich wartości domyślnych
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace i widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-05-04T02:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne reasoning dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują na `xhigh`.
  - `highest` mapuje na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane przez profil dostawcy. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są pokazywane tylko dla profili dostawca/model, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z prawidłowymi opcjami dla danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są remapowane według rangi profilu dostawcy. `adaptive` wraca do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` wracają do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek jego API pozostaje po stronie dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia też `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku po stronie dostawcy.
  - Modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż `off` mapują na `high`.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` mapuje na natywne `think: "high"`, ponieważ natywne API Ollama przyjmuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku w Responses API specyficzną dla modelu. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony payload reasoning zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące payloady wysiłku reasoning OpenAI, więc menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane odwołania OpenRouter Hunter Alpha pomijają wstrzykiwanie reasoning przez proxy, ponieważ ta wycofana trasa mogła zwracać tekst finalnej odpowiedzi przez pola reasoning.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini po stronie dostawcy. Żądania Gemini 3 pomijają stały `thinkingLevel`, a żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują na najbliższy `thinkingLevel` Gemini albo budżet dla danej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce streamingu zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu albo parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko myślenie binarne (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślne ustawienie dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślne ustawienie globalne (`agents.defaults.thinkingDefault` w konfiguracji).
5. Wartość awaryjna: domyślna deklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele obsługujące reasoning rozstrzygają do `medium` albo najbliższego obsługiwanego poziomu innego niż `off` dla danego modelu, a modele bez reasoning pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (białe znaki są dozwolone), np. `/think:medium` lub `/t high`.
- Ustawienie pozostaje dla bieżącej sesji (domyślnie dla nadawcy); jest czyszczone przez `/think:off` albo reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie przez agenta

- **Wbudowany Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego w sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Inline / zawierające wyłącznie dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślne ustawienie dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Wartość awaryjna: `off`
- Dla `openai/*` tryb szybki mapuje na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła ten sam znacznik `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` zastępują domyślny tryb szybki, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla bazowych URL-i proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez UI Sesje, wybierając `inherit`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący strukturalne wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość zawierającą tylko metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane od razu po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty streamingu.
- Podsumowania awarii narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość to `full`, wyjścia narzędzi są również przekazywane po zakończeniu (osobny dymek, ucięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off`, gdy uruchomienie trwa, kolejne dymki narzędzi uwzględnią nowe ustawienie.
- `agents.defaults.toolProgressDetail` steruje kształtem podsumowań narzędzi `/verbose` i linii narzędzi w szkicu postępu. Użyj `"explain"` (domyślnie) dla zwięzłych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz też dołączyć surowe polecenie/szczegół do debugowania. `agents.list[].toolProgressDetail` dla agenta zastępuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Pluginu (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Pluginu w sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do Pluginu, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.

## Widoczność reasoning (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza to, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy włączone, reasoning jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): streamuje reasoning do dymka szkicu Telegram podczas generowania odpowiedzi, a następnie wysyła finalną odpowiedź bez reasoning.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom reasoning.
- Kolejność rozstrzygania: dyrektywa inline, następnie nadpisanie sesji, następnie domyślne ustawienie dla agenta (`agents.list[].reasoningDefault`), następnie wartość awaryjna (`off`).

Nieprawidłowe tagi reasoning modeli lokalnych są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte reasoning po już widocznym tekście również jest ukrywane. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty tag otwierający i w innym przypadku zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowy tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Tryb podwyższony](/pl/tools/elevated).

## Mechanizmy Heartbeat

- Treścią próby Heartbeat jest skonfigurowany prompt Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości Heartbeat działają jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji z Heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko finalny payload. Aby wysłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` albo dla agenta `agents.list[].heartbeat.includeReasoning: true`.

## UI czatu webowego

- Selektor myślenia w czacie webowym odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji oraz tej samej logiki awaryjnej, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwróconych przez wiersz/domyślne wartości sesji Gateway, a `thinkingOptions` jest zachowane jako starsza lista etykiet. UI przeglądarki nie utrzymuje własnej listy regexów dostawców; Pluginy są właścicielami zestawów poziomów specyficznych dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane przez model poziomy oraz wartość domyślną.
- Pluginy dostawców, które pośredniczą w dostępie do modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi pośredniczące pozostawały spójne.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędziowe, które muszą zweryfikować jawne nadpisanie rozumowania, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dla dostawcy/modelu.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby deklaracje opt-in `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają jako adaptery zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze i wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profilu, których używa walidacja w czasie działania.
