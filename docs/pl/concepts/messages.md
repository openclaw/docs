---
read_when:
    - Wyjaśnienie, jak wiadomości przychodzące stają się odpowiedziami
    - Wyjaśnianie sesji, trybów kolejkowania lub działania przesyłania strumieniowego
    - Dokumentowanie widoczności rozumowania i konsekwencji dotyczących użycia
summary: Przepływ wiadomości, sesje, kolejkowanie i widoczność toku rozumowania
title: Wiadomości
x-i18n:
    generated_at: "2026-07-16T18:20:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Wiadomości przychodzące przechodzą przez routing, deduplikację/debounce, uruchomienie agenta i dostarczenie wychodzące:

```text
Wiadomość przychodząca
  -> routing/powiązania -> klucz sesji
  -> deduplikacja + debounce
  -> kolejka (jeśli uruchomienie jest już aktywne)
  -> uruchomienie agenta (strumieniowanie + narzędzia)
  -> odpowiedzi wychodzące (limity kanału + dzielenie na fragmenty)
```

Kluczowe obszary konfiguracji:

- `messages.*` dla prefiksów, kolejkowania, debounce wiadomości przychodzących i zachowania grup.
- `agents.defaults.*` dla strumieniowania blokowego, dzielenia na fragmenty i domyślnych ustawień cichych odpowiedzi.
- Nadpisania kanałów (`channels.telegram.*`, `channels.whatsapp.*` itd.) dla limitów poszczególnych kanałów i przełączników strumieniowania.

Pełny schemat opisano w sekcji [Konfiguracja](/pl/gateway/configuration).

## Deduplikacja wiadomości przychodzących

Kanały mogą ponownie dostarczyć tę samą wiadomość po ponownym połączeniu. OpenClaw przechowuje pamięci podręczną w pamięci operacyjnej, indeksowaną według zakresu agenta, trasy kanału (kanał + rozmówca + konto + wątek) oraz identyfikatora wiadomości, dzięki czemu ponownie dostarczona wiadomość nie uruchamia agenta po raz drugi. Wpis pamięci podręcznej wygasa po 20 minutach lub po osiągnięciu 5000 śledzonych wpisów, zależnie od tego, co nastąpi wcześniej.

## Debounce wiadomości przychodzących

Szybko następujące po sobie wiadomości tekstowe od tego samego nadawcy można połączyć w jedną turę agenta za pomocą `messages.inbound`. Debounce działa w zakresie kanału + konwersacji i używa najnowszej wiadomości do tworzenia wątku odpowiedzi i identyfikatorów.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- Debounce dotyczy wyłącznie wiadomości tekstowych; multimedia i załączniki powodują natychmiastowe opróżnienie bufora.
- Polecenia sterujące (stop/abort/status itd.) omijają debounce, dzięki czemu są przekazywane natychmiast.
- Domyślnie wyłączone: `messages.inbound.debounceMs` nie ma wbudowanej wartości domyślnej, więc debounce jest aktywowany dopiero po jego ustawieniu (globalnie lub dla kanału).
- Opcjonalne ustawienie `coalesceSameSenderDms` w iMessage jest jedynym wyjątkiem: wstrzymuje wszystkie wiadomości tekstowe DM od tego samego nadawcy (w tym polecenia) wystarczająco długo, aby rozdzielone przez Apple wysłanie polecenia i adresu URL dotarło jako jedna tura. Czaty grupowe są zawsze przekazywane natychmiast, niezależnie od tego ustawienia.

## Sesje i urządzenia

Sesje należą do Gateway, a nie do klientów.

- Czaty bezpośrednie są łączone w główny klucz sesji agenta.
- Grupy/kanały otrzymują własne klucze sesji.
- Magazyn sesji i transkrypcje znajdują się na hoście Gateway.

Wiele urządzeń/kanałów może być mapowanych na tę samą sesję, ale historia nie jest w pełni synchronizowana z każdym klientem. W przypadku długich rozmów należy używać jednego głównego urządzenia, aby uniknąć rozbieżnego kontekstu. Interfejs Control UI i TUI zawsze pokazują transkrypcję sesji opartą na Gateway, dlatego stanowią źródło prawdy.

Szczegóły: [Zarządzanie sesjami](/pl/concepts/session).

## Treść promptów i kontekst historii

Pluginy kanałów wypełniają kilka pól tekstowych w kontekście wiadomości przychodzącej, od najbardziej do najmniej preferowanego:

