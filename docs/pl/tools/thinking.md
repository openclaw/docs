---
read_when:
    - Dostosowywanie analizowania lub wartości domyślnych dyrektyw myślenia, trybu szybkiego lub verbose
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace i widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-21T10:02:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Poziomy myślenia (/think dyrektywy)

## Co to robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (GPT-5.2 + modele Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → zarządzane przez dostawcę myślenie adaptacyjne (obsługiwane dla Claude 4.6 na Anthropic/Bedrock oraz Anthropic Claude Opus 4.7)
  - max → maksymalne rozumowanie dostawcy (obecnie Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się do `xhigh`.
  - `highest` mapuje się do `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilami dostawców. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z poprawnymi opcjami dla tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy, w tym stare wartości `max` po przełączeniu modelu, są mapowane ponownie do najwyższego obsługiwanego poziomu dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnie poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie domyślnie nie używa myślenia adaptacyjnego. Domyślny wysiłek jego API pozostaje zarządzany przez dostawcę, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na myślenie adaptacyjne plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` to ustawienie wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku zarządzaną przez dostawcę.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek reasoning zamiast wysyłać nieobsługiwaną wartość.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Pozwala to uniknąć wyciekających delt `reasoning_content` z nienatywnego formatu strumienia Anthropic MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany do `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozwiązywania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Domyślna wartość per agent (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Zapasowo: wartość domyślna zadeklarowana przez dostawcę, gdy jest dostępna, `low` dla innych modeli katalogowych oznaczonych jako zdolne do rozumowania, w przeciwnym razie `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która jest **tylko** dyrektywą (dozwolone są białe znaki), np. `/think:medium` lub `/t high`.
- To utrzymuje się dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie jest odrzucane ze wskazówką, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie przez agenta

- **Osadzony Pi**: rozpoznany poziom jest przekazywany do runtime agenta Pi działającego w procesie.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozwiązuje tryb szybki w tej kolejności:
  1. Inline/tylko-dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Zapasowo: `off`
- Dla `openai/*` tryb szybki mapuje się na przetwarzanie priorytetowe OpenAI przez wysyłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnianego OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na warstwy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` mają pierwszeństwo przed domyślnym trybem szybkim, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie warstwy usług Anthropic dla bazowych URL proxy innych niż Anthropic.

## Dyrektywy verbose (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza verbose sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają wskazówkę bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez Sessions UI, wybierając `inherit`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne wartości sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom verbose.
- Gdy verbose jest włączone, agenci emitujący uporządkowane wyniki narzędzi (Pi, inni agenci JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość tylko z metadanymi, z prefiksem `<emoji> <tool-name>: <arg>`, jeśli jest dostępny (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane od razu po starcie każdego narzędzia (osobne bąbelki), a nie jako delty strumieniowania.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że verbose ma wartość `on` lub `full`.
- Gdy verbose ma wartość `full`, wyjścia narzędzi są także przekazywane po zakończeniu (osobny bąbelek, obcięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` w trakcie uruchomienia, kolejne bąbelki narzędzi uwzględnią nowe ustawienie.

## Dyrektywy śledzenia pluginów (/trace)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia pluginów dla sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne wartości sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debug należące do pluginu, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy jest włączone, rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do bąbelka wersji roboczej Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozwiązywania: dyrektywa inline, potem nadpisanie sesji, potem domyślna wartość per agent (`agents.list[].reasoningDefault`), a następnie wartość zapasowa (`off`).

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Tryb podwyższony](/pl/tools/elevated).

## Heartbeats

- Treść sondy Heartbeat to skonfigurowany prompt Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości Heartbeat są stosowane normalnie (ale unikaj zmiany domyślnych wartości sesji z Heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## Web chat UI

- Selektor myślenia w web chat odzwierciedla zapisany poziom sesji z magazynu/configu sesji wejściowej podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozpoznana wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji.
- Selektor używa `thinkingOptions` zwracanych przez wiersz sesji Gateway. Interfejs przeglądarkowy nie utrzymuje własnej listy regex dostawców; pluginy zarządzają zestawami poziomów specyficznymi dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane poziomy modelu i wartość domyślną.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają jako adaptery zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze Gateway udostępniają `thinkingOptions` i `thinkingDefault`, aby klienci ACP/chat renderowali ten sam profil, którego używa walidacja runtime.
