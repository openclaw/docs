---
read_when:
    - Dostosowywanie myślenia, trybu szybkiego lub szczegółowego parsowania dyrektyw albo wartości domyślnych
summary: Składnia dyrektyw /think, /fast, /verbose, /trace oraz widoczność rozumowania
title: Poziomy rozumowania
x-i18n:
    generated_at: "2026-05-07T13:26:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „myśl”
  - low → „myśl intensywnie”
  - medium → „myśl intensywniej”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się na `xhigh`.
  - `highest` mapuje się na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilem dostawcy. Provider plugins deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane wraz z prawidłowymi opcjami dla tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` wraca do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` wracają do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek jego API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ona na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują się na DeepSeek `reasoning_effort: "max"`, podczas gdy niższe poziomy inne niż `off` mapują się na `high`.
  - Modele DeepSeek V4 kierowane przez OpenRouter udostępniają `/think xhigh` i wysyłają obsługiwane przez OpenRouter wartości `reasoning_effort`. Zapisane nadpisania `max` wracają do `xhigh`.
  - Modele Ollama zdolne do myślenia udostępniają `/think low|medium|high|max`; `max` mapuje się na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, więc menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane odwołania OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst odpowiedzi końcowej przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini należące do dostawcy. Żądania Gemini 3 pomijają stałe `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższe Gemini `thinkingLevel` lub budżet dla tej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic używanego przez MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślna wartość globalna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Wartość awaryjna: domyślna deklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele zdolne do rozumowania rozstrzygają się na `medium` lub najbliższy obsługiwany poziom inny niż `off` dla tego modelu, a modele bez rozumowania pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (białe znaki są dozwolone), np. `/think:medium` lub `/t high`.
- To ustawienie obowiązuje w bieżącej sesji (domyślnie dla nadawcy); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Wbudowany Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska wykonawczego agenta Pi.
- **Backend CLI Claude**: poziomy inne niż off są przekazywane do Claude Code jako `--effort` podczas używania `claude-cli`; zobacz [backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Inline/tylko dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Wartość awaryjna: `off`
- Dla `openai/*` tryb szybki mapuje się na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla adresów bazowych proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowe (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie Sessions UI, wybierając `inherit`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie mają zastosowanie wartości domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy tryb szczegółowy jest włączony, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia jako osobną wiadomość tylko z metadanymi, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po rozpoczęciu każdego narzędzia (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędów są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość to `full`, dane wyjściowe narzędzi są także przekazywane po zakończeniu (osobny dymek, skrócony do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off`, gdy uruchomienie jest w toku, kolejne dymki narzędzi będą respektować nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` oraz linii narzędzi w roboczej wersji postępu. Użyj `"explain"` (domyślnie) dla kompaktowych etykiet czytelnych dla ludzi, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz również dołączyć surowe polecenie/szczegóły do debugowania. `agents.list[].toolProgressDetail` dla agenta nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Plugin (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia Plugin sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie mają zastosowanie wartości domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do Plugin linie śledzenia/debugowania, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy włączone, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do dymku roboczego Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa inline, potem nadpisanie sesji, potem domyślna wartość dla agenta (`agents.list[].reasoningDefault`), potem wartość awaryjna (`off`).

Zniekształcone znaczniki rozumowania modelu lokalnego są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście także jest ukrywane. Jeśli odpowiedź jest w całości opakowana pojedynczym niezamkniętym znacznikiem otwierającym i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa zniekształcony znacznik otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [trybie podwyższonym](/pl/tools/elevated).

## Heartbeats

- Treść sondy Heartbeat to skonfigurowany monit Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości Heartbeat mają zastosowanie jak zwykle (ale unikaj zmieniania domyślnych wartości sesji z Heartbeats).
- Dostarczanie Heartbeat domyślnie ogranicza się tylko do końcowego ładunku. Aby wysłać również osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub dla agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu web

- Selektor rozumowania w czacie webowym odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja zawsze służy do wyczyszczenia nadpisania. Pokazuje `Dziedziczone: <resolved level>`, gdy sesja dziedziczy niezerową efektywną wartość domyślną, albo `Wyłączone`, gdy dziedziczone rozumowanie jest wyłączone.
- Jawne wybory w selektorze są oznaczone jako nadpisania, przy zachowaniu etykiet dostawcy, gdy są obecne (na przykład `Nadpisanie: maximum` dla opcji `max` oznaczonej etykietą dostawcy).
- Selektor używa `thinkingLevels` zwracanych przez wiersz/domyślne wartości sesji Gateway, przy czym `thinkingOptions` pozostaje starszą listą etykiet. Interfejs przeglądarkowy nie utrzymuje własnej listy wyrażeń regularnych dostawców; pluginy odpowiadają za zestawy poziomów specyficzne dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy modelu i wartość domyślną.
- Pluginy dostawców, które pośredniczą dla modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi proxy pozostały zgodne.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` albo `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędziowe, które muszą sprawdzać jawne nadpisanie rozumowania, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych niestandardowych modeli mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody przez `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/domyślne wartości Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory profili i etykiety, których używa walidacja w czasie wykonania.
