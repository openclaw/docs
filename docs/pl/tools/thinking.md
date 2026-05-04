---
read_when:
    - Dostosowywanie parsowania dyrektyw myślenia, trybu szybkiego lub szczegółowości albo ich wartości domyślnych
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczność rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-05-04T18:24:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa w treści dowolnej wiadomości przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex oraz poziom wysiłku Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny poziom wysiłku `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się na `xhigh`.
  - `highest` mapuje się na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilami dostawców. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są wyświetlane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z listą prawidłowych opcji danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są ponownie mapowane według rangi profilu dostawcy. `adaptive` wraca do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` wracają do największego obsługiwanego poziomu innego niż off dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny poziom wysiłku jego API pozostaje po stronie dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują się na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż off mapują się na `high`.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` mapuje się na natywne `think: "high"`, ponieważ natywne API Ollama przyjmuje ciągi poziomu wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę poziomu wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, dzięki czemu menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane odwołania OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst odpowiedzi końcowej przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini należące do dostawcy. Żądania Gemini 3 pomijają stałe `thinkingLevel`, a żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższy Gemini `thinkingLevel` lub budżet dla tej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko myślenie binarne (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa w treści wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślna wartość zadeklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele obsługujące rozumowanie rozstrzygają się do `medium` lub najbliższego obsługiwanego poziomu innego niż `off` dla danego modelu, a modele bez rozumowania pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (spacje są dozwolone), np. `/think:medium` lub `/t high`.
- To ustawienie pozostaje dla bieżącej sesji (domyślnie na nadawcę); jest czyszczone przez `/think:off` lub reset bezczynnej sesji.
- Wysyłane jest potwierdzenie (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie jest odrzucane z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie przez agenta

- **Wbudowany Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska wykonawczego agenta Pi.
- **Backend Claude CLI**: poziomy inne niż off są przekazywane do Claude Code jako `--effort` podczas używania `claude-cli`; zobacz [backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. W treści wiadomości / tylko dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła ten sam znacznik `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla bazowych adresów URL proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie Sessions UI, wybierając `inherit`.
- Dyrektywa w treści wiadomości dotyczy tylko tej wiadomości; w pozostałych przypadkach mają zastosowanie wartości domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość tylko z metadanymi, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako strumieniowane delty.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędów są ukryte, chyba że szczegółowość jest ustawiona na `on` lub `full`.
- Gdy szczegółowość jest ustawiona na `full`, wyjścia narzędzi są także przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwania wykonania, kolejne dymki narzędzi respektują nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` i roboczych linii postępu narzędzi. Użyj `"explain"` (domyślnie) dla zwięzłych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz także dołączyć surowe polecenie/szczegół do debugowania. `agents.list[].toolProgressDetail` dla agenta nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Pluginu (/trace)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Pluginu sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa w treści wiadomości dotyczy tylko tej wiadomości; w pozostałych przypadkach mają zastosowanie wartości domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do Pluginu, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako kolejna wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy jest włączone, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymka Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa w treści wiadomości, potem nadpisanie sesji, potem domyślna wartość dla agenta (`agents.list[].reasoningDefault`), potem fallback (`off`).

Zniekształcone tagi rozumowania modeli lokalnych są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście także jest ukrywane. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty tag otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa zniekształcony tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [trybie podwyższonym](/pl/tools/elevated).

## Heartbeaty

- Treść sondy Heartbeat to skonfigurowany monit Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy w treści wiadomości Heartbeat działają jak zwykle (ale unikaj zmieniania domyślnych wartości sesji z Heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub dla agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu WWW

- Selektor myślenia w czacie WWW odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej po załadowaniu strony.
- Wybranie innego poziomu zapisuje nadpisanie sesji natychmiast przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwszą opcją jest zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji oraz tej samej logiki fallback, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwróconych przez wiersz sesji Gateway / wartości domyślne, a `thinkingOptions` pozostaje starszą listą etykiet. Interfejs przeglądarki nie utrzymuje własnej listy wyrażeń regularnych dostawców; Pluginy są właścicielami zestawów poziomów specyficznych dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy modelu i poziom domyślny.
- Pluginy dostawców, które pośredniczą dla modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi proxy pozostawały spójne.
- Każdy poziom profilu ma przechowywany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędziowe, które muszą zweryfikować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody przez `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Pluginu.
- Opublikowane starsze haki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profilu, których używa walidacja w czasie działania.
