---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Doprecyzowywanie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i konsekwencji użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-30T09:48:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw obsługuje wiadomości przychodzące przez potok rozwiązywania sesji, kolejkowania, streamingu, wykonywania narzędzi oraz widoczności rozumowania. Ta strona pokazuje ścieżkę od wiadomości przychodzącej do odpowiedzi.

## Przepływ wiadomości (ogólnie)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień streamingu blokowego i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Pełny schemat znajdziesz w sekcji [Konfiguracja](/pl/gateway/configuration).

## Deduplikacja przychodzących wiadomości

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwałą pamięć podręczną kluczowaną według kanału/konta/rozmówcy/sesji/identyfikatora wiadomości, aby zduplikowane
dostarczenia nie uruchamiały kolejnego przebiegu agenta.

## Debouncing przychodzących wiadomości

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zebrane w jedną
turę agenta przez `messages.inbound`. Debouncing jest ograniczony do kanału + konwersacji
i używa najnowszej wiadomości do wątkowania/identyfikatorów odpowiedzi.

Konfiguracja (globalna wartość domyślna + nadpisania per kanał):

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

- Debounce dotyczy wiadomości **wyłącznie tekstowych**; media/załączniki są opróżniane natychmiast.
- Polecenia kontrolne omijają debouncing, więc pozostają samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza scalanie DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do gatewaya, nie do klientów.

- Czaty bezpośrednie są zwijane do głównego klucza sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypty znajdują się na hoście gatewaya.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
konwersacji, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują
transkrypt sesji wspierany przez gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to rezultat widoczny dla modelu. `details` wyniku narzędzia to
metadane środowiska uruchomieniowego do renderowania UI, diagnostyki, dostarczania mediów i pluginów.

OpenClaw utrzymuje tę granicę jawnie:

- `toolResult.details` jest usuwane przed ponownym odtworzeniem przez providera i wejściem do Compaction.
- Utrwalone transkrypty sesji zachowują tylko ograniczone `details`; zbyt duże metadane
  są zastępowane zwartym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, nie tylko
  w `details`.

## Treści przychodzące i kontekst historii

OpenClaw oddziela **treść promptu** od **treści polecenia**:

- `Body`: tekst promptu wysyłany do agenta. Może zawierać koperty kanału i
  opcjonalne opakowania historii.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla kompatybilności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grup/kanałów/pokoi) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (w tym samym stylu, który jest używany dla wpisów historii). Dzięki temu wiadomości w czasie rzeczywistym oraz
kolejkowane/z historii są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: zawierają wiadomości grupowe, które _nie_
uruchomiły przebiegu (na przykład wiadomości bramkowane wzmianką), i **wykluczają** wiadomości
już obecne w transkrypcie sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, więc historia
pozostaje nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i zachowywać `Body` jako połączony prompt.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (globalna
wartość domyślna) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i działania następcze

Jeśli przebieg jest już aktywny, wiadomości przychodzące mogą zostać zakolejkowane, skierowane do
bieżącego przebiegu albo zebrane na turę następczą.

- Konfiguruj przez `messages.queue` (oraz `messages.queue.byChannel`).
- Tryb domyślny to `steer`, z 500 ms debounce dla działań następczych, gdy sterowanie wraca
  do dostarczania zakolejkowanych działań następczych.
- Tryby: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` oraz
  starszy tryb `queue` obsługujący jedną wiadomość naraz.

Szczegóły: [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność przebiegów kanałów

Pluginy kanałów mogą zachowywać kolejność, stosować debounce wejścia i nakładać transportowe
backpressure, zanim wiadomość trafi do kolejki sesji. Nie powinny narzucać
oddzielnego limitu czasu wokół samej tury agenta. Gdy wiadomość zostanie skierowana do
sesji, długotrwała praca jest zarządzana przez cykl życia sesji, narzędzia i środowiska uruchomieniowego,
dzięki czemu wszystkie kanały spójnie raportują powolne tury i odzyskują po nich działanie.

## Streaming, dzielenie na fragmenty i grupowanie

Streaming blokowy wysyła częściowe odpowiedzi, gdy model tworzy bloki tekstu.
Dzielenie na fragmenty respektuje limity tekstu kanału i unika dzielenia bloków kodu ogrodzonych znacznikami.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie wyłączone)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (pauza podobna do ludzkiej między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest wytwarzana przez model.
- Telegram obsługuje strumień rozumowania do dymku wersji roboczej.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i domyślne ustawienia per kanał

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma także oczekujące media z narzędzia, takie jak wygenerowany dźwięk TTS, OpenClaw
usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozwiązuje to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie domyślnie nie zezwalają na ciszę i przepisują samą cichą
  odpowiedź na krótką widoczną odpowiedź awaryjną.
- Grupy/kanały domyślnie zezwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie zezwala na ciszę.

OpenClaw używa też cichych odpowiedzi dla wewnętrznych błędów runnera, które występują
przed jakąkolwiek odpowiedzią asystenta w czatach niebezpośrednich, dzięki czemu grupy/kanały nie widzą
standardowego tekstu błędu gatewaya. Czaty bezpośrednie domyślnie pokazują zwięzły tekst awarii;
surowe szczegóły runnera są pokazywane tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.

Wartości domyślne znajdują się pod `agents.defaults.silentReply` i
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisać per powierzchnia.

Gdy sesja nadrzędna ma co najmniej jeden oczekujący uruchomiony przebieg podagenta, same
ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast przepisywane, więc
sesja nadrzędna pozostaje cicha, dopóki zdarzenie ukończenia dziecka nie dostarczy właściwej odpowiedzi.

## Powiązane

- [Streaming](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami komunikacyjnymi
