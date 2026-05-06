---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub współbieżności
    - Wyjaśnianie trybów /queue lub zachowania kierowania wiadomościami
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i nadpisania na poziomie sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-05-06T09:09:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f182195b740d678044a203387da6368df77ac2a6bb0eb29653bb8ea45264aaf
    source_path: concepts/queue.md
    workflow: 16
---

Serializujemy uruchomienia automatycznych odpowiedzi przychodzących (wszystkie kanały) przez małą kolejkę w procesie, aby zapobiec kolizjom wielu uruchomień agentów, jednocześnie nadal umożliwiając bezpieczną równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących nadejdzie w krótkim odstępie czasu.
- Serializacja pozwala uniknąć rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów szybkości po stronie upstream.

## Jak to działa

- Kolejka FIFO świadoma linii opróżnia każdą linię z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych linii; `main` domyślnie 4, `subagent` 8).
- `runEmbeddedPiAgent` dodaje zadania do kolejki według **klucza sesji** (linia `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie kolejkowane do **globalnej linii** (domyślnie `main`), więc ogólna równoległość jest ograniczona przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, kolejkowane uruchomienia emitują krótki komunikat, jeśli czekały ponad ~2 s przed startem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (gdy kanał je obsługuje), więc doświadczenie użytkownika pozostaje bez zmian podczas oczekiwania na swoją kolej.

## Domyślne wartości

Gdy nie ustawiono inaczej, wszystkie powierzchnie kanałów przychodzących używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` jest wartością domyślną, ponieważ utrzymuje aktywną turę modelu responsywną bez
uruchamiania drugiego przebiegu sesji. Opróżnia wszystkie wiadomości sterujące, które dotarły
przed następną granicą modelu. Jeśli bieżące uruchomienie nie może przyjąć sterowania,
OpenClaw przełącza się na wpis kolejki kontynuacji.

## Tryby kolejki

Wiadomości przychodzące mogą sterować bieżącym uruchomieniem, czekać na turę kontynuacji albo robić jedno i drugie:

- `steer`: kolejkowanie wiadomości sterujących do aktywnego środowiska uruchomieniowego. Pi dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**, przed następnym wywołaniem LLM; serwer aplikacji Codex otrzymuje jedno zbiorcze `turn/steer`. Jeśli uruchomienie nie streamuje aktywnie albo sterowanie jest niedostępne, OpenClaw przełącza się na wpis kolejki kontynuacji.
- `queue` (starsze): stare sterowanie po jednej wiadomości naraz. Pi dostarcza jedną zakolejkowaną wiadomość sterującą przy każdej granicy modelu; serwer aplikacji Codex otrzymuje oddzielne żądania `turn/steer`. Preferuj `steer`, chyba że potrzebujesz poprzedniego zachowania serializowanego.
- `followup`: dodaj każdą wiadomość do kolejki na późniejszą turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scal zakolejkowane wiadomości w **jedną** turę kontynuacji po oknie ciszy. Jeśli wiadomości dotyczą różnych kanałów/wątków, są opróżniane pojedynczo, aby zachować routing.
- `steer-backlog` (czyli `steer+backlog`): steruj teraz **i** zachowaj tę samą wiadomość na turę kontynuacji.
- `interrupt` (starsze): przerwij aktywne uruchomienie dla tej sesji, a następnie uruchom najnowszą wiadomość.

Steer-backlog oznacza, że możesz otrzymać odpowiedź kontynuacji po sterowanym uruchomieniu, więc
powierzchnie streamujące mogą wyglądać jak duplikaty. Preferuj `collect`/`steer`, jeśli chcesz
jedną odpowiedź na wiadomość przychodzącą.

Informacje o czasie i zachowaniu zależności specyficznym dla środowiska uruchomieniowego znajdziesz w
[Kolejce sterowania](/pl/concepts/queue-steering). Informacje o jawnym poleceniu `/steer <message>`
znajdziesz w [Steer](/pl/tools/steer).

Skonfiguruj globalnie lub per kanał przez `messages.queue`:

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

Opcje mają zastosowanie do `followup`, `collect` i `steer-backlog` (oraz do `steer` lub starszego `queue`, gdy sterowanie przełącza się na kontynuację):

- `debounceMs`: okno ciszy przed opróżnieniem zakolejkowanych kontynuacji. Same liczby oznaczają milisekundy; opcje `/queue` akceptują jednostki `ms`, `s`, `m`, `h` i `d`.
- `cap`: maksymalna liczba zakolejkowanych wiadomości na sesję. Wartości poniżej `1` są ignorowane.
- `drop: "summarize"`: domyślne. Odrzucaj najstarsze zakolejkowane wpisy w razie potrzeby, zachowuj zwarte podsumowania i wstrzykuj je jako syntetyczny prompt kontynuacji.
- `drop: "old"`: odrzucaj najstarsze zakolejkowane wpisy w razie potrzeby, bez zachowywania podsumowań.
- `drop: "new"`: odrzuć najnowszą wiadomość, gdy kolejka jest już pełna.

Wartości domyślne: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Kolejność pierwszeństwa

Przy wyborze trybu OpenClaw rozstrzyga:

1. Wbudowane lub zapisane nadpisanie `/queue` dla sesji.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślne `steer`.

Dla opcji wbudowane lub zapisane opcje `/queue` mają pierwszeństwo przed konfiguracją. Następnie
stosowane są opóźnienie specyficzne dla kanału (`messages.queue.debounceMsByChannel`), domyślne
opóźnienia Plugin, globalne opcje `messages.queue` i wbudowane wartości domyślne.
`cap` i `drop` są opcjami globalnymi/sesyjnymi, a nie kluczami konfiguracji
per kanał.

## Nadpisania per sesja

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznych odpowiedzi we wszystkich kanałach przychodzących, które używają potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślna linia (`main`) obejmuje cały proces dla wiadomości przychodzących i głównych heartbeatów; ustaw `agents.defaults.maxConcurrent`, aby zezwolić na wiele sesji równolegle.
- Mogą istnieć dodatkowe linie (np. `cron`, `cron-nested`, `nested`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agentów Cron zajmują slot `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba używają `cron.maxConcurrentRuns`. Współdzielone przepływy nie-Cron `nested` zachowują własne zachowanie linii. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Linie per sesja gwarantują, że tylko jedno uruchomienie agenta dotyka danej sesji naraz.
- Brak zależności zewnętrznych ani wątków roboczych w tle; czysty TypeScript + promises.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy `"queued for ...ms"`, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze czasu kolejki.
- Uruchomienia serwera aplikacji Codex, które przyjmują turę, a potem przestają emitować postęp, są przerywane przez adapter Codex, aby aktywna linia sesji mogła zostać zwolniona zamiast czekać na timeout zewnętrznego uruchomienia.
- Gdy diagnostyka jest włączona, sesje, które pozostają w `processing` po `diagnostics.stuckSessionWarnMs` bez zaobserwowanej odpowiedzi, narzędzia, statusu, bloku ani postępu ACP, są klasyfikowane według bieżącej aktywności. Aktywna praca jest logowana jako `session.long_running`; aktywna praca bez niedawnego postępu jest logowana jako `session.stalled`; `session.stuck` jest zarezerwowane dla nieaktualnej księgowości sesji bez aktywnej pracy i tylko ta ścieżka może zwolnić dotkniętą linię sesji, aby zakolejkowana praca mogła zostać opróżniona. Powtarzające się diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje bez zmian.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Steer](/pl/tools/steer)
- [Zasady ponawiania](/pl/concepts/retry)
