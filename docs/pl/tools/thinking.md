---
read_when:
    - Dostosowywanie parsowania dyrektyw thinking, fast-mode lub verbose albo ich wartości domyślnych
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-05-06T09:34:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej przychodzącej treści: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maksymalny budżet)
  - xhigh → "ultrathink+" (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7 oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują na `xhigh`.
  - `highest` mapuje na `high`.
- Uwagi o dostawcach:
  - Menu i selektory myślenia są sterowane profilem dostawcy. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są reklamowane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane wraz z prawidłowymi opcjami tego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są mapowane ponownie według rangi profilu dostawcy. `adaptive` cofa się do `medium` w modelach nieadaptacyjnych, natomiast `xhigh` i `max` cofają się do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek API pozostaje własnością dostawcy, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus 4.7.
  - Anthropic Claude Opus 4.7 udostępnia także `/think max`; mapuje się ona na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż `off` mapują na `high`.
  - Modele DeepSeek V4 routowane przez OpenRouter udostępniają `/think xhigh` i wysyłają obsługiwane przez OpenRouter wartości `reasoning_effort`. Zapisane nadpisania `max` cofają się do `xhigh`.
  - Modele Ollama z obsługą myślenia udostępniają `/think low|medium|high|max`; `max` mapuje na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, dzięki czemu menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane referencje OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst finalnej odpowiedzi przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie należące do dostawcy Gemini. Żądania Gemini 3 pomijają stały `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują na najbliższy `thinkingLevel` Gemini albo budżet dla tej rodziny modeli.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko myślenie binarne (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Domyślna wartość per agent (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślna wartość globalna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślna wartość zadeklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele zdolne do rozumowania rozstrzygają na `medium` lub najbliższy obsługiwany poziom inny niż `off` dla tego modelu, a modele bez rozumowania pozostają przy `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która jest **wyłącznie** dyrektywą (białe znaki dozwolone), np. `/think:medium` lub `/t high`.
- Pozostaje ona dla bieżącej sesji (domyślnie per nadawca); czyści ją `/think:off` albo reset bezczynnej sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Osadzony Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.
- **Zaplecze Claude CLI**: poziomy inne niż off są przekazywane do Claude Code jako `--effort` przy użyciu `claude-cli`; zobacz [zaplecza CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca tylko dyrektywę przełącza sesyjne nadpisanie trybu szybkiego i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Inline/tylko dyrektywa `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślna wartość per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` tryb szybki mapuje na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Responses Codex. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje na warstwy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy ustawiono oba. OpenClaw nadal pomija wstrzykiwanie warstwy usług Anthropic dla bazowych URL-i proxy innych niż Anthropic.
- `/status` pokazuje `Fast` tylko wtedy, gdy tryb szybki jest włączony.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie sesji, wybierając `inherit`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie obowiązują domyślne wartości sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) odsyłają każde wywołanie narzędzia jako osobną wiadomość zawierającą tylko metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty strumieniowania.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że szczegółowość wynosi `on` lub `full`.
- Gdy szczegółowość wynosi `full`, wyjścia narzędzi są również przekazywane po zakończeniu (osobny dymek, skrócony do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off`, gdy uruchomienie jest w toku, kolejne dymki narzędzi respektują nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` oraz roboczych linii postępu narzędzi. Użyj `"explain"` (domyślnie) dla zwięzłych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz też dołączyć surowe polecenie/szczegół do debugowania. `agents.list[].toolProgressDetail` per agent nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Pluginu (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza sesyjne wyjście śledzenia Pluginu i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie obowiązują domyślne wartości sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debugowania należące do Pluginu, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy włączone, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymka Telegram podczas generowania odpowiedzi, a następnie wysyła finalną odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa inline, następnie nadpisanie sesji, następnie domyślna wartość per agent (`agents.list[].reasoningDefault`), następnie fallback (`off`).

Nieprawidłowo uformowane tagi rozumowania modeli lokalnych są obsługiwane konserwatywnie. Zamknięte bloki `<think>...</think>` pozostają ukryte w normalnych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście również jest ukryte. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty tag otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowo uformowany tag otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [trybie podwyższonym](/pl/tools/elevated).

## Heartbeats

- Treścią sondy Heartbeat jest skonfigurowany prompt Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości Heartbeat obowiązują jak zwykle (ale unikaj zmieniania domyślnych wartości sesji z Heartbeats).
- Dostarczanie Heartbeat domyślnie obejmuje tylko finalny ładunek. Aby wysyłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu webowego

- Selektor myślenia w czacie webowym odzwierciedla zapisany poziom sesji z przychodzącego magazynu sesji/konfiguracji podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwszą opcją jest zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z profilu myślenia dostawcy aktywnego modelu sesji oraz tej samej logiki fallback, której używają `/status` i `session_status`.
- Selektor używa `thinkingLevels` zwracanych przez wiersz/domyślne wartości sesji Gateway, z `thinkingOptions` zachowanym jako starsza lista etykiet. Interfejs przeglądarki nie utrzymuje własnej listy regexów dostawców; Pluginy są właścicielami zestawów poziomów specyficznych dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane przez model poziomy oraz wartość domyślną.
- Pluginy dostawców, które pośredniczą dla modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby katalogi bezpośrednie Anthropic i katalogi pośredniczące pozostały spójne.
- Każdy poziom profilu ma przechowywany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Pluginy narzędziowe, które muszą zweryfikować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych niestandardowych modeli mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody `compat.supportedReasoningEfforts` były odzwierciedlane w walidacji po stronie Plugin.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/wartości domyślne Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory profili i etykiety, których używa walidacja w czasie wykonywania.
