---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Doprecyzowanie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i konsekwencji użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-05-04T07:03:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15242e21fd17a9f2013561003e108d197204d834caf51bbcdc53ffb3f118b14f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw obsługuje wiadomości przychodzące przez potok obejmujący rozpoznawanie sesji, kolejkowanie, streaming, wykonywanie narzędzi i widoczność rozumowania. Ta strona pokazuje ścieżkę od wiadomości przychodzącej do odpowiedzi.

## Przepływ wiadomości (wysoki poziom)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Kluczowe pokrętła znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień streamingu blokowego i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Pełny schemat znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Deduplikacja przychodzących wiadomości

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwały cache z kluczem opartym o kanał/konto/rozmówcę/sesję/identyfikator wiadomości, aby zduplikowane
dostarczenia nie uruchamiały kolejnego przebiegu agenta.

## Debouncing przychodzących wiadomości

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zebrane w jedną
turę agenta przez `messages.inbound`. Debouncing jest zakresowany na kanał + konwersację
i używa najnowszej wiadomości do wątkowania/identyfikatorów odpowiedzi.

Konfiguracja (globalna wartość domyślna + nadpisania dla kanałów):

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

- Debounce dotyczy wiadomości **tylko tekstowych**; media/załączniki są wysyłane natychmiast.
- Polecenia sterujące omijają debouncing, aby pozostały samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza łączenie DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby podzielony payload wysyłki mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje są własnością Gateway, a nie klientów.

- Czaty bezpośrednie są zwijane do głównego klucza sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypty znajdują się na hoście Gateway.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
konwersacji, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują
transkrypt sesji oparty na Gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to wynik widoczny dla modelu. `details` wyniku narzędzia to
metadane runtime do renderowania UI, diagnostyki, dostarczania mediów i Pluginów.

OpenClaw utrzymuje tę granicę jawnie:

- `toolResult.details` jest usuwane przed odtworzeniem przez dostawcę i wejściem Compaction.
- Utrwalone transkrypty sesji przechowują tylko ograniczone `details`; zbyt duże metadane
  są zastępowane zwięzłym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, a nie tylko
  w `details`.

## Treści przychodzące i kontekst historii

OpenClaw oddziela **treść promptu** od **treści polecenia**:

- `BodyForAgent`: główny tekst bieżącej wiadomości skierowany do modelu. Pluginy
  kanałów powinny utrzymywać go skupionym na bieżącym tekście nadawcy niosącym prompt.
- `Body`: starsza rezerwowa treść promptu. Może obejmować koperty kanału i
  opcjonalne opakowania historii, ale bieżące kanały nie powinny polegać na niej jako na
  głównym wejściu modelu, gdy dostępne jest `BodyForAgent`.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grup/kanałów/pokoi) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (tym samym stylem, który jest używany dla wpisów historii). Dzięki temu wiadomości
w czasie rzeczywistym oraz wiadomości z kolejki/historii są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: obejmują wiadomości grupowe, które _nie_
wywołały przebiegu (na przykład wiadomości ograniczone wzmianką), i **wykluczają** wiadomości,
które już znajdują się w transkrypcie sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, więc historia
pozostaje nienaruszona. Kanały, które opakowują historię, powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i utrzymywać `Body` jako połączony prompt.
Ustrukturyzowana historia, odpowiedź, przekazane dalej wiadomości i metadane kanału są renderowane jako
bloki niezaufanego kontekstu roli użytkownika podczas składania promptu.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (globalna
wartość domyślna) oraz nadpisania dla kanałów, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i kontynuacje

Jeśli przebieg jest już aktywny, wiadomości przychodzące mogą zostać zakolejkowane, skierowane do
bieżącego przebiegu albo zebrane na turę kontynuacji.

- Skonfiguruj przez `messages.queue` (oraz `messages.queue.byChannel`).
- Domyślny tryb to `steer`, z 500 ms debounce dla kontynuacji, gdy sterowanie wraca
  do zakolejkowanego dostarczania kontynuacji.
- Tryby: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` oraz
  starszy tryb `queue` obsługujący jedną wiadomość naraz.

Szczegóły: [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność przebiegu kanału

Pluginy kanałów mogą zachowywać kolejność, stosować debounce wejścia i nakładać transportowe
ograniczanie zwrotne, zanim wiadomość trafi do kolejki sesji. Nie powinny nakładać
osobnego timeoutu wokół samej tury agenta. Gdy wiadomość zostanie skierowana do
sesji, długotrwałą pracą zarządzają cykl życia sesji, narzędzi i runtime,
aby wszystkie kanały raportowały powolne tury i odzyskiwały się po nich spójnie.

## Streaming, dzielenie na fragmenty i grupowanie

Streaming blokowy wysyła częściowe odpowiedzi, gdy model tworzy bloki tekstu.
Dzielenie na fragmenty respektuje limity tekstu kanału i unika rozdzielania ogrodzonych bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (ludzka pauza między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest generowana przez model.
- Telegram obsługuje streaming rozumowania do przejściowego dymka szkicu, który jest usuwany po końcowym dostarczeniu; użyj `/reasoning on` dla trwałego wyjścia rozumowania.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i wartości domyślne kanałów

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma też oczekujące media narzędzia, takie jak wygenerowany dźwięk TTS, OpenClaw
usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozstrzyga to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie domyślnie nie pozwalają na ciszę i przepisują samą cichą
  odpowiedź na krótką widoczną odpowiedź rezerwową.
- Grupy/kanały domyślnie pozwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie pozwala na ciszę.

OpenClaw używa też cichych odpowiedzi dla wewnętrznych awarii runnera, które występują
przed jakąkolwiek odpowiedzią asystenta w czatach niebezpośrednich, aby grupy/kanały nie widziały
szablonowego błędu Gateway. Czaty bezpośrednie domyślnie pokazują zwięzły komunikat awarii;
surowe szczegóły runnera są pokazywane tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.

Wartości domyślne znajdują się pod `agents.defaults.silentReply` i
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą je nadpisać dla poszczególnych powierzchni.

Gdy sesja nadrzędna ma co najmniej jeden oczekujący uruchomiony przebieg subagenta, same
ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast przepisywania, dzięki czemu
sesja nadrzędna pozostaje cicha do czasu, aż zdarzenie ukończenia dziecka dostarczy właściwą odpowiedź.

## Powiązane

- [Streaming](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami komunikacyjnymi
