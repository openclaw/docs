---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub współbieżności
    - Wyjaśnianie trybów /queue lub zachowania kierowania wiadomościami
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i nadpisania dla poszczególnych sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-05-02T09:48:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

Szeregujemy przychodzące uruchomienia automatycznych odpowiedzi (wszystkie kanały) przez niewielką kolejkę działającą w procesie, aby zapobiec kolizjom wielu uruchomień agenta, jednocześnie nadal pozwalając na bezpieczną równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących pojawia się w krótkim odstępie czasu.
- Szeregowanie pozwala uniknąć rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów częstotliwości po stronie usług nadrzędnych.

## Jak to działa

- Kolejka FIFO świadoma torów opróżnia każdy tor z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych torów; main domyślnie 4, subagent 8).
- `runEmbeddedPiAgent` dodaje do kolejki według **klucza sesji** (tor `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie kolejkowane do **globalnego toru** (domyślnie `main`), więc ogólna równoległość jest ograniczona przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, uruchomienia w kolejce emitują krótką informację, jeśli czekały ponad ~2 s przed startem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (gdy kanał je obsługuje), więc doświadczenie użytkownika pozostaje niezmienione, gdy czekamy na swoją kolej.

## Domyślne wartości

Gdy nie ustawiono inaczej, wszystkie powierzchnie kanałów przychodzących używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` jest wartością domyślną, ponieważ utrzymuje aktywną turę modelu responsywną bez
uruchamiania drugiego przebiegu sesji. Opróżnia wszystkie wiadomości sterujące, które dotarły
przed następną granicą modelu. Jeśli bieżące uruchomienie nie może przyjąć sterowania,
OpenClaw wraca do wpisu kolejki followup.

## Tryby kolejki

Wiadomości przychodzące mogą sterować bieżącym uruchomieniem, czekać na turę followup albo robić jedno i drugie:

- `steer`: kolejkowanie wiadomości sterujących do aktywnego środowiska uruchomieniowego. Pi dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**, przed kolejnym wywołaniem LLM; serwer aplikacji Codex otrzymuje jedno wsadowe `turn/steer`. Jeśli uruchomienie nie streamuje aktywnie albo sterowanie jest niedostępne, OpenClaw wraca do wpisu kolejki followup.
- `queue` (starszy): dawne sterowanie po jednej wiadomości naraz. Pi dostarcza jedną zakolejkowaną wiadomość sterującą przy każdej granicy modelu; serwer aplikacji Codex otrzymuje osobne żądania `turn/steer`. Preferuj `steer`, chyba że potrzebujesz poprzedniego, serializowanego zachowania.
- `followup`: dodaj każdą wiadomość do kolejki na późniejszą turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scal zakolejkowane wiadomości w **pojedynczą** turę followup po oknie ciszy. Jeśli wiadomości są skierowane do różnych kanałów/wątków, są opróżniane pojedynczo, aby zachować trasowanie.
- `steer-backlog` (alias `steer+backlog`): steruj teraz **i** zachowaj tę samą wiadomość dla tury followup.
- `interrupt` (starszy): przerwij aktywne uruchomienie dla tej sesji, a następnie uruchom najnowszą wiadomość.

Steer-backlog oznacza, że po sterowanym uruchomieniu możesz otrzymać odpowiedź followup, więc
powierzchnie streamujące mogą wyglądać jak duplikaty. Preferuj `collect`/`steer`, jeśli chcesz
jedną odpowiedź na każdą wiadomość przychodzącą.

Informacje o taktowaniu i zachowaniu zależności właściwych dla środowiska uruchomieniowego znajdziesz w
[Kolejka sterowania](/pl/concepts/queue-steering).

Skonfiguruj globalnie albo dla kanału przez `messages.queue`:

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

Opcje mają zastosowanie do `followup`, `collect` i `steer-backlog` (oraz do `steer` albo starszego `queue`, gdy sterowanie wraca do followup):

- `debounceMs`: okno ciszy przed opróżnianiem zakolejkowanych followup. Same liczby oznaczają milisekundy; jednostki `ms`, `s`, `m`, `h` i `d` są akceptowane przez opcje `/queue`.
- `cap`: maksymalna liczba zakolejkowanych wiadomości na sesję. Wartości poniżej `1` są ignorowane.
- `drop: "summarize"`: domyślne. Odrzucaj najstarsze wpisy kolejki według potrzeb, zachowuj zwarte podsumowania i wstrzykuj je jako syntetyczny prompt followup.
- `drop: "old"`: odrzucaj najstarsze wpisy kolejki według potrzeb, bez zachowywania podsumowań.
- `drop: "new"`: odrzuć najnowszą wiadomość, gdy kolejka jest już pełna.

Domyślne wartości: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Kolejność pierwszeństwa

Przy wyborze trybu OpenClaw rozstrzyga w tej kolejności:

1. Wbudowane albo zapisane nadpisanie `/queue` dla sesji.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślne `steer`.

W przypadku opcji wbudowane albo zapisane opcje `/queue` mają pierwszeństwo przed konfiguracją. Następnie
stosowane są debounce specyficzne dla kanału (`messages.queue.debounceMsByChannel`), domyślne wartości
debounce Plugin, globalne opcje `messages.queue` i wbudowane wartości domyślne.
`cap` i `drop` są opcjami globalnymi/sesyjnymi, a nie kluczami konfiguracji dla kanału.

## Nadpisania dla sesji

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` albo `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznych odpowiedzi we wszystkich kanałach przychodzących, które używają potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny tor (`main`) jest ogólny dla procesu dla wiadomości przychodzących i głównych Heartbeat; ustaw `agents.defaults.maxConcurrent`, aby pozwolić na wiele sesji równolegle.
- Mogą istnieć dodatkowe tory (np. `cron`, `cron-nested`, `nested`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agenta Cron zajmują slot `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba używają `cron.maxConcurrentRuns`. Współdzielone przepływy `nested` inne niż cron zachowują własne zachowanie toru. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Tory dla sesji gwarantują, że tylko jedno uruchomienie agenta dotyka danej sesji naraz.
- Bez zewnętrznych zależności ani wątków roboczych w tle; czysty TypeScript + promises.

## Rozwiązywanie problemów

- Jeśli polecenia wyglądają na zablokowane, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka jest opróżniana.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze taktowania kolejki.
- Uruchomienia serwera aplikacji Codex, które przyjmują turę, a następnie przestają emitować postęp, są przerywane przez adapter Codex, aby aktywny tor sesji mógł się zwolnić zamiast czekać na limit czasu zewnętrznego uruchomienia.
- Gdy diagnostyka jest włączona, sesje pozostające w stanie `processing` po upływie `diagnostics.stuckSessionWarnMs` bez zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP są klasyfikowane według bieżącej aktywności. Aktywna praca loguje się jako `session.long_running`; aktywna praca bez niedawnego postępu loguje się jako `session.stalled`; `session.stuck` jest zarezerwowane dla nieaktualnej księgowości sesji bez aktywnej pracy i tylko ta ścieżka może zwolnić dotknięty tor sesji, aby zakolejkowana praca mogła się opróżnić. Powtarzane diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Zasady ponawiania](/pl/concepts/retry)
