---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub współbieżności
    - Objaśnienie trybów /queue lub mechanizmu kierowania wiadomościami
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i ustawienia zastępujące dla poszczególnych sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-07-12T15:00:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw szereguje przychodzące uruchomienia automatycznych odpowiedzi (ze wszystkich kanałów) za pomocą niewielkiej kolejki wewnątrz procesu, aby zapobiec kolizjom wielu uruchomień agenta, jednocześnie umożliwiając bezpieczne wykonywanie równoległe w różnych sesjach.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą ze sobą kolidować, gdy wiele wiadomości przychodzących pojawi się w krótkim odstępie.
- Szeregowanie zapobiega rywalizacji o współdzielone zasoby (pliki sesji, dzienniki, standardowe wejście CLI) i zmniejsza ryzyko przekroczenia limitów częstotliwości usług nadrzędnych.

## Jak to działa

- Kolejka FIFO uwzględniająca tory opróżnia każdy tor zgodnie z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych torów; domyślnie 4 dla `main` i 8 dla `subagent`).
- `runEmbeddedAgent` umieszcza zadania w kolejce według **klucza sesji** (tor `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie umieszczane w **torze globalnym** (domyślnie `main`), dzięki czemu ogólna równoległość jest ograniczana przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe rejestrowanie, uruchomienia oczekujące w kolejce emitują krótkie powiadomienie, jeśli przed rozpoczęciem czekały dłużej niż około 2 sekundy.
- Wskaźniki pisania nadal są uruchamiane natychmiast po umieszczeniu w kolejce (jeśli kanał je obsługuje), dzięki czemu podczas oczekiwania na swoją kolej środowisko użytkownika pozostaje niezmienione.

## Wartości domyślne

Jeśli nie ustawiono inaczej, wszystkie powierzchnie kanałów przychodzących używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Domyślnie stosowane jest sterowanie w tej samej turze. Polecenie, które nadejdzie w trakcie uruchomienia, jest wstrzykiwane do aktywnego środowiska wykonawczego, jeśli uruchomienie może przyjąć sterowanie, więc nie jest rozpoczynane drugie uruchomienie sesji. Jeśli aktywne uruchomienie nie może przyjąć sterowania, OpenClaw czeka z rozpoczęciem polecenia do zakończenia aktywnego uruchomienia.

## Tryby kolejki

`/queue` określa sposób obsługi zwykłych wiadomości przychodzących, gdy sesja ma już aktywne uruchomienie:

- `steer`: wstrzykuje wiadomości do aktywnego środowiska wykonawczego. OpenClaw dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi w bieżącej turze asystenta**, przed następnym wywołaniem LLM; serwer aplikacji Codex otrzymuje jedno zbiorcze `turn/steer`. Jeśli uruchomienie nie przesyła aktywnie strumienia lub sterowanie jest niedostępne, OpenClaw czeka z rozpoczęciem polecenia do zakończenia aktywnego uruchomienia.
- `followup`: nie steruje. Umieszcza każdą wiadomość w kolejce do późniejszej tury agenta po zakończeniu bieżącego uruchomienia.
- `collect`: nie steruje. Scala wiadomości z kolejki w **jedną** turę uzupełniającą po upływie okresu ciszy. Jeśli wiadomości są kierowane do różnych kanałów lub wątków, są pobierane pojedynczo, aby zachować routing.
- `interrupt`: przerywa aktywne uruchomienie tej sesji, a następnie uruchamia najnowszą wiadomość.

Informacje o czasie i zachowaniu zależnym od środowiska wykonawczego oraz zależności znajdziesz w sekcji [Kolejka sterowania](/pl/concepts/queue-steering). Informacje o jawnym poleceniu `/steer <message>` znajdziesz w sekcji [Sterowanie](/pl/tools/steer).

Skonfiguruj globalnie lub dla poszczególnych kanałów za pomocą `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opcje kolejki

Opcje dotyczą dostarczania z kolejki. `debounceMs` określa również okres ciszy sterowania Codex w trybie `steer`:

- `debounceMs`: okres ciszy przed pobraniem z kolejki tur uzupełniających lub zbiorczych partii; w trybie Codex `steer` — okres ciszy przed wysłaniem zbiorczego `turn/steer`. Same liczby oznaczają milisekundy; opcje `/queue` akceptują jednostki `ms`, `s`, `m`, `h` i `d`.
- `cap`: maksymalna liczba wiadomości w kolejce na sesję. Wartości mniejsze niż `1` są ignorowane.
- `drop: "summarize"` (domyślnie): w razie potrzeby usuwa najstarsze wpisy z kolejki, zachowuje ich zwięzłe podsumowania i wstrzykuje je jako syntetyczne polecenie uzupełniające.
- `drop: "old"`: w razie potrzeby usuwa najstarsze wpisy z kolejki bez zachowywania podsumowań.
- `drop: "new"`: odrzuca najnowszą wiadomość, gdy kolejka jest już pełna.

Wartości domyślne: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Sterowanie i przesyłanie strumieniowe

Gdy przesyłanie strumieniowe kanału ma wartość `partial` lub `block`, sterowanie może wyglądać jak kilka krótkich, widocznych odpowiedzi, gdy aktywne uruchomienie dociera do granic środowiska wykonawczego:

- `partial`: podgląd może zostać zakończony wcześniej, a po przyjęciu sterowania rozpoczyna się nowy podgląd.
- `block`: bloki o rozmiarze wersji roboczej mogą powodować taki sam wygląd sekwencyjny.
- Bez przesyłania strumieniowego sterowanie przechodzi na turę uzupełniającą po aktywnym uruchomieniu, gdy środowisko wykonawcze nie może przyjąć sterowania w tej samej turze.

`steer` nie przerywa narzędzi będących w trakcie wykonywania. Użyj `/queue interrupt`, gdy najnowsza wiadomość powinna przerwać bieżące uruchomienie.

## Kolejność pierwszeństwa

Przy wyborze trybu OpenClaw uwzględnia kolejno:

1. Wbudowane lub zapisane dla sesji nadpisanie `/queue`.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślny tryb `steer`.

W przypadku opcji opcje `/queue` podane bezpośrednio lub zapisane mają pierwszeństwo przed konfiguracją. Następnie, w podanej kolejności, stosowane są: opóźnienie właściwe dla kanału (`messages.queue.debounceMsByChannel`), domyślne opóźnienie Pluginu, globalne opcje `messages.queue` oraz wbudowane wartości domyślne. `cap` i `drop` są opcjami globalnymi lub sesyjnymi, a nie kluczami konfiguracji poszczególnych kanałów.

## Nadpisania dla sesji

- Wyślij `/queue <steer|followup|collect|interrupt>` jako samodzielne polecenie, aby zapisać tryb kolejki dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` usuwa nadpisanie sesji.

## Anulowanie tur w kolejce

Gdy polecenie znajduje się w kolejce `followup` lub `collect` (na przykład `chat.send` z TUI lub czatu internetowego przychodzące w czasie aktywności innej tury), Gateway zachowuje **tożsamość anulowania należącą do Gateway** dla identyfikatora klienta `runId`, dopóki zawartość z kolejki nie zostanie uruchomiona lub odrzucona. Tożsamość podąża za zawartością scaloną z podsumowaniem przepełnienia.

- `chat.abort` z określonym `runId` anuluje tę turę, gdy nadal znajduje się ona w kolejce, jeśli żądający ma autoryzację (obowiązują te same reguły własności co w przypadku aktywnych uruchomień).
- `chat.abort` dla sesji bez `runId` anuluje najpierw **autoryzowane tury w kolejce**, a następnie przerywa autoryzowane aktywne uruchomienia. Taka kolejność zapobiega wypromowaniu pracy przez opróżnianie kolejki do częściowo zatrzymanej sesji.
- Czyszczenie całej kolejki sesji bez sprawdzania poszczególnych żądających nie stanowi ścieżki zatrzymywania sesji z wieloma właścicielami.
- Oczekiwanie w kolejce nie jest przedstawiane jako aktywne uruchomienie agenta w `sessions.list` i nie podlega semantyce limitu czasu aktywnego uruchomienia; dotyczy ona wyłącznie fazy aktywnej.

Klienty (w tym TUI) przekazują polecenia przychodzące w trakcie uruchomienia i pozwalają Gateway zastosować tryb kolejki. Esc/`/stop` używa przerwania o zakresie sesji, dzięki czemu utrata lokalnych uchwytów nie pozostawia wciąż oczekującego polecenia do późniejszego uruchomienia.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznej odpowiedzi we wszystkich kanałach przychodzących korzystających z potoku odpowiedzi Gateway (WhatsApp w przeglądarce, Telegram, Slack, Discord, Signal, iMessage, czat internetowy itd.).
- Domyślny tor (`main`) obejmuje cały proces dla ruchu przychodzącego i głównych Heartbeatów; ustaw `agents.defaults.maxConcurrent`, aby zezwolić na równoległe działanie wielu sesji.
- Mogą istnieć dodatkowe tory (np. `cron`, `cron-nested`, `nested`, `subagent`), dzięki czemu zadania w tle mogą działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agenta Cron zajmują miejsce `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba korzystają z `cron.maxConcurrentRuns`. Współdzielone przepływy `nested`, które nie należą do Cron, zachowują własne działanie toru. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Tory dla poszczególnych sesji gwarantują, że w danym momencie tylko jedno uruchomienie agenta korzysta z określonej sesji.
- Brak zewnętrznych zależności i wątków roboczych działających w tle; wyłącznie TypeScript i obietnice.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe dzienniki i poszukaj wierszy „queued for ...ms”, aby potwierdzić, że kolejka jest opróżniana.
- Uruchomienia serwera aplikacji Codex, które przyjmują turę, a następnie przestają emitować postęp, są przerywane przez adapter Codex, aby aktywny tor sesji mógł zostać zwolniony zamiast czekać na limit czasu zewnętrznego uruchomienia.
- Gdy diagnostyka jest włączona, sesje pozostające w stanie `processing` dłużej niż `diagnostics.stuckSessionWarnMs` bez zaobserwowanej odpowiedzi, użycia narzędzia, zmiany stanu, bloku ani postępu ACP są klasyfikowane według bieżącej aktywności:
  - Aktywna praca z niedawnym postępem jest rejestrowana jako `session.long_running`. Należące do właściciela ciche wywołania modelu również pozostają w stanie `session.long_running` do upływu `diagnostics.stuckSessionAbortMs`, aby powolni lub niestrumieniujący dostawcy nie byli zbyt wcześnie zgłaszani jako zablokowani.
  - Aktywna praca bez niedawno zarejestrowanego postępu jest klasyfikowana jako `session.stalled`; należące do właściciela wywołania modelu, zablokowane wywołania narzędzi i zablokowane osadzone uruchomienia przechodzą w stan `session.stalled` po osiągnięciu progu przerwania. Nieaktualna aktywność modelu lub narzędzia bez właściciela nie jest ukrywana jako długotrwała.
  - `session.stuck` jest zarezerwowane dla możliwego do naprawienia, nieaktualnego stanu ewidencyjnego sesji, w tym bezczynnych sesji w kolejce z nieaktualną aktywnością modelu lub narzędzia bez właściciela.
  - `session.stuck` zawsze uruchamia odzyskiwanie, które może zwolnić dotknięty problemem tor sesji. Klasyfikacja `session.stalled` po przekroczeniu `diagnostics.stuckSessionAbortMs` (zablokowane wywołanie narzędzia, zablokowane wywołanie modelu lub zablokowane osadzone uruchomienie) również może uruchomić aktywne odzyskiwanie przez przerwanie, więc kolejkę mogą odblokować obie klasyfikacje, nie tylko `session.stuck`.
  - Powtarzające się ostrzeżenia `session.stuck` i `session.long_running` w dzienniku stosują wykładniczo rosnące odstępy, dopóki sesja pozostaje niezmieniona; próby odzyskiwania nadal są wykonywane przy każdym takcie Heartbeatu, niezależnie od tego zwiększania odstępów.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Sterowanie](/pl/tools/steer)
- [Zasady ponawiania](/pl/concepts/retry)
