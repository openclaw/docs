---
read_when:
    - Dostosowywanie parsowania lub wartości domyślnych dyrektyw thinking, fast-mode albo verbose
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczność rozumowania
title: Poziomy rozumowania
x-i18n:
    generated_at: "2026-05-10T19:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa wbudowana w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maksymalny budżet)
  - xhigh → "ultrathink+" (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne wnioskowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują na `xhigh`.
  - `highest` mapuje na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilem dostawcy. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są pokazywane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z prawidłowymi opcjami tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` cofa się do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` cofają się do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek jego API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku zarządzaną przez dostawcę.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż `off` mapują na `high`.
  - Modele DeepSeek V4 routowane przez OpenRouter udostępniają `/think xhigh` i wysyłają obsługiwane przez OpenRouter wartości `reasoning_effort`. Zapisane nadpisania `max` cofają się do `xhigh`.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` mapuje na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek wnioskowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts`, tak aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku wnioskowania OpenAI, więc menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane referencje OpenRouter Hunter Alpha pomijają wstrzykiwanie wnioskowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst końcowej odpowiedzi przez pola wnioskowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini zarządzane przez dostawcę. Żądania Gemini 3 pomijają stałe `thinkingLevel`, a żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższe `thinkingLevel` lub budżet Gemini dla tej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic używanego przez MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa wbudowana w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawione przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślne ustawienie dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślne ustawienie globalne (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślne ustawienie zadeklarowane przez dostawcę, gdy jest dostępne; w przeciwnym razie modele zdolne do wnioskowania rozstrzygają do `medium` lub najbliższego obsługiwanego poziomu innego niż `off` dla tego modelu, a modele bez wnioskowania pozostają przy `off`.

## Ustawianie domyślnego ustawienia sesji

- Wyślij wiadomość zawierającą **tylko** dyrektywę (spacje są dozwolone), np. `/think:medium` lub `/t high`.
- Ustawienie pozostaje dla bieżącej sesji (domyślnie dla nadawcy). Użyj `/think default`, aby wyczyścić nadpisanie sesji i odziedziczyć domyślne ustawienie z konfiguracji/dostawcy; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- `/think off` zapisuje jawne nadpisanie wyłączenia. Wyłącza myślenie, dopóki nie zmienisz lub nie wyczyścisz nadpisania sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Wbudowany Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.
- **Backend Claude CLI**: poziomy inne niż off są przekazywane do Claude Code jako `--effort`, gdy używany jest `claude-cli`; zobacz [backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `on|off|default`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`. Użyj `/fast default`, aby wyczyścić nadpisanie sesji i odziedziczyć skonfigurowane ustawienie domyślne; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Nadpisanie wbudowane/zawierające tylko dyrektywę `/fast on|off` (`/fast default` czyści tę warstwę)
  2. Nadpisanie sesji
  3. Domyślne ustawienie dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na warstwy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślne ustawienie trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie warstwy usług Anthropic dla bazowych adresów URL proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie sesji, wybierając `inherit`.
- Dyrektywa wbudowana dotyczy tylko tej wiadomości; w pozostałych przypadkach obowiązują domyślne ustawienia sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość tylko z metadanymi, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty strumieniowania.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w normalnym trybie, ale surowe sufiksy szczegółów błędu są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość to `full`, wyniki narzędzi są także przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwającego uruchomienia, kolejne dymki narzędzi zastosują nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` oraz werszy narzędzi w szkicu postępu. Użyj `"explain"` (domyślnie) dla zwięzłych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz także dołączyć surowe polecenie/szczegóły do debugowania. `agents.list[].toolProgressDetail` dla agenta nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Pluginów (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia Pluginu sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa wbudowana dotyczy tylko tej wiadomości; w pozostałych przypadkach obowiązują domyślne ustawienia sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` ma węższy zakres niż `/verbose`: ujawnia tylko należące do Pluginu wiersze śledzenia/debugowania, takie jak podsumowania debugowania Active Memory.
- Wiersze śledzenia mogą pojawiać się w `/status` oraz jako kolejna wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność wnioskowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza to, czy bloki myślenia są pokazywane w odpowiedziach.
- Po włączeniu wnioskowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje wnioskowanie do roboczego dymku Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez wnioskowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom wnioskowania.
- Kolejność rozstrzygania: dyrektywa wbudowana, następnie nadpisanie sesji, następnie domyślne ustawienie dla agenta (`agents.list[].reasoningDefault`), następnie domyślne ustawienie globalne (`agents.defaults.reasoningDefault`), następnie fallback (`off`).

Zniekształcone tagi wnioskowania modelu lokalnego są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte wnioskowanie po już widocznym tekście także jest ukrywane. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty tag otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa zniekształcony tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [trybie podwyższonym](/pl/tools/elevated).

## Heartbeat

- Treść sondy Heartbeat to skonfigurowany monit Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy wbudowane w wiadomości Heartbeat działają jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji z Heartbeatów).
- Dostarczanie Heartbeat domyślnie ogranicza się do końcowego ładunku. Aby wysłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` albo dla agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu WWW

- Selektor myślenia w czacie webowym odzwierciedla zapisany poziom sesji z przychodzącego magazynu/konfiguracji sesji podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja jest zawsze wyborem czyszczącym nadpisanie. Pokazuje `Inherited: <resolved level>`, gdy sesja dziedziczy niezerową efektywną wartość domyślną, albo `Off`, gdy dziedziczone myślenie jest wyłączone.
- Jawne wybory w selektorze są oznaczane jako nadpisania, przy zachowaniu etykiet dostawcy, jeśli są obecne (na przykład `Override: maximum` dla opcji `max` oznaczonej przez dostawcę).
- Selektor używa `thinkingLevels` zwróconych przez wiersz sesji/wartości domyślne Gateway, a `thinkingOptions` pozostają starszą listą etykiet. Interfejs przeglądarkowy nie utrzymuje własnej listy wyrażeń regularnych dostawców; Pluginy są właścicielami zestawów poziomów specyficznych dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy i wartość domyślną modelu.
- Pluginy dostawców, które pośredniczą dla modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi pośredniczące pozostały spójne.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` albo `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędzi, które muszą walidować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędzi mające dostęp do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profili, których używa walidacja w czasie działania.
