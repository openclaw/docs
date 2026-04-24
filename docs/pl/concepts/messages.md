---
read_when:
    - Wyjaśnianie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnianie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i skutków użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-24T09:06:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Ta strona łączy informacje o tym, jak OpenClaw obsługuje wiadomości przychodzące, sesje, kolejkowanie,
strumieniowanie i widoczność rozumowania.

## Przepływ wiadomości (wysoki poziom)

```
Wiadomość przychodząca
  -> routing/bindings -> klucz sesji
  -> kolejka (jeśli uruchomienie jest aktywne)
  -> uruchomienie agenta (strumieniowanie + narzędzia)
  -> odpowiedzi wychodzące (limity kanału + dzielenie na fragmenty)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień strumieniowania blokowego i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników strumieniowania.

Pełny schemat znajdziesz w [Konfiguracja](/pl/gateway/configuration).

## Deduplikacja przychodząca

Kanały mogą ponownie dostarczać tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwałą pamięć podręczną kluczowaną według kanału/konta/peera/sesji/id wiadomości, dzięki czemu zduplikowane
dostarczenia nie wywołują kolejnego uruchomienia agenta.

## Debouncing przychodzący

Szybko następujące po sobie wiadomości od **tego samego nadawcy** mogą zostać zgrupowane w jedną
turę agenta przez `messages.inbound`. Debouncing jest ograniczony do kanału + konwersacji
i używa najnowszej wiadomości do tworzenia wątków/identyfikatorów odpowiedzi.

Konfiguracja (domyślna globalna + nadpisania per channel):

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
- Polecenia sterujące omijają debouncing, dzięki czemu pozostają samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza łączenie DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do Gateway, a nie do klientów.

- Czaty bezpośrednie zapadają się do głównego klucza sesji agenta.
- Grupy/kanały dostają własne klucze sesji.
- Magazyn sesji i transkrypty znajdują się na hoście Gateway.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
konwersacji, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują
transkrypt sesji oparty na Gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesją](/pl/concepts/session).

## Treści przychodzące i kontekst historii

OpenClaw rozdziela **treść promptu** od **treści polecenia**:

- `Body`: tekst promptu wysyłany do agenta. Może zawierać otoczki kanału i
  opcjonalne opakowania historii.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa współdzielonego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grupy/kanały/pokoje) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (w tym samym stylu, co wpisy historii). Dzięki temu wiadomości w czasie rzeczywistym i kolejce/historii
są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: zawierają wiadomości grupowe, które _nie_
wywołały uruchomienia (na przykład wiadomości wymagające wzmianki) i **wykluczają** wiadomości
już obecne w transkrypcie sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, aby historia
pozostała nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości, a `Body` pozostawić jako połączony prompt.
Bufory historii są konfigurowalne przez `messages.groupChat.historyLimit` (globalna
wartość domyślna) oraz nadpisania per channel, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i dalsze wiadomości

Jeśli uruchomienie jest już aktywne, wiadomości przychodzące mogą zostać zakolejkowane, skierowane do
bieżącego uruchomienia albo zebrane do kolejnej tury.

- Konfiguracja przez `messages.queue` (oraz `messages.queue.byChannel`).
- Tryby: `interrupt`, `steer`, `followup`, `collect` oraz warianty backlog.

Szczegóły: [Kolejkowanie](/pl/concepts/queue).

## Strumieniowanie, dzielenie na fragmenty i grupowanie

Strumieniowanie blokowe wysyła częściowe odpowiedzi, gdy model produkuje bloki tekstu.
Dzielenie na fragmenty respektuje limity tekstu kanału i unika rozdzielania ogrodzonych bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (ludzkopodobna pauza między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` steruje widocznością.
- Treść rozumowania nadal liczy się do użycia tokenów, gdy jest produkowana przez model.
- Telegram obsługuje strumieniowanie rozumowania do dymka szkicu.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątki i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` oraz `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), a także `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i wartości domyślne per channel

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
OpenClaw rozstrzyga to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie domyślnie nie pozwalają na ciszę i przepisują gołą cichą
  odpowiedź na krótką widoczną odpowiedź awaryjną.
- Grupy/kanały domyślnie pozwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie pozwala na ciszę.

Wartości domyślne znajdują się pod `agents.defaults.silentReply` oraz
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisywać per surface.

Gdy sesja nadrzędna ma jedno lub więcej oczekujących uruchomień utworzonych podagentów,
gołe ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast być przepisywane, dzięki czemu
sesja nadrzędna pozostaje cicha, dopóki zdarzenie zakończenia potomka nie dostarczy
rzeczywistej odpowiedzi.

## Powiązane

- [Strumieniowanie](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami wiadomości
