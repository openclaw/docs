---
read_when:
    - Dostosowywanie parsowania lub wartości domyślnych dyrektyw dotyczących myślenia, trybu szybkiego albo szczegółowości
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace i widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-30T16:31:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej przychodzącej treści: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „myśl”
  - low → „myśl intensywnie”
  - medium → „myśl intensywniej”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się na `xhigh`.
  - `highest` mapuje się na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilami dostawców. Plugin dostawcy deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są prezentowane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z listą prawidłowych opcji tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są ponownie mapowane według rangi profilu dostawcy. `adaptive` wraca do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` wracają do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się to na tę samą ścieżkę maksymalnego wysiłku zarządzaną przez dostawcę.
  - Modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują się na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż `off` mapują się na `high`.
  - Modele Ollama z obsługą myślenia udostępniają `/think low|medium|high|max`; `max` mapuje się na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku w modelowym Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, więc menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane referencje OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst finalnej odpowiedzi przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini zarządzane przez dostawcę. Żądania Gemini 3 pomijają stały `thinkingLevel`, a żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższy `thinkingLevel` lub budżet Gemini dla danej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub żądania. Zapobiega to wyciekowi delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Domyślne ustawienie per agent (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalne ustawienie domyślne (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślna wartość zadeklarowana przez dostawcę, jeśli jest dostępna; w przeciwnym razie modele zdolne do rozumowania rozstrzygają się na `medium` lub najbliższy obsługiwany poziom inny niż `off` dla danego modelu, a modele bez rozumowania pozostają na `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (spacje dozwolone), np. `/think:medium` lub `/t high`.
- Utrzymuje się to dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` lub reset po bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie jest odrzucane z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Wbudowany Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie trybu szybkiego w sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Inline/zawierające tylko dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślne ustawienie per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na przetwarzanie priorytetowe OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla bazowych adresów URL proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez UI Sesji, wybierając `inherit`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są ustawienia domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość zawierającą tylko metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty strumieniowe.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w normalnym trybie, ale sufiksy z surowymi szczegółami błędów są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość to `full`, wyniki narzędzi są także przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwania uruchomienia, kolejne dymki narzędzi uwzględnią nowe ustawienie.

## Dyrektywy śledzenia Plugin (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śledzenia Plugin w sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są ustawienia domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do Plugin, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako kolejna wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza to, czy bloki myślenia są pokazywane w odpowiedziach.
- Po włączeniu rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymka Telegram podczas generowania odpowiedzi, a następnie wysyła finalną odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa inline, następnie nadpisanie sesji, następnie domyślne ustawienie per agent (`agents.list[].reasoningDefault`), następnie fallback (`off`).

Nieprawidłowo sformatowane tagi rozumowania modeli lokalnych są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście także jest ukryte. Jeśli odpowiedź jest w pełni opakowana w pojedynczy niezamknięty tag otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowy tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Tryb podwyższony](/pl/tools/elevated).

## Heartbeats

- Treść sondy Heartbeat jest skonfigurowanym promptem heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości heartbeat stosują się jak zwykle (ale unikaj zmiany domyślnych ustawień sesji z heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko finalny ładunek. Aby wysłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## UI czatu webowego

- Selektor myślenia w czacie webowym odzwierciedla zapisany poziom sesji z przychodzącego magazynu sesji/konfiguracji podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji oraz tej samej logiki fallback, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwracanych przez wiersz sesji/defaulty gateway, z `thinkingOptions` zachowanym jako starsza lista etykiet. UI przeglądarki nie utrzymuje własnej listy regex dostawców; pluginy są właścicielami zestawów poziomów specyficznych dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane poziomy modelu i wartość domyślną.
- Pluginy dostawców, które pośredniczą w modelach Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi proxy pozostawały spójne.
- Każdy poziom profilu ma zapisywany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędziowe, które muszą walidować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawcy/modelu.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Plugin.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profili, których używa walidacja środowiska wykonawczego.
