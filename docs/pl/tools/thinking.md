---
read_when:
    - Dostosowujesz parsowanie dyrektyw thinking, fast-mode lub verbose albo ich wartości domyślne
summary: Składnia dyrektyw dla /think, /fast, /verbose i widoczności rozumowania
title: Poziomy thinking
x-i18n:
    generated_at: "2026-04-05T14:09:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f60aeb6ab4c7ce858f725f589f54184b29d8c91994d18c8deafa75179b9a62cb
    source_path: tools/thinking.md
    workflow: 15
---

# Poziomy thinking (/think directives)

## Co to robi

- Dyrektywa inline w dowolnym body wejściowym: `/t <level>`, `/think:<level>` albo `/thinking <level>`.
- Poziomy (aliasy): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → „think”
  - low → „think hard”
  - medium → „think harder”
  - high → „ultrathink” (maksymalny budżet)
  - xhigh → „ultrathink+” (tylko modele GPT-5.2 + Codex)
  - adaptive → zarządzany przez dostawcę adaptacyjny budżet rozumowania (obsługiwany dla rodziny modeli Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` i `extra_high` mapują na `xhigh`.
  - `highest`, `max` mapują na `high`.
- Uwagi dotyczące dostawców:
  - Modele Anthropic Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu thinking.
  - MiniMax (`minimax/*`) na ścieżce streamingu zgodnej z Anthropic domyślnie używa `thinking: { type: "disabled" }`, chyba że jawnie ustawisz thinking w params modelu albo params żądania. Zapobiega to wyciekom delt `reasoning_content` z nienatywnego formatu streamu Anthropic w MiniMax.
  - Z.AI (`zai/*`) obsługuje tylko binarne thinking (`on`/`off`). Każdy poziom inny niż `off` jest traktowany jako `on` (mapowany do `low`).
  - Moonshot (`moonshot/*`) mapuje `/think off` do `thinking: { type: "disabled" }`, a każdy poziom inny niż `off` do `thinking: { type: "enabled" }`. Gdy thinking jest włączone, Moonshot akceptuje tylko `tool_choice` `auto|none`; OpenClaw normalizuje niezgodne wartości do `auto`.

## Kolejność rozwiązywania

1. Dyrektywa inline w wiadomości (dotyczy tylko tej wiadomości).
2. Nadpisanie sesji (ustawiane przez wysłanie wiadomości zawierającej wyłącznie dyrektywę).
3. Wartość domyślna per agent (`agents.list[].thinkingDefault` w konfiguracji).
4. Globalna wartość domyślna (`agents.defaults.thinkingDefault` w konfiguracji).
5. Fallback: `adaptive` dla modeli Anthropic Claude 4.6, `low` dla innych modeli obsługujących rozumowanie, w przeciwnym razie `off`.

## Ustawianie domyślnej wartości sesji

- Wyślij wiadomość będącą **wyłącznie** dyrektywą (dozwolone białe znaki), np. `/think:medium` albo `/t high`.
- To ustawienie zostaje dla bieżącej sesji (domyślnie per nadawca); jest czyszczone przez `/think:off` albo reset bezczynności sesji.
- Wysyłana jest odpowiedź potwierdzająca (`Thinking level set to high.` / `Thinking disabled.`). Jeśli poziom jest nieprawidłowy (np. `/thinking big`), polecenie zostaje odrzucone z podpowiedzią, a stan sesji pozostaje bez zmian.
- Wyślij `/think` (albo `/think:`) bez argumentu, aby zobaczyć bieżący poziom thinking.

## Zastosowanie przez agenta

- **Embedded Pi**: ustalony poziom jest przekazywany do runtime osadzonego agenta Pi działającego w procesie.

## Fast mode (/fast)

- Poziomy: `on|off`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza nadpisanie fast-mode sesji i odpowiada `Fast mode enabled.` / `Fast mode disabled.`.
- Wyślij `/fast` (albo `/fast status`) bez trybu, aby zobaczyć bieżący efektywny stan fast-mode.
- OpenClaw rozwiązuje fast mode w tej kolejności:
  1. Dyrektywa inline / zawierająca wyłącznie dyrektywę `/fast on|off`
  2. Nadpisanie sesji
  3. Wartość domyślna per agent (`agents.list[].fastModeDefault`)
  4. Konfiguracja per model: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Dla `openai/*` fast mode mapuje się na przetwarzanie priorytetowe OpenAI przez wysyłanie `service_tier=priority` w obsługiwanych żądaniach Responses.
- Dla `openai-codex/*` fast mode wysyła tę samą flagę `service_tier=priority` w Codex Responses. OpenClaw utrzymuje jeden współdzielony przełącznik `/fast` dla obu ścieżek auth.
- Dla bezpośrednich publicznych żądań `anthropic/*`, w tym ruchu uwierzytelnianego OAuth wysyłanego do `api.anthropic.com`, fast mode mapuje się na poziomy usługi Anthropic: `/fast on` ustawia `service_tier=auto`, `/fast off` ustawia `service_tier=standard_only`.
- Dla `minimax/*` na ścieżce zgodnej z Anthropic, `/fast on` (albo `params.fastMode: true`) przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.
- Jawne params modelu Anthropic `serviceTier` / `service_tier` mają pierwszeństwo nad domyślnym fast mode, gdy ustawiono oba. OpenClaw nadal pomija wstrzykiwanie poziomu usługi Anthropic dla nie-Anthropic proxy `baseUrl`.

## Dyrektywy verbose (/verbose lub /v)

- Poziomy: `on` (minimalne) | `full` | `off` (domyślnie).
- Wiadomość zawierająca wyłącznie dyrektywę przełącza verbose sesji i odpowiada `Verbose logging enabled.` / `Verbose logging disabled.`; nieprawidłowe poziomy zwracają podpowiedź bez zmiany stanu.
- `/verbose off` zapisuje jawne nadpisanie sesji; wyczyść je przez Sessions UI, wybierając `inherit`.
- Dyrektywa inline wpływa tylko na tę wiadomość; w przeciwnym razie stosowane są wartości domyślne sesji / globalne.
- Wyślij `/verbose` (albo `/verbose:`) bez argumentu, aby zobaczyć bieżący poziom verbose.
- Gdy verbose jest włączone, agenci emitujący uporządkowane wyniki narzędzi (Pi, inni agenci JSON) wysyłają każde wywołanie narzędzia z powrotem jako osobną wiadomość zawierającą tylko metadane, z prefiksem `<emoji> <tool-name>: <arg>`, jeśli jest dostępny (ścieżka / polecenie). Te podsumowania narzędzi są wysyłane od razu po starcie każdego narzędzia (osobne dymki), a nie jako delty streamingu.
- Podsumowania błędów narzędzi pozostają widoczne w trybie normalnym, ale surowe sufiksy szczegółów błędu są ukryte, chyba że verbose ma wartość `on` albo `full`.
- Gdy verbose ma wartość `full`, wyjścia narzędzi są również przekazywane po zakończeniu (osobny dymek, przycięty do bezpiecznej długości). Jeśli przełączysz `/verbose on|full|off` podczas trwania uruchomienia, kolejne dymki narzędzi będą respektować nowe ustawienie.

## Widoczność rozumowania (/reasoning)

- Poziomy: `on|off|stream`.
- Wiadomość zawierająca wyłącznie dyrektywę przełącza to, czy bloki thinking są pokazywane w odpowiedziach.
- Gdy włączone, rozumowanie jest wysyłane jako **osobna wiadomość** z prefiksem `Reasoning:`.
- `stream` (tylko Telegram): streamuje rozumowanie do dymka szkicu Telegram podczas generowania odpowiedzi, a następnie wysyła finalną odpowiedź bez rozumowania.
- Alias: `/reason`.
- Wyślij `/reasoning` (albo `/reasoning:`) bez argumentu, aby zobaczyć bieżący poziom rozumowania.
- Kolejność rozwiązywania: dyrektywa inline, potem nadpisanie sesji, potem wartość domyślna per agent (`agents.list[].reasoningDefault`), a na końcu fallback (`off`).

## Powiązane

- Dokumentacja trybu elevated znajduje się w [Trybie elevated](/tools/elevated).

## Heartbeaty

- Body sondy heartbeat to skonfigurowany prompt heartbeat (domyślnie: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Dyrektywy inline w wiadomości heartbeat działają normalnie (ale unikaj zmieniania domyślnych ustawień sesji przez heartbeaty).
- Dostarczanie heartbeat domyślnie wysyła tylko końcowy payload. Aby wysłać również osobną wiadomość `Reasoning:` (gdy jest dostępna), ustaw `agents.defaults.heartbeat.includeReasoning: true` albo per agent `agents.list[].heartbeat.includeReasoning: true`.

## Interfejs web chat

- Selektor thinking w web chat odzwierciedla zapisany poziom sesji z magazynu / konfiguracji sesji wejściowych przy ładowaniu strony.
- Wybranie innego poziomu zapisuje nadpisanie sesji natychmiast przez `sessions.patch`; nie czeka na następne wysłanie i nie jest jednorazowym nadpisaniem `thinkingOnce`.
- Pierwsza opcja to zawsze `Default (<resolved level>)`, gdzie ustalona wartość domyślna pochodzi z aktywnego modelu sesji: `adaptive` dla Claude 4.6 na Anthropic/Bedrock, `low` dla innych modeli obsługujących rozumowanie, a w przeciwnym razie `off`.
- Picker pozostaje świadomy dostawcy:
  - większość dostawców pokazuje `off | minimal | low | medium | high | adaptive`
  - Z.AI pokazuje binarne `off | on`
- `/think:<level>` nadal działa i aktualizuje ten sam zapisany poziom sesji, więc dyrektywy czatu i picker pozostają zsynchronizowane.
