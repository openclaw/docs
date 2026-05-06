---
read_when:
    - Wyjaśnianie, jak wiadomości przychodzące stają się odpowiedziami
    - Doprecyzowywanie sesji, trybów kolejkowania lub zachowania przesyłania strumieniowego
    - Dokumentowanie widoczności rozumowania i konsekwencji użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-05-06T09:08:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1cb21bb1ecfb90c91f5117c76378248f846ace16401c226986ab3cca40a3e33
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw obsługuje wiadomości przychodzące przez potok obejmujący rozpoznawanie sesji, kolejkowanie, strumieniowanie, wykonywanie narzędzi i widoczność rozumowania. Ta strona pokazuje ścieżkę od wiadomości przychodzącej do odpowiedzi.

## Przepływ wiadomości (wysoki poziom)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Kluczowe ustawienia znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania w grupach.
- `agents.defaults.*` dla domyślnych ustawień strumieniowania blokowego i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników strumieniowania.

Pełny schemat znajdziesz w sekcji [Konfiguracja](/pl/gateway/configuration).

## Deduplikacja przychodzących wiadomości

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje krótkotrwałą pamięć podręczną kluczowaną według kanału/konta/rozmówcy/sesji/identyfikatora wiadomości, aby zduplikowane dostarczenia nie uruchamiały kolejnego przebiegu agenta.

## Debouncing przychodzących wiadomości

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zebrane w jedną turę agenta przez `messages.inbound`. Debouncing jest zakresowany per kanał + rozmowa i używa najnowszej wiadomości do wątkowania odpowiedzi/identyfikatorów.

Konfiguracja (globalna domyślna + nadpisania per kanał):

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

- Debounce dotyczy wiadomości **wyłącznie tekstowych**; media/załączniki są przepuszczane natychmiast.
- Polecenia kontrolne omijają debouncing, więc pozostają samodzielne — **z wyjątkiem** sytuacji, gdy kanał jawnie włącza scalanie wiadomości DM od tego samego nadawcy (np. [BlueBubbles `coalesceSameSenderDms`](/pl/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), gdzie polecenia DM czekają w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do Gateway, a nie do klientów.

- Czaty bezpośrednie są zwijane do głównego klucza sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypcje znajdują się na hoście Gateway.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich rozmów, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują transkrypcję sesji wspieraną przez Gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to wynik widoczny dla modelu. `details` wyniku narzędzia to metadane runtime używane do renderowania UI, diagnostyki, dostarczania mediów i pluginów.

OpenClaw utrzymuje tę granicę wprost:

- `toolResult.details` jest usuwane przed odtworzeniem u dostawcy i wejściem do Compaction.
- Utrwalone transkrypcje sesji zachowują tylko ograniczone `details`; zbyt duże metadane są zastępowane zwartym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, a nie tylko w `details`.

## Treści przychodzące i kontekst historii

OpenClaw oddziela **treść promptu** od **treści polecenia**:

- `BodyForAgent`: główny tekst widoczny dla modelu dla bieżącej wiadomości. Pluginy kanałów powinny utrzymywać go skupionym na bieżącym tekście nadawcy zawierającym prompt.
- `Body`: starsza rezerwowa treść promptu. Może zawierać koperty kanału i opcjonalne opakowania historii, ale obecne kanały nie powinny polegać na niej jako głównym wejściu modelu, gdy dostępne jest `BodyForAgent`.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grup/kanałów/pokoi) **treść bieżącej wiadomości** jest poprzedzana etykietą nadawcy (w tym samym stylu, którego używają wpisy historii). Dzięki temu wiadomości czasu rzeczywistego oraz kolejkowane/historyczne są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: obejmują wiadomości grupowe, które _nie_ wywołały przebiegu (na przykład wiadomości bramkowane wzmianką) i **wykluczają** wiadomości już znajdujące się w transkrypcji sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, dzięki czemu historia pozostaje nienaruszona. Kanały, które opakowują historię, powinny ustawić `CommandBody` (lub `RawBody`) na oryginalny tekst wiadomości i zachować `Body` jako połączony prompt. Ustrukturyzowana historia, odpowiedź, przekazane dalej wiadomości i metadane kanału są renderowane jako niezaufane bloki kontekstu w roli użytkownika podczas składania promptu.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (globalna wartość domyślna) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub `channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i kontynuacje

Jeśli przebieg jest już aktywny, wiadomości przychodzące mogą być kolejkowane, kierowane do bieżącego przebiegu lub zbierane na potrzeby tury kontynuacyjnej.

- Skonfiguruj przez `messages.queue` (oraz `messages.queue.byChannel`).
- Domyślny tryb to `steer`, z 500 ms debounce dla kontynuacji, gdy kierowanie wraca do dostarczania kolejkowanej kontynuacji.
- Tryby: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` oraz starszy tryb `queue` po jednej wiadomości naraz.

Szczegóły: [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność przebiegu kanału

Pluginy kanałów mogą zachowywać kolejność, stosować debounce wejścia i nakładać backpressure transportu, zanim wiadomość trafi do kolejki sesji. Nie powinny narzucać osobnego limitu czasu wokół samej tury agenta. Gdy wiadomość zostanie skierowana do sesji, długotrwała praca jest zarządzana przez cykl życia sesji, narzędzia i runtime, aby wszystkie kanały spójnie raportowały wolne tury i odzyskiwały po nich działanie.

## Strumieniowanie, dzielenie na fragmenty i grupowanie

Strumieniowanie blokowe wysyła częściowe odpowiedzi, gdy model produkuje bloki tekstu. Dzielenie na fragmenty respektuje limity tekstu kanału i unika rozdzielania ogrodzonych bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie wyłączone)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (podobna do ludzkiej pauza między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Strumieniowanie + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest produkowana przez model.
- Telegram obsługuje strumień rozumowania do tymczasowego dymku szkicu, który jest usuwany po końcowym dostarczeniu; użyj `/reasoning on`, aby uzyskać trwały wynik rozumowania.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksu wychodzącego), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i domyślne ustawienia per kanał

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma również oczekujące media narzędzia, takie jak wygenerowany dźwięk TTS, OpenClaw usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozstrzyga to zachowanie według typu rozmowy:

- Rozmowy bezpośrednie domyślnie nie pozwalają na ciszę i przepisują samą cichą odpowiedź na krótką widoczną odpowiedź rezerwową.
- Grupy/kanały domyślnie pozwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie pozwala na ciszę.

OpenClaw używa także cichych odpowiedzi dla wewnętrznych awarii runnera, które występują przed jakąkolwiek odpowiedzią asystenta w czatach niebezpośrednich, dzięki czemu grupy/kanały nie widzą standardowego tekstu błędu Gateway. Czaty bezpośrednie domyślnie pokazują zwięzły komunikat awarii; surowe szczegóły runnera są pokazywane tylko wtedy, gdy `/verbose` jest `on` lub `full`.

Wartości domyślne znajdują się pod `agents.defaults.silentReply` i `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i `surfaces.<id>.silentReplyRewrite` mogą nadpisać je per powierzchnia.

Gdy sesja nadrzędna ma co najmniej jeden oczekujący przebieg utworzonego subagenta, same ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast przepisywane, więc sesja nadrzędna pozostaje cicha, dopóki zdarzenie ukończenia dziecka nie dostarczy rzeczywistej odpowiedzi.

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy trwały projekt wysyłania i odbierania
- [Strumieniowanie](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami komunikacyjnymi
