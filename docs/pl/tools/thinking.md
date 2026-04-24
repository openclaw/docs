---
read_when:
    - Dostosowywanie parsowania lub ustawień domyślnych dyrektyw rozumowania, trybu szybkiego albo trybu verbose
summary: Składnia dyrektyw dla `/think`, `/fast`, `/verbose`, `/trace` oraz widoczności rozumowania
title: Poziomy rozumowania
x-i18n:
    generated_at: "2026-04-24T09:38:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc251ffa601646bf8672200b416661ae91fb21ff84525eedf6d6c538ff0e36cf
    source_path: tools/thinking.md
    workflow: 15
---

## Co to robi

- Dyrektywa inline w dowolnym przychodzącym body: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex oraz effort Anthropic Claude Opus 4.7)
  - adaptive → zarządzane przez providera myślenie adaptacyjne (obsługiwane dla Claude 4.6 na Anthropic/Bedrock oraz Anthropic Claude Opus 4.7)
  - max → maksymalne rozumowanie providera (obecnie Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się na `xhigh`.
  - `highest` mapuje się na `high`.
- Uwagi dotyczące providerów:
  - Menu i selektory rozumowania są sterowane przez profile providerów. Pluginy providerów deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są reklamowane tylko dla profili provider/model, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z podaniem prawidłowych opcji dla tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są remapowane według rangi profilu providera. `adaptive` przechodzi awaryjnie na `medium` w modelach bez trybu adaptacyjnego, a `xhigh` i `max` przechodzą awaryjnie na najwyższy obsługiwany poziom różny od `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnie poziomu rozumowania.
  - Anthropic Claude Opus 4.7 nie używa domyślnie myślenia adaptacyjnego. Domyślny effort API pozostaje własnością providera, chyba że jawnie ustawisz poziom rozumowania.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na myślenie adaptacyjne plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą rozumowania, a `xhigh` jest ustawieniem effort w Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia też `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego effort zarządzaną przez providera.
  - Modele OpenAI GPT mapują `/think` przez obsługę effort specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy docelowy model to obsługuje; w przeciwnym razie OpenClaw pomija payload wyłączonego rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - MiniMax (`minimax/*`) na ścieżce streamingu zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz rozumowanie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu streamu Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne rozumowanie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy rozumowanie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozwiązywania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Domyślne ustawienie per agent (`agents.list[].thinkingDefault` w config).
4. Globalne ustawienie domyślne (`agents.defaults.thinkingDefault` w config).
5. Fallback: domyślne ustawienie zadeklarowane przez providera, jeśli jest dostępne; w przeciwnym razie modele obsługujące rozumowanie przechodzą na `medium` lub najbliższy obsługiwany poziom różny od `off` dla danego modelu, a modele bez rozumowania pozostają na `off`.

## Ustawianie domyślnego poziomu dla sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (dozwolone są spacje), np. `/think:medium` lub `/t high`.
- To ustawienie pozostaje dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.

## Zastosowanie per agent

- **Embedded Pi**: rozwiązany poziom jest przekazywany do runtime agenta Pi działającego w procesie.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i zwraca `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozwiązuje tryb szybki w tej kolejności:
  1. Inline/wiadomość zawierająca tylko dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślne ustawienie per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na przetwarzanie priorytetowe OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jedno współdzielone przełączenie `/fast` dla obu ścieżek auth.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnianego OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślne ustawienie trybu szybkiego, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla nieanthropicowych proxy `baseUrl`.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy verbose (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza verbose sesji i zwraca `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez UI Sessions, wybierając `inherit`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie stosowane są ustawienia domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom verbose.
- Gdy verbose jest włączone, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inne agenty JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość tylko z metadanymi, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po rozpoczęciu każdego narzędzia (osobne dymki), a nie jako delty streamingu.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że verbose ma wartość `on` lub `full`.
- Gdy verbose ma wartość `full`, wyniki narzędzi są również przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` w trakcie trwania przebiegu, kolejne dymki narzędzi uwzględnią nowe ustawienie.

## Dyrektywy śledzenia Pluginów (/trace)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia Pluginów dla sesji i zwraca `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie stosowane są ustawienia domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie trace/debug należące do Pluginów, takie jak podsumowania debug Active Memory.
- Linie trace mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki rozumowania są pokazywane w odpowiedziach.
- Gdy opcja jest włączona, rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): streamuje rozumowanie do roboczego dymka Telegrama podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozwiązywania: dyrektywa inline, następnie nadpisanie sesji, następnie ustawienie domyślne per agent (`agents.list[].reasoningDefault`), a potem fallback (`off`).

## Powiązane

- Dokumentacja trybu elevated znajduje się w [Elevated mode](/pl/tools/elevated).

## Heartbeaty

- Treść sondy Heartbeat to skonfigurowany prompt heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości heartbeat działają jak zwykle (ale unikaj zmiany ustawień domyślnych sesji z heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy payload. Aby wysyłać również osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs web chat

- Selektor rozumowania w web chat odzwierciedla zapisany poziom sesji z przychodzącego magazynu sesji/config podczas ładowania strony.
- Wybranie innego poziomu zapisuje nadpisanie sesji natychmiast przez `sessions.patch`; nie czeka na kolejne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozwiązana wartość domyślna pochodzi z profilu rozumowania providera dla aktywnego modelu sesji oraz tej samej logiki fallback, której używają `/status` i `session_status`.
- Selektor używa `thinkingOptions` zwracanych przez wiersz sesji gateway. UI przeglądarkowe nie utrzymuje własnej listy regex providerów; zbiory poziomów specyficznych dla modeli należą do Pluginów.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile providerów

- Pluginy providerów mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane poziomy modelu i wartość domyślną.
- Każdy poziom profilu ma zapisywany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Providerzy binarni używają `{ id: "low", label: "on" }`.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze Gateway udostępniają `thinkingOptions` i `thinkingDefault`, aby klienci ACP/chat renderowali ten sam profil, którego używa walidacja runtime.
