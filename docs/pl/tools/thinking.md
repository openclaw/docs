---
read_when:
    - Dostosowywanie parsowania lub wartości domyślnych dyrektyw dotyczących thinking, fast-mode lub verbose
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczność rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-07-03T10:03:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## Co robi

- Dyrektywa inline w dowolnej treści przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „myśl”
  - low → „myśl intensywnie”
  - medium → „myśl intensywniej”
  - high → „ultramyślenie” (maksymalny budżet)
  - xhigh → „ultramyślenie+” (modele GPT-5.2+ i Codex oraz wysiłek Anthropic Claude Opus 4.7+)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Claude 4.6 w Anthropic/Bedrock, Anthropic Claude Opus 4.7+ oraz dynamicznego myślenia Google Gemini)
  - max → maksymalne rozumowanie dostawcy (Anthropic Claude Opus 4.7+; Ollama mapuje to na swój najwyższy natywny wysiłek `think`)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują na `xhigh`.
  - `highest` mapuje na `high`.
- Uwagi dotyczące dostawców:
  - Menu i selektory myślenia są sterowane profilami dostawców. Pluginy dostawców deklarują dokładny zestaw poziomów dla wybranego modelu, w tym etykiety takie jak binarne `on`.
  - `adaptive`, `xhigh` i `max` są ogłaszane tylko dla profili dostawca/model, które je obsługują. Wpisane dyrektywy dla nieobsługiwanych poziomów są odrzucane z prawidłowymi opcjami danego modelu.
  - Istniejące zapisane nieobsługiwane poziomy są remapowane według rangi profilu dostawcy. `adaptive` wraca do `medium` w modelach nieadaptacyjnych, natomiast `xhigh` i `max` wracają do największego obsługiwanego poziomu innego niż `off` dla wybranego modelu.
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.
  - Anthropic Claude Opus 4.8 i Opus 4.7 pozostawiają myślenie wyłączone, chyba że jawnie ustawisz poziom myślenia. Domyślny wysiłek należący do dostawcy dla Opus 4.8 to `high` po włączeniu adaptacyjnego myślenia.
  - Anthropic Claude Opus 4.7+ mapuje `/think xhigh` na adaptacyjne myślenie plus `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku Opus.
  - Anthropic Claude Opus 4.7+ udostępnia też `/think max`; mapuje się to na tę samą ścieżkę maksymalnego wysiłku należącą do dostawcy.
  - Bezpośrednie modele DeepSeek V4 udostępniają `/think xhigh|max`; oba mapują na DeepSeek `reasoning_effort: "max"`, a niższe poziomy inne niż `off` mapują na `high`.
  - Modele DeepSeek V4 routowane przez OpenRouter udostępniają `/think xhigh` i wysyłają wartości `reasoning.effort` obsługiwane przez OpenRouter zamiast natywnego dla DeepSeek pola najwyższego poziomu `reasoning_effort`. Niższe poziomy inne niż `off` mapują na `high`, a zapisane nadpisania `max` wracają do `xhigh`.
  - Modele Ollama zdolne do myślenia udostępniają `/think low|medium|high|max`; `max` mapuje na natywne `think: "high"`, ponieważ natywne API Ollama akceptuje ciągi wysiłku `low`, `medium` i `high`.
  - Modele OpenAI GPT mapują `/think` przez obsługę wysiłku specyficzną dla modelu w Responses API. `/think off` wysyła `reasoning.effort: "none"` tylko wtedy, gdy model docelowy to obsługuje; w przeciwnym razie OpenClaw pomija wyłączony ładunek rozumowania zamiast wysyłać nieobsługiwaną wartość.
  - Niestandardowe wpisy katalogu zgodne z OpenAI mogą włączyć `/think xhigh`, ustawiając `models.providers.<provider>.models[].compat.supportedReasoningEfforts` tak, aby zawierało `"xhigh"`. Używa to tych samych metadanych zgodności, które mapują wychodzące ładunki wysiłku rozumowania OpenAI, dzięki czemu menu, walidacja sesji, CLI agenta i `llm-task` zgadzają się z zachowaniem transportu.
  - Nieaktualne skonfigurowane referencje OpenRouter Hunter Alpha pomijają wstrzykiwanie rozumowania przez proxy, ponieważ ta wycofana trasa mogła zwracać tekst końcowej odpowiedzi przez pola rozumowania.
  - Google Gemini mapuje `/think adaptive` na dynamiczne myślenie należące do dostawcy Gemini. Żądania Gemini 3 pomijają stałe `thinkingLevel`, natomiast żądania Gemini 2.5 wysyłają `thinkingBudget: -1`; stałe poziomy nadal mapują na najbliższe Gemini `thinkingLevel` lub budżet dla tej rodziny modeli.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekającym deltom `reasoning_content` z nienatywnego formatu strumienia Anthropic w M2.x. MiniMax-M3 (i M3.x) jest wyjątkiem: M3 emituje prawidłowe bloki myślenia Anthropic i zwraca pustą treść, gdy myślenie jest wyłączone, więc OpenClaw pozostawia M3 na pomijanej/adaptacyjnej ścieżce myślenia dostawcy.
  - Z.AI (`zai/*`) jest binarne (`on`/`off`) dla większości modeli GLM. GLM-5.2 jest wyjątkiem: udostępnia `/think off|low|high|max`, mapuje `low` i `high` na Z.AI `reasoning_effort: "high"` oraz mapuje `max` na `reasoning_effort: "max"`.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) zawsze myśli. Jego profil udostępnia tylko `on`, a OpenClaw pomija wychodzące pole `thinking` zgodnie z wymaganiami Moonshot. Inne modele `moonshot/*` mapują `/think off` na `thinking: { type: "disabled" }`, a dowolny poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawione przez wysłanie wiadomości zawierającej tylko dyrektywę).
3. Domyślna wartość dla agenta (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślna wartość globalna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Wartość rezerwowa: domyślna zadeklarowana przez dostawcę, gdy jest dostępna; w przeciwnym razie modele zdolne do rozumowania rozstrzygają się do `medium` lub najbliższego obsługiwanego poziomu innego niż `off` dla danego modelu, a modele bez rozumowania pozostają `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość, która jest **tylko** dyrektywą (białe znaki dozwolone), np. `/think:medium` lub `/t high`.
- To pozostaje dla bieżącej sesji (domyślnie dla nadawcy). Użyj `/think default`, aby wyczyścić nadpisanie sesji i odziedziczyć domyślną wartość skonfigurowaną/dostawcy; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- `/think off` zapisuje jawne nadpisanie wyłączenia. Wyłącza myślenie do czasu zmiany lub wyczyszczenia nadpisania sesji.
- Wysyłana jest odpowiedź z potwierdzeniem (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie jest odrzucane z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie według agenta

- **Osadzony OpenClaw**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta OpenClaw.
- **Backend Claude CLI**: poziomy inne niż off są przekazywane do Claude Code jako `--effort` podczas używania `claude-cli`; zobacz [Backendy CLI](/pl/gateway/cli-backends).

## Tryb szybki (/fast)

- Poziomy: `auto|on|off|default`.
- Wiadomość zawierająca tylko dyrektywę przełącza nadpisanie sesji trybu szybkiego i odpowiada `Fast mode set to auto.`, `Fast mode enabled.` lub `Fast mode disabled.`. Użyj `/fast default`, aby wyczyścić nadpisanie sesji i odziedziczyć skonfigurowaną wartość domyślną; aliasy obejmują `inherit`, `clear`, `reset` i `unpin`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w tej kolejności:
  1. Nadpisanie inline/zawierające tylko dyrektywę `/fast auto|on|off` (`/fast default` czyści tę warstwę)
  2. Nadpisanie sesji
  3. Domyślna wartość dla agenta (`agents.list[].fastModeDefault`)
  4. Konfiguracja dla modelu: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Wartość rezerwowa: `off`
- `auto` utrzymuje tryb sesji/konfiguracji jako auto, ale rozstrzyga każde nowe wywołanie modelu niezależnie. Wywołania, które rozpoczynają się przed progiem auto, mają włączony tryb szybki; późniejsze ponowienia, wartości rezerwowe, wyniki narzędzi lub wywołania kontynuacji zaczynają z wyłączonym trybem szybkim. Domyślny próg to 60 sekund; ustaw `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` w aktywnym modelu, aby go zmienić.
- Dla `openai/*` tryb szybki mapuje na priorytetowe przetwarzanie OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla modeli `openai/*` / `openai-codex/*` opartych na Codex tryb szybki wysyła tę samą flagę `service_tier=priority` w Responses Codex. Natywne tury serwera aplikacji Codex otrzymują poziom tylko przy `turn/start` lub rozpoczęciu/wznowieniu wątku, więc `auto` nie może zmienić poziomu już działającej tury serwera aplikacji; dotyczy następnej tury modelu uruchomionej przez OpenClaw.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślną wartość trybu szybkiego, gdy oba są ustawione. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla adresów bazowych proxy innych niż Anthropic.
- `/status` pokazuje `Fast`, gdy tryb szybki jest włączony, oraz `Fast:auto`, gdy skonfigurowany tryb to auto.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza szczegółowość sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez interfejs sesji, wybierając `inherit`.
- Autoryzowani nadawcy zewnętrznych kanałów mogą utrwalać nadpisanie szczegółowości sesji. Wewnętrzni klienci Gateway/webchat potrzebują `operator.admin`, aby je utrwalić.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie obowiązują wartości domyślne sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi wysyłają każde wywołanie narzędzia jako osobną wiadomość zawierającą tylko metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy jest dostępne. Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako strumieniowane delty.
- Podsumowania niepowodzeń narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że szczegółowość to `full`.
- Gdy szczegółowość to `full`, wyniki narzędzi są też przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` w trakcie działania, kolejne dymki narzędzi respektują nowe ustawienie.
- `agents.defaults.toolProgressDetail` kontroluje kształt podsumowań narzędzi `/verbose` i linii narzędzi w roboczych postępach. Użyj `"explain"` (domyślnie) dla zwięzłych etykiet czytelnych dla człowieka, takich jak `🛠️ Exec: checking JS syntax`; użyj `"raw"`, gdy chcesz też dołączyć surowe polecenie/szczegóły do debugowania. `agents.list[].toolProgressDetail` dla agenta nadpisuje wartość domyślną.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Dyrektywy śladu Pluginu (/trace)

- Poziomy: `on` | `off` (domyślny).
- Wiadomość zawierająca tylko dyrektywę przełącza wyjście śladu Pluginu w sesji i odpowiada `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa inline dotyczy tylko tej wiadomości; w przeciwnym razie obowiązują wartości domyślne sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śladu.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko należące do Pluginu linie śladu/debugowania, takie jak podsumowania debugowania Active Memory.
- Linie śladu mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po normalnej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca tylko dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy jest włączone, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Thinking`.
- `stream`: strumieniuje rozumowanie podczas generowania odpowiedzi, gdy aktywny kanał obsługuje podglądy rozumowania, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa inline, następnie nadpisanie sesji, następnie domyślna wartość dla agenta (`agents.list[].reasoningDefault`), następnie globalna wartość domyślna (`agents.defaults.reasoningDefault`), następnie wartość rezerwowa (`off`).

Nieprawidłowe znaczniki rozumowania modelu lokalnego są obsługiwane zachowawczo. Zamknięte bloki `<think>...</think>` pozostają ukryte w zwykłych odpowiedziach, a niezamknięte rozumowanie po już widocznym tekście również jest ukrywane. Jeśli odpowiedź jest w całości opakowana w pojedynczy niezamknięty znacznik otwierający i w przeciwnym razie zostałaby dostarczona jako pusty tekst, OpenClaw usuwa nieprawidłowy znacznik otwierający i dostarcza pozostały tekst.

## Powiązane

- Dokumentacja trybu podwyższonych uprawnień znajduje się w [Tryb podwyższonych uprawnień](/pl/tools/elevated).

## Heartbeat

- Treść sondy Heartbeat to skonfigurowany prompt Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy wbudowane w wiadomość Heartbeat działają jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji z poziomu Heartbeat).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy payload. Aby wysyłać także osobną wiadomość `Thinking` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` albo dla konkretnego agenta `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu WWW

- Selektor myślenia w czacie WWW odzwierciedla zapisany poziom sesji z przychodzącego magazynu/konfiguracji sesji podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja zawsze służy do wyczyszczenia nadpisania. Pokazuje `Inherited: <resolved level>`, w tym `Inherited: Off`, gdy dziedziczone myślenie jest wyłączone.
- Jawne wybory w selektorze używają bezpośrednich etykiet poziomów, zachowując etykiety dostawcy, jeśli są obecne (na przykład `Maximum` dla opcji `max` z etykietą dostawcy).
- Selektor używa `thinkingLevels` zwróconych przez wiersz/domyślne ustawienia sesji Gateway, z `thinkingOptions` zachowanym jako starsza lista etykiet. Interfejs przeglądarki nie utrzymuje własnej listy wyrażeń regularnych dostawców; pluginy są właścicielami zestawów poziomów specyficznych dla modelu.
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i selektor pozostają zsynchronizowane.

## Profile dostawców

- Pluginy dostawców mogą udostępniać `resolveThinkingProfile(ctx)`, aby definiować obsługiwane poziomy i wartość domyślną modelu.
- Pluginy dostawców, które pośredniczą do modeli Claude, powinny ponownie używać `resolveClaudeThinkingProfile(modelId)` z `openclaw/plugin-sdk/provider-model-shared`, aby bezpośrednie katalogi Anthropic i katalogi pośredniczące pozostawały zgodne.
- Każdy poziom profilu ma zapisane kanoniczne `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` albo `max`) i może zawierać wyświetlaną `label`. Dostawcy binarni używają `{ id: "low", label: "on" }`.
- Hooki profilu otrzymują scalone fakty katalogowe, gdy są dostępne, w tym `reasoning`, `compat.thinkingFormat` i `compat.supportedReasoningEfforts`. Używaj tych faktów, aby udostępniać profile binarne lub niestandardowe tylko wtedy, gdy skonfigurowany kontrakt żądania obsługuje pasujący payload.
- Pluginy narzędziowe, które muszą walidować jawne nadpisanie myślenia, powinny używać `api.runtime.agent.resolveThinkingPolicy({ provider, model })` oraz `api.runtime.agent.normalizeThinkingLevel(...)`; nie powinny utrzymywać własnych list poziomów dostawców/modeli.
- Pluginy narzędziowe z dostępem do skonfigurowanych metadanych modeli niestandardowych mogą przekazać `catalog` do `resolveThinkingPolicy`, aby zgody `compat.supportedReasoningEfforts` były uwzględniane w walidacji po stronie pluginu.
- Opublikowane starsze hooki (`supportsXHighThinking`, `isBinaryThinking` i `resolveDefaultThinkingLevel`) pozostają adapterami zgodności, ale nowe zestawy poziomów niestandardowych powinny używać `resolveThinkingProfile`.
- Wiersze/domyślne ustawienia Gateway udostępniają `thinkingLevels`, `thinkingOptions` i `thinkingDefault`, aby klienci ACP/czatu renderowali te same identyfikatory i etykiety profili, których używa walidacja w czasie wykonywania.
