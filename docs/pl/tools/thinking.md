---
read_when:
    - Dostosowywanie parsowania dyrektyw thinking, fast-mode lub verbose albo ich wartości domyślnych
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczność rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-30T10:24:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej przychodzącej treści: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex, plus wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne wnioskowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` są mapowane na `xhigh`.
  - `highest` jest mapowane na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilem dostawcy. Plugin dostawcy deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są reklamowane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z prawidłowymi opcjami dla tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są ponownie mapowane według rangi profilu dostawcy. `adaptive` wraca do `medium` w modelach nieadaptacyjnych, a `xhigh` i `max` wracają do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek jego API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` mapuje się na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek wnioskowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts`, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku wnioskowania OpenAI, dzięki czemu menu, walidacja sesji, agent CLI i `llm-task` zgadzają się z zachowaniem transportu.
  - Nieaktualne skonfigurowane referencje OpenRouter Hunter Alpha pomijają wstrzykiwanie wnioskowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst końcowej odpowiedzi przez pola wnioskowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie należące do dostawcy Gemini. Żądania Gemini 3 pomijają stały `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższy Gemini `thinkingLevel` lub budżet dla danej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślna wartość globalna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślna wartość zadeklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele zdolne do wnioskowania rozstrzygają do `medium` albo najbliższego obsługiwanego poziomu innego niż `off` dla tego modelu, a modele bez wnioskowania pozostają `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która jest **tylko** dyrektywą (białe znaki są dozwolone), np. `/think:medium` lub `/t high`.
- To ustawienie zostaje w bieżącej sesji (domyślnie dla nadawcy); jest czyszczone przez `/think:off` lub reset po bezczynności sesji.
- Wysyłana jest odpowiedź z potwierdzeniem (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie jest odrzucane z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Osadzony Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska wykonawczego agenta Pi.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza sesyjne nadpisanie trybu szybkiego i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Inline/tylko dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje się na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Responses Codex. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla bazowych adresów URL proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez interfejs Sessions, wybierając `inherit`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w przeciwnym razie obowiązują domyślne wartości sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość wyłącznie z metadanymi, z prefiksem `<emoji> <tool-name>: <arg>`, gdy jest dostępny (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), nie jako delty strumieniowania.
- Podsumowania awarii narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędów są ukryte, chyba że szczegółowość to `on` lub `full`.
- Gdy szczegółowość to `full`, dane wyjściowe narzędzi są także przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwającego uruchomienia, kolejne dymki narzędzi będą respektować nowe ustawienie.

## Dyrektywy śledzenia Plugin (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Plugin w sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w przeciwnym razie obowiązują domyślne wartości sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do Plugin wiersze śledzenia/debugowania, takie jak podsumowania debugowania Active Memory.
- Wiersze śledzenia mogą pojawiać się w `/status` oraz jako uzupełniająca wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność wnioskowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Po włączeniu wnioskowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje wnioskowanie do dymku szkicu Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez wnioskowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom wnioskowania.
- Kolejność rozstrzygania: dyrektywa inline, następnie nadpisanie sesji, następnie domyślna wartość dla agenta (`agents.list[].reasoningDefault`), następnie fallback (`off`).

Nieprawidłowo sformatowane tagi wnioskowania modeli lokalnych są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte wnioskowanie po już widocznym tekście także jest ukryte. Jeśli odpowiedź jest w pełni owinięta pojedynczym niezamkniętym tagiem otwierającym i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowo sformatowany tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Tryb podwyższony](/pl/tools/elevated).

## Heartbeats

- Treścią sondy Heartbeat jest skonfigurowany monit Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości Heartbeat obowiązują jak zwykle (ale unikaj zmieniania domyślnych wartości sesji z Heartbeat).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub dla agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu WWW

- Selektor myślenia w czacie WWW odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwszą opcją zawsze jest `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji oraz tej samej logiki fallback, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwracanych przez wiersz sesji/domyślne wartości Gateway, z `thinkingOptions` zachowanym jako starsza lista etykiet. Interfejs przeglądarkowy nie przechowuje własnej listy wyrażeń regularnych dostawców; Plugin są właścicielami zestawów poziomów specyficznych dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, dzięki czemu dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane przez model poziomy i wartość domyślną.
- Pluginy dostawców, które pośredniczą dla modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi proxy pozostawały spójne.
- Każdy poziom profilu ma przechowywany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędzi, które muszą zweryfikować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędzi z dostępem do skonfigurowanych niestandardowych metadanych modelu mogą przekazać `catalog` do `resolveThinkingPolicy`, aby opcje włączenia `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory profili i etykiety, których używa walidacja w czasie wykonywania.
