---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Doprecyzowywanie sesji, trybów kolejkowania lub zachowania strumieniowania
    - Dokumentowanie widoczności rozumowania i konsekwencji związanych z użyciem
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-05-10T19:32:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw obsługuje wiadomości przychodzące przez potok obejmujący rozwiązywanie sesji, kolejkowanie, streaming, wykonywanie narzędzi i widoczność rozumowania. Ta strona mapuje ścieżkę od wiadomości przychodzącej do odpowiedzi.

## Przepływ wiadomości (wysoki poziom)

```
Wiadomość przychodząca
  -> routing/bindings -> klucz sesji
  -> kolejka (jeśli aktywne jest uruchomienie)
  -> uruchomienie agenta (streaming + narzędzia)
  -> odpowiedzi wychodzące (limity kanału + dzielenie na fragmenty)
```

Kluczowe pokrętła znajdują się w konfiguracji:

- `messages.*` dla prefiksów, kolejkowania i zachowania grup.
- `agents.defaults.*` dla domyślnych ustawień streamingu bloków i dzielenia na fragmenty.
- Nadpisania kanałów (`channels.whatsapp.*`, `channels.telegram.*` itd.) dla limitów i przełączników streamingu.

Pełny schemat znajdziesz w [Konfiguracji](/pl/gateway/configuration).

## Deduplikacja przychodzących wiadomości

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw utrzymuje
krótkotrwałą pamięć podręczną kluczowaną według kanału/konta/peera/sesji/identyfikatora wiadomości, aby zduplikowane
dostarczenia nie uruchamiały kolejnego przebiegu agenta.

## Debouncing wiadomości przychodzących

Szybkie kolejne wiadomości od **tego samego nadawcy** mogą zostać zebrane w jedną
turę agenta przez `messages.inbound`. Debouncing jest ograniczony do kanału + konwersacji
i używa najnowszej wiadomości do wątkowania odpowiedzi/identyfikatorów.

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

- Debounce dotyczy wiadomości **wyłącznie tekstowych**; multimedia/załączniki są opróżniane natychmiast.
- Polecenia sterujące omijają debouncing, więc pozostają samodzielne. Kanały, które jawnie włączą scalanie wiadomości prywatnych od tego samego nadawcy, mogą zachować polecenia DM w oknie debounce, aby ładunek wysłany w częściach mógł dołączyć do tej samej tury agenta.

## Sesje i urządzenia

Sesje należą do Gateway, a nie do klientów.

- Czaty bezpośrednie zwijają się do głównego klucza sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypty znajdują się na hoście Gateway.

Wiele urządzeń/kanałów może mapować się na tę samą sesję, ale historia nie jest w pełni
synchronizowana z powrotem do każdego klienta. Zalecenie: używaj jednego głównego urządzenia do długich
konwersacji, aby uniknąć rozbieżnego kontekstu. Control UI i TUI zawsze pokazują
transkrypt sesji wspierany przez Gateway, więc są źródłem prawdy.

Szczegóły: [Zarządzanie sesją](/pl/concepts/session).

## Metadane wyników narzędzi

`content` wyniku narzędzia to wynik widoczny dla modelu. `details` wyniku narzędzia to
metadane runtime do renderowania UI, diagnostyki, dostarczania multimediów i pluginów.

OpenClaw utrzymuje tę granicę jawnie:

- `toolResult.details` jest usuwane przed ponownym odtworzeniem u dostawcy i wejściem do compaction.
- Utrwalone transkrypty sesji zachowują tylko ograniczone `details`; zbyt duże metadane
  są zastępowane zwartym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi przeczytać, w `content`, nie tylko
  w `details`.

## Treści przychodzące i kontekst historii

OpenClaw oddziela **treść promptu** od **treści polecenia**:

- `BodyForAgent`: główny tekst widoczny dla modelu dla bieżącej wiadomości. Pluginy
  kanałów powinny utrzymywać go skupionym na bieżącym tekście nadawcy niosącym prompt.
- `Body`: starsza rezerwowa treść promptu. Może zawierać koperty kanału i
  opcjonalne opakowania historii, ale obecne kanały nie powinny polegać na niej jako na
  głównym wejściu modelu, gdy dostępne jest `BodyForAgent`.
- `CommandBody`: surowy tekst użytkownika do parsowania dyrektyw/poleceń.
- `RawBody`: starszy alias dla `CommandBody` (zachowany dla zgodności).

Gdy kanał dostarcza historię, używa wspólnego opakowania:

- `[Wiadomości czatu od Twojej ostatniej odpowiedzi - dla kontekstu]`
- `[Bieżąca wiadomość - odpowiedz na nią]`

Dla **czatów innych niż bezpośrednie** (grupy/kanały/pokoje) **treść bieżącej wiadomości** jest poprzedzana
etykietą nadawcy (ten sam styl, którego używają wpisy historii). Dzięki temu wiadomości w czasie rzeczywistym oraz kolejkowane/historyczne
są spójne w prompcie agenta.

Bufory historii są **tylko oczekujące**: obejmują wiadomości grupowe, które _nie_
wywołały uruchomienia (na przykład wiadomości bramkowane wzmianką), i **wykluczają** wiadomości
już obecne w transkrypcie sesji.

