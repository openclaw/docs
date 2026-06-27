---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnianie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i implikacji dotyczących użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-06-27T17:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw obsługuje wiadomości przychodzące przez potok obejmujący rozpoznawanie sesji, kolejkowanie, streaming, wykonywanie narzędzi i widoczność rozumowania. Ta strona pokazuje ścieżkę od wiadomości przychodzącej do odpowiedzi.

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
- `agents.defaults.*` dla domyślnych ustawień streamingu bloków i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Pełny schemat znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Deduplikacja wiadomości przychodzących

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje krótkotrwałą pamięć podręczną kluczowaną według kanału/konta/uczestnika/sesji/identyfikatora wiadomości, aby zduplikowane dostarczenia nie uruchamiały kolejnego przebiegu agenta.

## Debouncing wiadomości przychodzących

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zebrane w jedną turę agenta przez `messages.inbound`. Debouncing jest zakresowany per kanał + konwersacja i używa najnowszej wiadomości do wątkowania odpowiedzi/identyfikatorów.

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

- Debounce dotyczy wiadomości **wyłącznie tekstowych**; multimedia/załączniki są opróżniane natychmiast.
- Polecenia sterujące omijają debouncing, aby pozostały samodzielne. Kanały, które jawnie włączają scalanie wiadomości DM od tego samego nadawcy, mogą zachować polecenia DM w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do Gateway, a nie do klientów.

- Czaty bezpośrednie zwijają się do głównego klucza sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypcje znajdują się na hoście Gateway.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich konwersacji, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują transkrypcję sesji opartą na Gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to wynik widoczny dla modelu. `details` wyniku narzędzia to metadane środowiska wykonawczego używane do renderowania interfejsu, diagnostyki, dostarczania multimediów i Pluginów.

OpenClaw zachowuje tę granicę jako jawną:

- `toolResult.details` jest usuwane przed odtworzeniem dla dostawcy i wejściem do Compaction.
- Utrwalone transkrypcje sesji zachowują tylko ograniczone `details`; zbyt duże metadane są zastępowane zwartym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, a nie tylko w `details`.

## Treści wejściowe i kontekst historii

OpenClaw oddziela **treść promptu** od **treści polecenia**:

- `BodyForAgent`: główny tekst bieżącej wiadomości przeznaczony dla modelu. Pluginy kanałów powinny utrzymywać go skupionym na aktualnym tekście nadawcy niosącym prompt.
- `Body`: starszy zapasowy prompt. Może zawierać koperty kanału i opcjonalne opakowania historii, ale obecne kanały nie powinny polegać na nim jako głównym wejściu modelu, gdy dostępne jest `BodyForAgent`.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Dla **czatów niebezpośrednich** (grup/kanałów/pokoi) **treść bieżącej wiadomości** jest poprzedzana etykietą nadawcy (w tym samym stylu, którego używają wpisy historii). Dzięki temu wiadomości czasu rzeczywistego oraz wiadomości z kolejki/historii są spójne w prompcie agenta.

Bufory historii są **wyłącznie oczekujące**: obejmują wiadomości grupowe, które _nie_ wyzwoliły przebiegu (na przykład wiadomości wymagające wzmianki), i **wykluczają** wiadomości już obecne w transkrypcji sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, więc historia pozostaje nienaruszona. Kanały opakowujące historię powinny ustawiać `CommandBody` (lub `RawBody`) na oryginalny tekst wiadomości i zachowywać `Body` jako połączony prompt. Ustrukturyzowana historia, odpowiedzi, przekazane wiadomości i metadane kanału są renderowane podczas składania promptu jako niezaufane bloki kontekstu w roli użytkownika.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (domyślne ustawienie globalne) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub `channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i wiadomości uzupełniające

Jeśli przebieg jest już aktywny, wiadomości przychodzące są domyślnie kierowane do bieżącego przebiegu. `messages.queue` wybiera, czy wiadomości podczas aktywnego przebiegu mają sterować nim, trafiać do kolejki na później, zbierać się w jedną późniejszą turę albo przerywać aktywny przebieg.

- Skonfiguruj przez `messages.queue` (oraz `messages.queue.byChannel`).
- Domyślny tryb to `steer`, z debounce 500 ms dla partii sterowania Codex oraz kolejek followup/collect.
- Tryby: `steer`, `followup`, `collect` i `interrupt`.

Szczegóły: [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność przebiegu kanału

Pluginy kanałów mogą zachowywać kolejność, stosować debounce wejścia i nakładać backpressure transportu, zanim wiadomość trafi do kolejki sesji. Nie powinny narzucać osobnego limitu czasu wokół samej tury agenta. Gdy wiadomość zostanie skierowana do sesji, długotrwała praca jest regulowana przez cykl życia sesji, narzędzia i środowiska wykonawczego, aby wszystkie kanały spójnie raportowały wolne tury i odzyskiwały po nich działanie.

## Streaming, dzielenie na fragmenty i grupowanie

Streaming bloków wysyła częściowe odpowiedzi, gdy model tworzy bloki tekstu.
Dzielenie na fragmenty respektuje limity tekstu kanału i unika rozdzielania bloków kodu w ogrodzeniach.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie wyłączone)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (pauza podobna do ludzkiej między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać albo ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy jest tworzona przez model.
- Telegram obsługuje strumień rozumowania w przejściowym dymku wersji roboczej, który jest usuwany po ostatecznym dostarczeniu; użyj `/reasoning on`, aby uzyskać trwałe wyjście rozumowania.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksów wychodzących), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i domyślne ustawienia per kanał

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny cichy token `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma również oczekujące multimedia narzędzia, takie jak wygenerowany dźwięk TTS, OpenClaw usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozstrzyga to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie nigdy nie otrzymują wskazówek promptu `NO_REPLY`. Jeśli bezpośredni przebieg przypadkowo zwróci sam cichy token, OpenClaw go tłumi zamiast przepisywać lub dostarczać.
- Grupy/kanały domyślnie zezwalają na ciszę tylko dla automatycznych odpowiedzi grupowych. W trybie widocznej odpowiedzi `message_tool` cisza oznacza, że model nie wywołuje `message(action=send)`.
- Wewnętrzna orkiestracja domyślnie zezwala na ciszę.

OpenClaw używa też cichych odpowiedzi dla ogólnych wewnętrznych awarii uruchamiacza w czatach niebezpośrednich, więc grupy/kanały nie widzą standardowego tekstu błędu Gateway.
Sklasyfikowane awarie z tekstem odzyskiwania widocznym dla użytkownika, takie jak brak autoryzacji, limit szybkości lub powiadomienia o przeciążeniu, nadal mogą zostać dostarczone. Czaty bezpośrednie domyślnie pokazują zwięzły tekst awarii; surowe szczegóły uruchamiacza są pokazywane tylko wtedy, gdy włączone jest `/verbose full`.

Ustawienia domyślne znajdują się pod `agents.defaults.silentReply`; `surfaces.<id>.silentReply` może nadpisać politykę grupową/wewnętrzną per powierzchnia.

Same ciche odpowiedzi są odrzucane na wszystkich powierzchniach, więc sesje nadrzędne pozostają ciche zamiast przepisywać tekst znacznika na zapasową pogawędkę.

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy trwały projekt wysyłania i odbierania
- [Streaming](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje platform wiadomości
