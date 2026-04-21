---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnianie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i implikacji użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-21T09:53:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Wiadomości

Ta strona łączy informacje o tym, jak OpenClaw obsługuje wiadomości przychodzące, sesje, kolejkowanie,
strumieniowanie i widoczność rozumowania.

## Przepływ wiadomości (wysoki poziom)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień block streaming i chunking.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników strumieniowania.

Pełny schemat znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Deduplikacja wiadomości przychodzących

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwałą pamięć podręczną opartą na channel/account/peer/session/message id, dzięki czemu zduplikowane
dostarczenia nie wywołują kolejnego uruchomienia agenta.

## Debouncing wiadomości przychodzących

Szybko następujące po sobie wiadomości od **tego samego nadawcy** mogą zostać zgrupowane w jeden
turn agenta przez `messages.inbound`. Debouncing jest ograniczony do channel + conversation
i używa najnowszej wiadomości do wątkowania odpowiedzi/ID.

Konfiguracja (domyślne ustawienie globalne + nadpisania per kanał):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Uwagi:

- Debounce dotyczy wiadomości **tylko tekstowych**; multimedia/załączniki są opróżniane natychmiast.
- Polecenia sterujące omijają debouncing, aby pozostały samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza scalanie wiadomości DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby payload wysłany w częściach mógł dołączyć do tego samego turnu agenta.

## Sesje i urządzenia

Sesje należą do gateway, a nie do klientów.

- Czaty bezpośrednie są zwijane do klucza głównej sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypcje znajdują się na hoście gateway.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego podstawowego urządzenia do długich
rozmów, aby uniknąć rozbieżnego kontekstu. Interfejs Control UI i TUI zawsze pokazują
transkrypcję sesji opartą na gateway, więc to one są źródłem prawdy.

Szczegóły: [Zarządzanie sesją](/pl/concepts/session).

## Treści przychodzące i kontekst historii

OpenClaw rozdziela **treść promptu** od **treści polecenia**:

- `Body`: tekst promptu wysyłany do agenta. Może obejmować koperty kanału i
  opcjonalne opakowania historii.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa współdzielonego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

W przypadku **czatów innych niż bezpośrednie** (grupy/kanały/pokoje) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (w tym samym stylu, który jest używany dla wpisów historii). Dzięki temu wiadomości w czasie rzeczywistym i wiadomości w kolejce/historii
są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: obejmują wiadomości grupowe, które _nie_
wywołały uruchomienia (na przykład wiadomości objęte bramkowaniem wzmianek), i **wykluczają** wiadomości
już obecne w transkrypcji sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, dzięki czemu historia
pozostaje nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości, a `Body` pozostawiać jako połączony prompt.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (domyślne ustawienie globalne)
oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i followupy

Jeśli uruchomienie jest już aktywne, wiadomości przychodzące mogą zostać umieszczone w kolejce, skierowane do
bieżącego uruchomienia albo zebrane na turn followup.

- Konfiguracja przez `messages.queue` (oraz `messages.queue.byChannel`).
- Tryby: `interrupt`, `steer`, `followup`, `collect` oraz warianty backlog.

Szczegóły: [Kolejkowanie](/pl/concepts/queue).

## Strumieniowanie, chunking i batching

Block streaming wysyła częściowe odpowiedzi, gdy model produkuje bloki tekstu.
Chunking respektuje limity tekstu kanału i unika rozdzielania ogrodzonych bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (batching oparty na bezczynności)
- `agents.defaults.humanDelay` (pauza podobna do ludzkiej między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Strumieniowanie + chunking](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` steruje widocznością.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest generowana przez model.
- Telegram obsługuje strumień rozumowania do dymka wersji roboczej.

Szczegóły: [Dyrektywy Thinking + reasoning](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), a także `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i domyślne ustawienia per kanał

Szczegóły: [Konfiguracja](/pl/gateway/configuration-reference#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
OpenClaw rozstrzyga to zachowanie według typu rozmowy:

- Rozmowy bezpośrednie domyślnie nie pozwalają na ciszę i przepisują samodzielną cichą
  odpowiedź na krótką widoczną odpowiedź awaryjną.
- Grupy/kanały domyślnie pozwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie pozwala na ciszę.

Wartości domyślne znajdują się w `agents.defaults.silentReply` oraz
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisywać per surface.

## Powiązane

- [Strumieniowanie](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Retry](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Queue](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami komunikacyjnymi
