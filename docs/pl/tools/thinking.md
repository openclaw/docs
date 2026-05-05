---
read_when:
    - Dostosowywanie parsowania lub wartości domyślnych dyrektyw thinking, fast-mode lub verbose
summary: Składnia dyrektyw /think, /fast, /verbose, /trace oraz widoczność rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-05-05T01:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa w treści dowolnej wiadomości przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (maksymalny budżet)
  - xhigh → “ultrathink+” (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane przez Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 i dynamiczne myślenie Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują na `xhigh`.
  - `highest` mapuje na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilami dostawców. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są prezentowane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane wraz z prawidłowymi opcjami dla danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` cofa się do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` cofają się do największego obsługiwanego poziomu innego niż off dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek jego API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują się na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż off mapują się na `high`.
  - Modele DeepSeek V4 kierowane przez OpenRouter udostępniają `/think xhigh` i wysyłają obsługiwane przez OpenRouter wartości `reasoning_effort`. Zapisane nadpisania `max` cofają się do `xhigh`.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` mapuje się na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodnego z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts`, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, dzięki czemu menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane odwołania OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst końcowej odpowiedzi przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini należące do dostawcy. Żądania Gemini 3 pomijają stały `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższy Gemini `thinkingLevel` lub budżet dla tej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowej zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko myślenie binarne (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa w treści wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawione przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślna wartość globalna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Rezerwa: domyślna wartość zadeklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele zdolne do rozumowania rozstrzygają do `medium` lub najbliższego obsługiwanego poziomu innego niż `off` dla tego modelu, a modele bez rozumowania pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (dozwolone białe znaki), np. `/think:medium` lub `/t high`.
- Ustawienie zostaje zachowane dla bieżącej sesji (domyślnie dla nadawcy); czyści je `/think:off` lub reset bezczynnej sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Wbudowane Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.
- **Backend Claude CLI**: poziomy inne niż off są przekazywane do Claude Code jako `--effort`, gdy używane jest `claude-cli`; zobacz [backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. W treści wiadomości / tylko dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Rezerwa: `off`
- Dla `openai/*` tryb szybki mapuje się na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla bazowych adresów URL proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowe (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowe logowanie sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez interfejs sesji, wybierając `inherit`.
- Dyrektywa w treści wiadomości dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są domyślne wartości sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość wyłącznie z metadanymi, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w trybie normalnym, ale sufiksy z surowymi szczegółami błędów są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość to `full`, dane wyjściowe narzędzi są także przekazywane po zakończeniu (osobny dymek, ucięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwania uruchomienia, kolejne dymki narzędzi będą respektować nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` i linii narzędzi w szkicu postępu. Użyj `"explain"` (domyślnie) dla zwięzłych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz także dołączyć surowe polecenie/szczegóły do debugowania. `agents.list[].toolProgressDetail` dla agenta nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śladu Pluginów (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śladu Pluginów w sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa w treści wiadomości dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są domyślne wartości sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śladu.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do Pluginów linie śladu/debugowania, takie jak podsumowania debugowania Active Memory.
- Linie śladu mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Po włączeniu rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do dymku szkicu Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa w treści wiadomości, następnie nadpisanie sesji, następnie domyślna wartość dla agenta (`agents.list[].reasoningDefault`), następnie rezerwa (`off`).

Zniekształcone tagi rozumowania modeli lokalnych są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście jest również ukryte. Jeśli odpowiedź jest w całości opakowana pojedynczym niezamkniętym tagiem otwierającym i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa zniekształcony tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [trybie podwyższonym](/pl/tools/elevated).

## Heartbeat

- Treść sondy Heartbeat to skonfigurowany prompt Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy w treści wiadomości Heartbeat stosują się jak zwykle (ale unikaj zmieniania domyślnych wartości sesji z poziomu Heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` albo dla agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu webowego

- Selektor myślenia w czacie webowym odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej, gdy strona się ładuje.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwszą opcją jest zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji oraz tej samej logiki rezerwowej, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwracanych przez wiersz sesji Gateway / wartości domyślne, a `thinkingOptions` pozostaje jako starsza lista etykiet. Interfejs przeglądarki nie utrzymuje własnej listy regexów dostawców; Pluginy posiadają zestawy poziomów specyficzne dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy modelu i wartość domyślną.
- Pluginy dostawców, które pośredniczą dla modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi proxy pozostawały zgodne.
- Każdy poziom profilu ma przechowywany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` albo `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędzi, które muszą zweryfikować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawcy/modelu.
- Pluginy narzędzi z dostępem do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory profili i etykiety, których używa walidacja w czasie działania.
