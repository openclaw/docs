---
read_when:
    - Dostosowywanie parsowania lub ustawień domyślnych dyrektyw myślenia, trybu szybkiego lub szczegółowości
summary: Składnia dyrektyw dla /think, /fast, /verbose, /trace oraz widoczności rozumowania
title: Poziomy myślenia
x-i18n:
    generated_at: "2026-04-17T09:49:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1cb44a7bf75546e5a8c3204e12f3297221449b881161d173dea4983da3921649
    source_path: tools/thinking.md
    workflow: 15
---

# Poziomy myślenia (dyrektywy /think)

## Co to robi

- Dyrektywa w treści dowolnej wiadomości przychodzącej: `/t <level>`, `/think:<level>` lub `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (GPT-5.2 + modele Codex oraz wysiłek Anthropic Claude Opus 4.7)
  - adaptive → adaptacyjne myślenie zarządzane przez dostawcę (obsługiwane dla Anthropic Claude 4.6 i Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` są mapowane na `xhigh`.
  - `highest`, `max` są mapowane na `high`.
- Uwagi dotyczące dostawców:
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnie poziomu myślenia.
  - Anthropic Claude Opus 4.7 nie używa domyślnie adaptacyjnego myślenia. Domyślny wysiłek API pozostaje zarządzany przez dostawcę, chyba że jawnie ustawisz poziom myślenia.
  - Anthropic Claude Opus 4.7 mapuje `/think xhigh` na adaptacyjne myślenie oraz `output_config.effort: "xhigh"`, ponieważ `/think` jest dyrektywą myślenia, a `xhigh` jest ustawieniem wysiłku dla Opus 4.7.
  - MiniMax (`minimax/*`) na ścieżce strumieniowania zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz myślenie w parametrach modelu lub parametrach żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu strumienia Anthropic używanego przez MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne myślenie (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany na `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` na `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` na `thinking: { type: "enabled" }`. Gdy myślenie jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozstrzygania

1. Dyrektywa w treści wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Domyślne ustawienie per agent (`agents.list[].thinkingDefault` w konfiguracji).
4. Domyślne ustawienie globalne (`agents.defaults.thinkingDefault` w konfiguracji).
5. Wartość zapasowa: `adaptive` dla modeli Anthropic Claude 4.6, `off` dla Anthropic Claude Opus 4.7, jeśli nie skonfigurowano inaczej, `low` dla innych modeli obsługujących rozumowanie, w przeciwnym razie `off`.

## Ustawianie domyślnej wartości dla sesji

- Wyślij wiadomość, która zawiera **tylko** dyrektywę (dozwolone są białe znaki), np. `/think:medium` lub `/t high`.
- To ustawienie pozostaje dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` lub reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (lub `/think:`) bez argumentu, aby zobaczyć bieżący poziom myślenia.

## Zastosowanie przez agenta

- **Embedded Pi**: rozstrzygnięty poziom jest przekazywany do działającego w procesie środowiska uruchomieniowego agenta Pi.

## Tryb szybki (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie trybu szybkiego dla sesji i zwraca odpowiedź `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (lub `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan trybu szybkiego.
- OpenClaw rozstrzyga tryb szybki w następującej kolejności:
  1. Dyrektywa w treści/wiadomość zawierająca wyłącznie dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Domyślne ustawienie per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Wartość zapasowa: `off`
- Dla `openai/*` tryb szybki mapuje się na przetwarzanie priorytetowe OpenAI przez wysłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` tryb szybki wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden wspólny przełącznik `/fast` dla obu ścieżek uwierzytelniania.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnionego przez OAuth wysyłanego do `api.anthropic.com`, tryb szybki mapuje się na poziomy usług Anthropic: `/fast on` ustawia `service_tier=auto`, a `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic `/fast on` (lub `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne parametry modelu Anthropic `serviceTier` / `service_tier` nadpisują domyślne ustawienie trybu szybkiego, gdy ustawione są oba. OpenClaw nadal pomija wstrzykiwanie poziomu usług Anthropic dla bazowych URL proxy innych niż Anthropic.

## Dyrektywy szczegółowości (/verbose lub /v)

- Poziomy: `on` (minimalny) | `full` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza szczegółowość sesji i zwraca odpowiedź `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je w interfejsie sesji, wybierając `inherit`.
- Dyrektywa w treści wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/verbose` (lub `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom szczegółowości.
- Gdy szczegółowość jest włączona, agenci emitujący ustrukturyzowane wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość zawierającą tylko metadane, poprzedzoną `<emoji> <tool-name>: <arg>`, gdy to możliwe (ścieżka/polecenie). Te podsumowania narzędzi są wysyłane natychmiast po uruchomieniu każdego narzędzia (osobne dymki), a nie jako strumieniowe delty.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe przyrostki ze szczegółami błędów są ukryte, chyba że `verbose` ma wartość `on` lub `full`.
- Gdy `verbose` ma wartość `full`, po zakończeniu przekazywane są także wyniki narzędzi (osobny dymek, obcięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwającego uruchomienia, kolejne dymki narzędzi będą respektować nowe ustawienie.

## Dyrektywy śledzenia Pluginów (/trace)

- Poziomy: `on` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza wyjście śledzenia Pluginów dla sesji i zwraca odpowiedź `Plugin trace enabled.` / `Plugin trace disabled.`.
- Dyrektywa w treści wpływa tylko na tę wiadomość; w pozostałych przypadkach stosowane są domyślne ustawienia sesji/globalne.
- Wyślij `/trace` (lub `/trace:`) bez argumentu, aby zobaczyć bieżący poziom śledzenia.
- `/trace` jest węższe niż `/verbose`: ujawnia tylko linie śledzenia/debug należące do Pluginów, takie jak podsumowania debugowania Active Memory.
- Linie śledzenia mogą pojawiać się w `/status` oraz jako dodatkowa wiadomość diagnostyczna po zwykłej odpowiedzi asystenta.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza, czy bloki myślenia są pokazywane w odpowiedziach.
- Gdy jest włączona, rozumowanie jest wysyłane jako **osobna wiadomość** poprzedzona `Reasoning:`.
- `stream` (tylko Telegram): strumieniuje rozumowanie do roboczego dymka Telegram podczas generowania odpowiedzi, a następnie wysyła końcową odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (lub `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozstrzygania: dyrektywa w treści, następnie nadpisanie sesji, następnie domyślne ustawienie per agent (`agents.list[].reasoningDefault`), a potem wartość zapasowa (`off`).

## Powiązane

- Dokumentacja trybu podwyższonego znajduje się w [Elevated mode](/pl/tools/elevated).

## Heartbeat

- Treścią sondy Heartbeat jest skonfigurowany prompt Heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy w treści wiadomości Heartbeat działają jak zwykle (ale unikaj zmieniania domyślnych ustawień sesji przez Heartbeat).
- Dostarczanie Heartbeat domyślnie obejmuje tylko końcowy ładunek. Aby wysyłać także osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` lub per agent `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs czatu WWW

- Selektor myślenia w interfejsie czatu WWW odzwierciedla zapisany poziom sesji z magazynu sesji/konfiguracji wejściowej podczas ładowania strony.
- Wybranie innego poziomu natychmiast zapisuje nadpisanie sesji przez `sessions.patch`; nie czeka na kolejne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie rozstrzygnięta wartość domyślna pochodzi z aktywnego modelu sesji: `adaptive` dla Claude 4.6 w Anthropic, `off` dla Anthropic Claude Opus 4.7, jeśli nie skonfigurowano inaczej, `low` dla innych modeli obsługujących rozumowanie, w przeciwnym razie `off`.
- Selektor pozostaje świadomy dostawcy:
  - większość dostawców pokazuje `off | minimal | low | medium | high | adaptive`
  - Anthropic Claude Opus 4.7 pokazuje `off | minimal | low | medium | high | xhigh | adaptive`
  - Z.AI pokazuje binarne `off | on`
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, dzięki czemu dyrektywy czatu i selektor pozostają zsynchronizowane.