| Pole             | Przeznaczenie                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Tekst bieżącej tury przeznaczony dla modelu. Gdy nie ustawiono, używane jest `CommandBody` / `RawBody` / `Body`.        |
| `BodyForCommands` | Czysty tekst używany do analizowania dyrektyw/poleceń. Gdy nie ustawiono, używane jest `CommandBody` / `RawBody` / `Body`. |
| `CommandBody`     | Starsza pośrednia treść; preferowane jest `BodyForCommands`.                                                         |
| `RawBody`         | Przestarzały alias dla `CommandBody`.                                                                         |
| `Body`            | Starsza treść promptu; może zawierać koperty kanału i opakowania historii.                                     |

Gdy kanał dostarcza historię, otacza ją następującymi elementami:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

W przypadku czatów innych niż bezpośrednie (grup/kanałów/pokoi) treść bieżącej wiadomości jest poprzedzana etykietą nadawcy, zgodnie ze stylem wpisów historii. Usuwanie dyrektyw dotyczy wyłącznie sekcji bieżącej wiadomości, więc historia pozostaje nienaruszona. Kanały opakowujące historię powinny ustawiać `BodyForCommands` (lub starsze `CommandBody` / `RawBody`) na oryginalny tekst wiadomości i zachować połączony prompt w `Body`.

Bufory historii obejmują wyłącznie oczekujące wiadomości: zawierają wiadomości grupowe, które nie wywołały uruchomienia (na przykład wiadomości wymagające wzmianki), i wykluczają wiadomości znajdujące się już w transkrypcji sesji. Ustrukturyzowana historia, odpowiedzi, przekazane wiadomości i metadane kanałów są podczas składania promptu renderowane jako niezaufane bloki kontekstu roli użytkownika.

Rozmiar historii konfiguruje się za pomocą `messages.groupChat.historyLimit` (globalna wartość domyślna) lub nadpisań dla poszczególnych kanałów, takich jak `channels.slack.historyLimit` i `channels.telegram.accounts.<id>.historyLimit` (ustaw `0`, aby wyłączyć).

## Metadane wyników narzędzi

`content` wyniku narzędzia jest wynikiem widocznym dla modelu; `details` to metadane środowiska wykonawczego używane do renderowania interfejsu, diagnostyki, dostarczania multimediów i obsługi pluginów.

- `toolResult.details` jest usuwane przed ponownym odtworzeniem u dostawcy i przed przekazaniem danych wejściowych do Compaction.
- Utrwalone transkrypcje sesji zachowują tylko ograniczone `details`; zbyt duże metadane są zastępowane zwięzłym podsumowaniem oznaczonym `persistedDetailsTruncated: true`.
- Pluginy i narzędzia powinny umieszczać tekst, który model musi odczytać, w `content`, a nie wyłącznie w `details`.

## Kolejkowanie i wiadomości uzupełniające

Gdy uruchomienie jest już aktywne, wiadomości przychodzące są domyślnie kierowane do niego. `messages.queue` steruje trybem:

| Tryb              | Zachowanie                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (domyślnie) | Wstrzykuje nowy prompt do aktywnego uruchomienia.          |
| `followup`        | Uruchamia wiadomość po zakończeniu aktywnego uruchomienia.      |
| `collect`         | Łączy zgodne wiadomości w jedną późniejszą turę.      |
| `interrupt`       | Przerywa aktywne uruchomienie, a następnie rozpoczyna najnowszy prompt. |

Wartości domyślne: `messages.queue.debounceMs` wynosi 500ms (dotyczy jednakowo kierowania, wiadomości uzupełniających i grupowania), `messages.queue.cap` wynosi 20 wiadomości w kolejce, a `messages.queue.drop` to `summarize` (dostępne są również `old` i `new`). Nadpisania dla poszczególnych kanałów konfiguruje się za pomocą `messages.queue.byChannel` i `messages.queue.debounceMsByChannel`.

Szczegóły: [Kolejka poleceń](/pl/concepts/queue) i [Kolejka sterowania](/pl/concepts/queue-steering).

## Własność uruchomienia kanału

Pluginy kanałów mogą zachowywać kolejność, stosować debounce danych wejściowych i wymuszać przeciwciśnienie transportu, zanim wiadomość trafi do kolejki sesji. Nie powinny nakładać osobnego limitu czasu na samą turę agenta. Po skierowaniu wiadomości do sesji cykle życia sesji, narzędzi i środowiska wykonawczego zarządzają długotrwałą pracą, dzięki czemu wszystkie kanały spójnie raportują powolne tury i odzyskują po nich sprawność.

## Strumieniowanie, dzielenie na fragmenty i grupowanie

Strumieniowanie blokowe wysyła częściowe odpowiedzi w miarę generowania bloków tekstu przez model; dzielenie na fragmenty respektuje limity tekstu kanału i unika rozdzielania bloków kodu ograniczonych znacznikami.

