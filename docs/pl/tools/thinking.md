---
read_when:
    - Dostosowywanie parsowania lub wartości domyślnych dyrektyw thinking, fast-mode albo verbose
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-06-27T18:31:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (modele GPT-5.2+ i Codex, oraz wysiłek Anthropic Claude Opus 4.7+)
  - adaptive → myślenie adaptacyjne zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7+ oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7+; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują się na `xhigh`.
  - `highest` mapuje się na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilem dostawcy. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawcy/modelu, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane wraz z prawidłowymi opcjami danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są przemapowywane według rangi profilu dostawcy. `adaptive` cofa się do `medium` w modelach nieadaptacyjnych, natomiast `xhigh` i `max` cofają się do największego obsługiwanego poziomu innego niż off dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.8 i Opus 4.7 utrzymują myślenie wyłączone, chyba że jawnie ustawisz poziom myślenia. Domyślny wysiłek należący do dostawcy dla Opus 4.8 to `high` po włączeniu myślenia adaptacyjnego.
  - Anthropic Claude Opus 4.7+ mapuje `/think xhigh` na myślenie adaptacyjne oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus.
  - Anthropic Claude Opus 4.7+ udostępnia także `/think max`; mapuje się ono na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują się na DeepSeek `reasoning_effort: "max"`, podczas gdy niższe poziomy inne niż off mapują się na `high`.
  - Modele DeepSeek V4 trasowane przez OpenRouter udostępniają `/think xhigh` i wysyłają wartości `reasoning_effort` obsługiwane przez OpenRouter. Zapisane nadpisania `max` cofają się do `xhigh`.
  - Modele Ollama obsługujące myślenie udostępniają `/think low|medium|high|max`; `max` mapuje się na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć obsługę `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, więc menu, walidacja sesji, CLI agenta i `llm-task` są zgodne z zachowaniem transportu.
  - Nieaktualne skonfigurowane referencje OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania proxy, ponieważ ta wycofana trasa mogła zwracać tekst końcowej odpowiedzi przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie Gemini należące do dostawcy. Żądania Gemini 3 pomijają stałe `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują się na najbliższy Gemini `thinkingLevel` lub budżet dla danej rodziny modeli.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic w M2.x. MiniMax-M3 (i M3.x) jest wyłączony z tej reguły: M3 emituje poprawne bloki myślenia Anthropic i zwraca pustą treść, gdy myślenie jest wyłączone, więc OpenClaw utrzymuje M3 na pominiętej/adaptacyjnej ścieżce myślenia dostawcy.
  - Z.AI (`zai/*`) jest binarne (`on`/`off`) dla większości modeli GLM. GLM-5.2 jest wyjątkiem: udostępnia `/think off|low|high|max`, mapuje `low` i `high` na Z.AI `reasoning_effort: "high"` oraz mapuje `max` na `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) zawsze myśli. Jego profil udostępnia tylko `on`, a OpenClaw pomija wychodzące pole `thinking`, zgodnie z wymaganiami Moonshot. Inne modele `moonshot/*` mapują `/think off` na `thinking: { type: "disabled" }`, a dowolny poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: domyślna wartość zadeklarowana przez dostawcę, jeśli jest dostępna; w przeciwnym razie modele obsługujące rozumowanie rozstrzygają do `medium` lub najbliższego obsługiwanego poziomu innego niż `off` dla danego modelu, a modele bez rozumowania pozostają `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (spacje są dozwolone), np. `/think:medium` lub `/t high`.
- To zostaje przypięte dla bieżącej sesji (domyślnie per nadawca). Użyj `/think default`, aby wyczyścić nadpisanie sesji i odziedziczyć skonfigurowaną/dostawcy wartość domyślną; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- `/think off` zapisuje jawne nadpisanie off. Wyłącza myślenie, dopóki nie zmienisz lub nie wyczyścisz nadpisania sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Osadzony OpenClaw**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska wykonawczego agenta OpenClaw.
- **Backend Claude CLI**: poziomy inne niż off są przekazywane do Claude Code jako `--effort` podczas używania `claude-cli`; zobacz [backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `auto|on|off|default`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i odpowiada `Fast mode set to auto.`, `Fast mode enabled.` albo `Fast mode disabled.`. Użyj `/fast default`, aby wyczyścić nadpisanie sesji i odziedziczyć skonfigurowaną wartość domyślną; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Nadpisanie inline/zawierające wyłącznie dyrektywę `/fast auto|on|off` (`/fast default` czyści tę warstwę)
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` utrzymuje tryb sesji/konfiguracji jako auto, ale rozstrzyga każde nowe wywołanie modelu niezależnie. Wywołania rozpoczynające się przed progiem auto mają włączony tryb szybki; późniejsze ponowienie, fallback, wynik narzędzia lub kontynuacja rozpoczynają się z wyłączonym trybem szybkim. Próg domyślnie wynosi 60 sekund; ustaw `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` w aktywnym modelu, aby go zmienić.
- Dla `openai/*` tryb szybki mapuje się na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla modeli `openai/*` / `openai-codex/*` opartych na Codex tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. Natywne tury serwera aplikacji Codex otrzymują poziom tylko przy `turn/start` lub rozpoczęciu/wznowieniu wątku, więc `auto` nie może ponownie ustawić poziomu już trwającej tury serwera aplikacji; stosuje się do następnej tury modelu uruchamianej przez OpenClaw.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla bazowych URL-i proxy innych niż Anthropic.
- `/status` pokazuje `Fast`, gdy tryb szybki jest włączony, oraz `Fast:auto`, gdy skonfigurowany tryb to auto.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie Sessions UI, wybierając `inherit`.
- Autoryzowani zewnętrzni nadawcy kanałów mogą utrwalać nadpisanie szczegółowości sesji. Wewnętrzni klienci gateway/webchat potrzebują `operator.admin`, aby je utrwalić.
- Dyrektywa inline wpływa tylko na tę wiadomość; w przeciwnym razie stosowane są wartości domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący strukturalne wyniki narzędzi wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość tylko z metadanymi, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako delty strumieniowania.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędów są ukryte, chyba że szczegółowość to `full`.
- Gdy szczegółowość to `full`, wyjścia narzędzi są także przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` w trakcie działania, kolejne dymki narzędzi honorują nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` oraz roboczych linii postępu narzędzi. Użyj `"explain"` (domyślnie) dla kompaktowych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz także dołączyć surowe polecenie/szczegóły do debugowania. `agents.list[].toolProgressDetail` dla agenta nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śledzenia Plugin (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Plugin dla sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w przeciwnym razie stosowane są wartości domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do pluginu linie śledzenia/debugowania, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako następcza wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Po włączeniu rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Thinking`.
- `stream`: strumieniuje rozumowanie podczas generowania odpowiedzi, gdy aktywny kanał obsługuje podglądy rozumowania, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa inline, potem nadpisanie sesji, potem domyślna wartość dla agenta (`agents.list[].reasoningDefault`), potem globalna wartość domyślna (`agents.defaults.reasoningDefault`), potem fallback (`off`).

Nieprawidłowe znaczniki rozumowania modelu lokalnego są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w zwykłych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście również jest ukrywane. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty znacznik otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowy znacznik otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonego poziomu uprawnień znajduje się w [Tryb podwyższonego poziomu uprawnień](/pl/tools/elevated).

## Heartbeats

- Treść sondy Heartbeat to skonfigurowany monit heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy wbudowane w wiadomości heartbeat stosują się jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji z heartbeatów).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać także osobną wiadomość `Thinking` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` albo dla konkretnego agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs WWW czatu

- Selektor myślenia w czacie WWW odzwierciedla zapisany poziom sesji z magazynu/konfiguracji sesji przychodzącej po załadowaniu strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja zawsze służy do wyczyszczenia nadpisania. Pokazuje `Inherited: <resolved level>`, w tym `Inherited: Off`, gdy odziedziczone myślenie jest wyłączone.
- Jawne wybory z selektora używają bezpośrednich etykiet poziomów, zachowując etykiety dostawcy, gdy są obecne (na przykład `Maximum` dla opcji `max` z etykietą dostawcy).
- Selektor używa `thinkingLevels` zwróconych przez wiersz/defaulty sesji Gateway, a `thinkingOptions` pozostaje starszą listą etykiet. Interfejs przeglądarki nie utrzymuje własnej listy wyrażeń regularnych dostawców; pluginy są właścicielami zestawów poziomów właściwych dla modeli.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby zdefiniować obsługiwane poziomy i domyślny poziom modelu.
- Pluginy dostawców, które pośredniczą modele Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi proxy pozostawały zgodne.
- Każdy poziom profilu ma zapisany kanoniczny `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` lub `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Hooki profili otrzymują scalone fakty katalogowe, gdy są dostępne, w tym `reasoning`, `compat.thinkingFormat` i `compat.supportedReasoningEfforts`. Używaj tych faktów, aby udostępniać profile binarne lub niestandardowe tylko wtedy, gdy skonfigurowany kontrakt żądania obsługuje pasujący ładunek.
- Pluginy narzędziowe, które muszą zweryfikować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody `compat.supportedReasoningEfforts` były odzwierciedlone w walidacji po stronie pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają jako adaptery zgodności, ale nowe niestandardowe zestawy poziomów powinny używać `resolveThinkingProfile`.
- Wiersze/defaulty Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profili, których używa walidacja w czasie działania.
