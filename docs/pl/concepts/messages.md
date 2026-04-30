---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnianie sesji, trybów kolejkowania lub zachowania przesyłania strumieniowego
    - Dokumentowanie widoczności rozumowania i implikacji dotyczących użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-04-30T16:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw obsługuje wiadomości przychodzące przez potok rozpoznawania sesji, kolejkowania, streamingu, wykonywania narzędzi i widoczności rozumowania. Ta strona mapuje ścieżkę od wiadomości przychodzącej do odpowiedzi.

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
- `agents.defaults.*` dla domyślnych ustawień streamingu blokowego i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Zobacz [Konfiguracja](/pl/gateway/configuration), aby poznać pełny schemat.

## Deduplikacja przychodzących wiadomości

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwałą pamięć podręczną kluczowaną według kanału/konta/peera/sesji/identyfikatora wiadomości, dzięki czemu zduplikowane
dostarczenia nie uruchamiają kolejnego przebiegu agenta.

## Debouncing przychodzących wiadomości

Szybkie kolejne wiadomości od **tego samego nadawcy** można zgrupować w jedną
turę agenta za pomocą `messages.inbound`. Debouncing jest ograniczony do kanału + konwersacji
i używa najnowszej wiadomości do wątkowania odpowiedzi/identyfikatorów.

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

- Debounce stosuje się do wiadomości **tylko tekstowych**; multimedia/załączniki opróżniają bufor natychmiast.
- Komendy sterujące omijają debouncing, aby pozostawały samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza scalanie DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie komendy DM czekają w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do gatewaya, a nie do klientów.

- Czaty bezpośrednie zwijają się do głównego klucza sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypty znajdują się na hoście gatewaya.

Wiele urządzeń/kanałów może mapować na tę samą sesję, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
konwersacji, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują
transkrypt sesji obsługiwany przez gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to wynik widoczny dla modelu. `details` wyniku narzędzia to
metadane runtime do renderowania UI, diagnostyki, dostarczania multimediów i pluginów.

OpenClaw utrzymuje tę granicę jako jawną:

- `toolResult.details` jest usuwane przed ponownym odtworzeniem u providera i wejściem do compaction.
- Utrwalone transkrypty sesji przechowują tylko ograniczone `details`; zbyt duże metadane
  są zastępowane zwartym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, nie tylko
  w `details`.

## Treści przychodzące i kontekst historii

OpenClaw oddziela **treść promptu** od **treści komendy**:

- `BodyForAgent`: podstawowy tekst dla bieżącej wiadomości przeznaczony dla modelu. Pluginy
  kanałów powinny utrzymywać go skupionym na bieżącym tekście nadawcy niosącym prompt.
- `Body`: starszy fallback promptu. Może zawierać koperty kanału i
  opcjonalne opakowania historii, ale bieżące kanały nie powinny polegać na nim jako
  podstawowym wejściu modelu, gdy dostępne jest `BodyForAgent`.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/komend.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla kompatybilności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

W przypadku **czatów niebezpośrednich** (grup/kanałów/pokoi) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (w tym samym stylu, którego używają wpisy historii). Dzięki temu wiadomości
czasu rzeczywistego i kolejkowane/historyczne pozostają spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: obejmują wiadomości grupowe, które _nie_
uruchomiły przebiegu (na przykład wiadomości bramkowane wzmianką) i **wykluczają** wiadomości
już znajdujące się w transkrypcie sesji.

Usuwanie dyrektyw stosuje się tylko do sekcji **bieżącej wiadomości**, aby historia
pozostała nienaruszona. Kanały, które opakowują historię, powinny ustawić `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i zachować `Body` jako połączony prompt.
Ustrukturyzowana historia, odpowiedzi, przekazane wiadomości i metadane kanału są renderowane jako
bloki niezaufanego kontekstu w roli użytkownika podczas składania promptu.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (globalna
wartość domyślna) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i followupy

Jeśli przebieg jest już aktywny, wiadomości przychodzące mogą być kolejkowane, kierowane do
bieżącego przebiegu albo zbierane do tury followup.

- Konfiguracja przez `messages.queue` (i `messages.queue.byChannel`).
- Tryb domyślny to `steer`, z debounce followupu 500 ms, gdy sterowanie wraca
  do kolejkowanego dostarczenia followupu.
- Tryby: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` oraz
  starszy tryb `queue` obsługujący jedną wiadomość naraz.

Szczegóły: [Kolejka komend](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność przebiegu kanału

Pluginy kanałów mogą zachowywać kolejność, stosować debounce wejścia i nakładać transportowy
backpressure, zanim wiadomość trafi do kolejki sesji. Nie powinny narzucać
osobnego timeoutu wokół samej tury agenta. Gdy wiadomość zostanie przekierowana do
sesji, długotrwała praca jest zarządzana przez cykl życia sesji, narzędzia i runtime,
dzięki czemu wszystkie kanały raportują wolne tury i odzyskują po nich działanie spójnie.

## Streaming, dzielenie na fragmenty i grupowanie

Streaming blokowy wysyła częściowe odpowiedzi, gdy model tworzy bloki tekstu.
Dzielenie na fragmenty respektuje limity tekstu kanału i unika dzielenia bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (ludzka pauza między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może pokazywać albo ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest tworzona przez model.
- Telegram obsługuje strumień rozumowania w dymku wersji roboczej.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i wartości domyślne per kanał

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny token ciszy `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma także oczekujące multimedia narzędzi, takie jak wygenerowany dźwięk TTS, OpenClaw
usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozstrzyga to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie domyślnie nie zezwalają na ciszę i przepisują samą cichą
  odpowiedź na krótką widoczną odpowiedź fallback.
- Grupy/kanały domyślnie zezwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie zezwala na ciszę.

OpenClaw używa także cichych odpowiedzi przy wewnętrznych awariach runnera, które występują
przed jakąkolwiek odpowiedzią asystenta w czatach niebezpośrednich, aby grupy/kanały nie widziały
szablonowego błędu gatewaya. Czaty bezpośrednie domyślnie pokazują zwięzłą treść awarii;
surowe szczegóły runnera są pokazywane tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.

Wartości domyślne znajdują się pod `agents.defaults.silentReply` i
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisać per powierzchnia.

Gdy sesja nadrzędna ma co najmniej jeden oczekujący uruchomiony przebieg podagenta, same
ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast przepisywania, więc
sesja nadrzędna pozostaje cicha, dopóki zdarzenie ukończenia dziecka nie dostarczy właściwej odpowiedzi.

## Powiązane

- [Streaming](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponów](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami wiadomości
