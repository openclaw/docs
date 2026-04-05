---
read_when:
    - Wyjaśniasz, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśniasz sesje, tryby kolejkowania lub zachowanie streamingu
    - Dokumentujesz widoczność rozumowania i wpływ na użycie
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-05T13:51:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475f892bd534fdb10a2ee5d3c57a3d4a7fb8e1ab68d695189ba186004713f6f3
    source_path: concepts/messages.md
    workflow: 15
---

# Wiadomości

Ta strona łączy informacje o tym, jak OpenClaw obsługuje wiadomości przychodzące, sesje, kolejkowanie,
streaming i widoczność rozumowania.

## Przepływ wiadomości (wysoki poziom)

```
Wiadomość przychodząca
  -> routing/bindings -> klucz sesji
  -> kolejka (jeśli uruchomienie jest aktywne)
  -> uruchomienie agenta (streaming + narzędzia)
  -> odpowiedzi wychodzące (limity kanału + porcjowanie)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień streamingu blokowego i porcjowania.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Pełny schemat znajdziesz w [Konfiguracja](/gateway/configuration).

## Deduplikacja wiadomości przychodzących

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwały cache z kluczem opartym na channel/account/peer/session/message id, aby zduplikowane
dostarczenia nie uruchamiały kolejnego przebiegu agenta.

## Debouncing wiadomości przychodzących

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zgrupowane w jedną
turę agenta za pomocą `messages.inbound`. Debouncing jest ograniczony do channel + conversation
i używa najnowszej wiadomości do wątkowania odpowiedzi/ID.

Konfiguracja (domyślna globalna + nadpisania per kanał):

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
- Polecenia sterujące omijają debounce, aby pozostały samodzielne.

## Sesje i urządzenia

Sesje należą do gateway, a nie do klientów.

- Czaty bezpośrednie są zwijane do klucza głównej sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypcje znajdują się na hoście gateway.

Wiele urządzeń/kanałów może mapować się do tej samej sesji, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
rozmów, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują
transkrypcję sesji opartą na gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/concepts/session).

## Treści wiadomości przychodzących i kontekst historii

OpenClaw rozdziela **treść promptu** od **treści polecenia**:

- `Body`: tekst promptu wysyłany do agenta. Może zawierać obwiednie kanału i
  opcjonalne opakowania historii.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grupy/kanały/pokoje) **treść bieżącej wiadomości** jest poprzedzona
etykietą nadawcy (ten sam styl używany dla wpisów historii). Dzięki temu wiadomości w czasie rzeczywistym i wiadomości kolejkowane/z historii
pozostają spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: zawierają wiadomości grupowe, które _nie_
uruchomiły przebiegu (na przykład wiadomości objęte bramkowaniem wzmianką) i **wykluczają** wiadomości
już obecne w transkrypcji sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, aby historia
pozostała nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i zachowywać `Body` jako połączony prompt.
Bufory historii są konfigurowalne przez `messages.groupChat.historyLimit` (domyślna wartość globalna)
i nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i followupy

Jeśli przebieg jest już aktywny, wiadomości przychodzące mogą zostać zakolejkowane, skierowane do
bieżącego przebiegu lub zebrane do tury followup.

- Konfiguracja przez `messages.queue` (i `messages.queue.byChannel`).
- Tryby: `interrupt`, `steer`, `followup`, `collect` oraz warianty backlog.

Szczegóły: [Kolejkowanie](/concepts/queue).

## Streaming, porcjowanie i grupowanie

Streaming blokowy wysyła częściowe odpowiedzi, gdy model generuje bloki tekstu.
Porcjowanie uwzględnia limity tekstu kanału i unika dzielenia fenced code.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie zależne od bezczynności)
- `agents.defaults.humanDelay` (pauza przypominająca ludzką między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + chunking](/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal liczy się do użycia tokenów, gdy jest generowana przez model.
- Telegram obsługuje streamowanie rozumowania do dymku wersji roboczej.

Szczegóły: [Dyrektywy thinking + reasoning](/tools/thinking) oraz [Użycie tokenów](/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i wartości domyślne per kanał

Szczegóły: [Konfiguracja](/gateway/configuration-reference#messages) i dokumentacja kanałów.

## Powiązane

- [Streaming](/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Retry](/concepts/retry) — zachowanie ponownych prób dostarczania wiadomości
- [Queue](/concepts/queue) — kolejka przetwarzania wiadomości
- [Channels](/pl/channels) — integracje z platformami komunikacyjnymi