Usuwanie dyrektyw dotyczy tylko sekcji **bieżącej wiadomości**, więc historia
pozostaje nienaruszona. Kanały opakowujące historię powinny ustawiać `CommandBody` (lub
`RawBody`) na oryginalny tekst wiadomości i zachowywać `Body` jako połączony prompt.
Ustrukturyzowana historia, odpowiedź, wiadomości przekazane dalej i metadane kanału są renderowane jako
bloki niezaufanego kontekstu roli użytkownika podczas składania promptu.
Bufory historii można konfigurować przez `messages.groupChat.historyLimit` (globalna
wartość domyślna) oraz nadpisania per kanał, takie jak `channels.slack.historyLimit` lub
`channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Kolejkowanie i follow-upy

Jeśli uruchomienie jest już aktywne, wiadomości przychodzące mogą być kolejkowane, kierowane do
bieżącego uruchomienia albo zbierane do tury follow-up.

- Skonfiguruj przez `messages.queue` (oraz `messages.queue.byChannel`).
- Domyślny tryb to `steer`, z 500 ms debounce dla follow-up, gdy sterowanie przechodzi
  awaryjnie na dostarczenie kolejkowanego follow-upu.
- Tryby: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` oraz
  starszy tryb `queue` obsługujący po jednej wiadomości naraz.

Szczegóły: [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność uruchomienia kanału

Pluginy kanałów mogą zachowywać kolejność, stosować debounce wejścia i nakładać
presję wsteczną transportu, zanim wiadomość trafi do kolejki sesji. Nie powinny nakładać
osobnego limitu czasu wokół samej tury agenta. Gdy wiadomość zostanie skierowana do
sesji, długotrwała praca jest zarządzana przez cykl życia sesji, narzędzia i runtime,
aby wszystkie kanały spójnie raportowały powolne tury i odzyskiwały po nich działanie.

## Streaming, dzielenie na fragmenty i wsadowanie

Streaming bloków wysyła częściowe odpowiedzi w miarę, jak model tworzy bloki tekstu.
Dzielenie na fragmenty respektuje limity tekstowe kanału i unika rozdzielania ogrodzonych bloków kodu.

Kluczowe ustawienia:

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie wyłączone)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (wsadowanie oparte na bezczynności)
- `agents.defaults.humanDelay` (ludzka pauza między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.blockStreaming` i `*.blockStreamingCoalesce` (kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`)

Szczegóły: [Streaming + dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

OpenClaw może ujawniać lub ukrywać rozumowanie modelu:

- `/reasoning on|off|stream` kontroluje widoczność.
- Treść rozumowania nadal wlicza się do zużycia tokenów, gdy jest generowana przez model.
- Telegram obsługuje strumień rozumowania do tymczasowego dymka szkicu, który jest usuwany po finalnym dostarczeniu; użyj `/reasoning on`, aby uzyskać trwałe wyjście rozumowania.

Szczegóły: [Dyrektywy myślenia + rozumowania](/pl/tools/thinking) i [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątkowanie i odpowiedzi

Formatowanie wiadomości wychodzących jest scentralizowane w `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` i `channels.<channel>.accounts.<id>.responsePrefix` (kaskada prefiksu wychodzącego), plus `channels.whatsapp.messagePrefix` (prefiks przychodzący WhatsApp)
- Wątkowanie odpowiedzi przez `replyToMode` i domyślne ustawienia per kanał

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Dokładny token ciszy `NO_REPLY` / `no_reply` oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”.
Gdy tura ma także oczekujące multimedia narzędzia, takie jak wygenerowany dźwięk TTS, OpenClaw
usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.
OpenClaw rozstrzyga to zachowanie według typu konwersacji:

- Konwersacje bezpośrednie domyślnie nie zezwalają na ciszę i przepisują samą cichą
  odpowiedź na krótką widoczną odpowiedź zastępczą.
- Grupy/kanały domyślnie zezwalają na ciszę.
- Wewnętrzna orkiestracja domyślnie zezwala na ciszę.

OpenClaw używa też cichych odpowiedzi dla wewnętrznych awarii runnera, które występują
przed jakąkolwiek odpowiedzią asystenta w czatach innych niż bezpośrednie, aby grupy/kanały nie widziały
standardowego tekstu błędu Gateway. Czaty bezpośrednie domyślnie pokazują zwięzły komunikat awarii;
surowe szczegóły runnera są pokazywane tylko wtedy, gdy `/verbose` ma wartość `on` lub `full`.

Wartości domyślne znajdują się pod `agents.defaults.silentReply` i
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` i
`surfaces.<id>.silentReplyRewrite` mogą nadpisać je dla powierzchni.

Gdy sesja nadrzędna ma co najmniej jedno oczekujące uruchomienie utworzonego subagenta, same
ciche odpowiedzi są odrzucane na wszystkich powierzchniach zamiast przepisywania, więc
rodzic pozostaje cichy, dopóki zdarzenie ukończenia dziecka nie dostarczy prawdziwej odpowiedzi.

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy trwały projekt wysyłania i odbierania
- [Streaming](/pl/concepts/streaming) — dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) — zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) — kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) — integracje z platformami wiadomości
