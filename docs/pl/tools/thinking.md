---
read_when:
    - Dostosowywanie analizowania dyrektyw myślenia, trybu szybkiego lub trybu szczegółowego albo wartości domyślnych
summary: Składnia dyrektyw dla `/think`, `/fast`, `/verbose`, `/trace` oraz widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-21T19:21:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Poziomy myślenia (dyrektywy `/think`)

## Co to robi

- Dyrektywa w treści dowolnej wiadomości przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (wysiłek GPT-5.2 + modeli Codex oraz Anthropic Claude Opus 4.7)
  - adaptive → zarządzane przez dostawcę myślenie adaptacyjne (obsługiwane dla Claude 4.6 w Anthropic/Bedrock oraz Anthropic Claude Opus 4.7)
  - max → maksymalne rozumowanie dostawcy (obecnie Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` oraz `extra_high` są mapowane na `xhigh`.
  - `highest` jest mapowane na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane przez profile dostawców. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są reklamowane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane wraz z poprawnymi opcjami dla tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` przechodzi awaryjnie na `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` przechodzą awaryjnie na najwyższy obsługiwany poziom inny niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnie poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie ma domyślnie włączonego myślenia adaptacyjnego. Domyślna wartość wysiłku API pozostaje po stronie dostawcy, dopóki jawnie nie ustawisz poziomu myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na myślenie adaptacyjne plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` to ustawienie wysiłku w Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; jest ono mapowane na tę samą ścieżkę maksymalnego wysiłku po stronie dostawcy.
  - Modele OpenAI GPT mapują `/think` przez specyficzną dla modelu obsługę wysiłku API Responses. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija ładunek wyłączonego rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic używanego przez MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa w treści wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Wartość domyślna dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Zapasowo: domyślna wartość zadeklarowana przez dostawcę, gdy jest dostępna, `low` dla innych modeli katalogowych oznaczonych jako zdolne do rozumowania, w przeciwnym razie `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **wyłącznie** dyrektywę (dozwolone są białe znaki), np. `/think:medium` lub `/t high`.
- To ustawienie utrzymuje się dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Osadzony Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego w sesji i zwraca odpowiedź `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w następującej kolejności:
  1. Dyrektywa w treści/wiadomość zawierająca tylko dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Wartość domyślna dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Zapasowo: `off`
- Dla `openai/*` tryb szybki jest mapowany na przetwarzanie priorytetowe OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek auth.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki jest mapowany na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` zastępują domyślne ustawienie trybu szybkiego, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla bazowych adresów URL proxy innych niż Anthropic.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza szczegółowość sesji i zwraca odpowiedź `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie Sessions, wybierając `inherit`.
- Dyrektywa w treści dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są wartości domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący uporządkowane wyniki narzędzi (Pi, inne agenty JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość zawierającą tylko metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy to możliwe (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po rozpoczęciu każdego narzędzia (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że szczegółowość ma wartość `on` lub `full`.
- Gdy szczegółowość ma wartość `full`, wyniki narzędzi są także przekazywane po zakończeniu (osobny dymek, obcięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off`, gdy uruchomienie jest w toku, kolejne dymki narzędzi uwzględnią nowe ustawienie.

## Dyrektywy śledzenia Pluginów (/trace)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia pluginów w sesji i zwraca odpowiedź `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa w treści dotyczy tylko tej wiadomości; w pozostałych przypadkach stosowane są wartości domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do pluginów, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy jest włączona, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona prefiksem `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymka Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa w treści, potem nadpisanie sesji, potem wartość domyślna dla agenta (`agents.list[].reasoningDefault`), a potem wartość zapasowa (`off`).

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Elevated mode](/pl/tools/elevated).

## Heartbeat

- Treść próby Heartbeat to skonfigurowany prompt heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy w treści wiadomości heartbeat są stosowane jak zwykle (ale unikaj zmiany ustawień domyślnych sesji przez heartbeat).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać również osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu webowego

- Selektor myślenia w webowym interfejsie czatu odzwierciedla poziom zapisany dla sesji z magazynu sesji przychodzących/konfiguracji podczas ładowania strony.
- Wybranie innego poziomu zapisuje nadpisanie sesji natychmiast przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy dla aktywnego modelu sesji.
- Selektor używa `thinkingOptions` zwracanego przez wiersz sesji Gateway. Interfejs przeglądarkowy nie utrzymuje własnej listy regexów dostawców; pluginy są właścicielami specyficznych dla modelu zestawów poziomów.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy i wartość domyślną modelu.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` oraz `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze Gateway udostępniają `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali ten sam profil, którego używa walidacja w środowisku uruchomieniowym.