- `agents.defaults.blockStreamingDefault` (`on|off`, domyślnie `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (grupowanie na podstawie bezczynności)
- `agents.defaults.humanDelay` (przerwa przypominająca ludzką między odpowiedziami blokowymi)
- Nadpisania kanałów: `*.streaming.block.enabled` i `*.streaming.block.coalesce` w dołączonych kanałach; nieaktualne płaskie klucze są migrowane przez `openclaw doctor --fix`. Strumieniowanie blokowe jest wyłączone, chyba że zostanie jawnie włączone — na każdym kanale, w tym Telegram. QQ Bot stanowi wyjątek: nie ma kluczy `streaming.block` i strumieniuje odpowiedzi blokowe, chyba że `channels.qqbot.streaming.mode` ma wartość `"off"`.

Szczegóły: [Strumieniowanie i dzielenie na fragmenty](/pl/concepts/streaming).

## Widoczność rozumowania i tokeny

- `/reasoning on|off|stream` steruje widocznością.
- Treść rozumowania nadal wlicza się do użycia tokenów, gdy model ją generuje.
- Telegram obsługuje strumieniowanie rozumowania do tymczasowego dymka wersji roboczej, który jest usuwany po ostatecznym dostarczeniu; aby uzyskać trwałe dane wyjściowe rozumowania, należy użyć `/reasoning on`.

Szczegóły: [Dyrektywy myślenia i rozumowania](/pl/tools/thinking) oraz [Użycie tokenów](/pl/reference/token-use).

## Prefiksy, wątki i odpowiedzi

- Kaskada prefiksów wychodzących: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp ma również `channels.whatsapp.messagePrefix` dla prefiksu wiadomości przychodzących.
- Tworzenie wątków odpowiedzi za pomocą `replyToMode` i wartości domyślnych dla poszczególnych kanałów.

Szczegóły: [Konfiguracja](/pl/gateway/config-agents#messages) i dokumentacja kanałów.

## Ciche odpowiedzi

Cichy token `NO_REPLY` (wielkość liter nie ma znaczenia, więc pasuje również `no_reply`) oznacza „nie dostarczaj odpowiedzi widocznej dla użytkownika”. Gdy tura zawiera również oczekujące multimedia narzędzia, takie jak wygenerowany dźwięk TTS, OpenClaw usuwa cichy tekst, ale nadal dostarcza załącznik multimedialny.

Zasady ciszy są ustalane według typu konwersacji:

- Konwersacje bezpośrednie nigdy nie otrzymują wskazówek promptu `NO_REPLY`. Jeśli bezpośrednie uruchomienie przypadkowo zwróci sam cichy token, OpenClaw go pomija, zamiast przepisywać lub dostarczać.
- Grupy/kanały domyślnie zezwalają na ciszę. W trybie widocznych odpowiedzi `message_tool` cisza oznacza, że model nie wywołuje `message(action=send)`.
- Wewnętrzna orkiestracja domyślnie zezwala na ciszę.

Wartości domyślne znajdują się w `agents.defaults.silentReply`; `surfaces.<id>.silentReply` może nadpisać zasady grupowe/wewnętrzne dla poszczególnych obszarów.

OpenClaw używa również cichych odpowiedzi w przypadku ogólnych wewnętrznych awarii modułu uruchamiającego w czatach innych niż bezpośrednie, dzięki czemu grupy/kanały nie widzą standardowego komunikatu o błędzie Gateway. Sklasyfikowane awarie z przeznaczonym dla użytkownika opisem sposobu odzyskania, takie jak powiadomienia o braku uwierzytelnienia, limicie szybkości lub przeciążeniu, nadal mogą być dostarczane. Czaty bezpośrednie domyślnie pokazują zwięzły opis awarii; nieprzetworzone szczegóły modułu uruchamiającego są wyświetlane tylko wtedy, gdy włączone jest `/verbose full`.

Same ciche odpowiedzi są odrzucane we wszystkich obszarach, więc sesje nadrzędne pozostają ciche, zamiast przepisywać tekst znacznika na zastępczą wypowiedź.

## Powiązane

- [Refaktoryzacja cyklu życia wiadomości](/pl/concepts/message-lifecycle-refactor) - docelowy trwały projekt wysyłania i odbierania
- [Strumieniowanie](/pl/concepts/streaming) - dostarczanie wiadomości w czasie rzeczywistym
- [Ponawianie](/pl/concepts/retry) - zachowanie ponawiania dostarczania wiadomości
- [Kolejka](/pl/concepts/queue) - kolejka przetwarzania wiadomości
- [Kanały](/pl/channels) - integracje z platformami komunikacyjnymi
