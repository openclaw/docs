---
read_when:
    - Zmiana wykonywania automatycznych odpowiedzi lub współbieżności
    - Wyjaśnianie trybów /queue lub zachowania kierowania wiadomościami
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i nadpisania dla poszczególnych sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-04-30T09:49:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Serializujemy przychodzące uruchomienia automatycznych odpowiedzi (wszystkie kanały) przez małą kolejkę w procesie, aby zapobiec kolizjom wielu uruchomień agenta, jednocześnie nadal pozwalając na bezpiełą równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele przychodzących wiadomości pojawia się blisko siebie.
- Serializacja pozwala uniknąć rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów szybkości po stronie dostawcy.

## Jak to działa

- Kolejka FIFO świadoma pasów opróżnia każdy pas z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych pasów; main domyślnie 4, subagent 8).
- `runEmbeddedPiAgent` dodaje zadania do kolejki według **klucza sesji** (pas `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie dodawane do **globalnego pasa** (domyślnie `main`), więc ogólna równoległość jest ograniczona przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, uruchomienia w kolejce emitują krótkie powiadomienie, jeśli czekały ponad około 2 s przed startem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (gdy kanał to obsługuje), więc doświadczenie użytkownika pozostaje bez zmian, gdy czekamy na swoją kolej.

## Domyślne wartości

Gdy nie ustawiono inaczej, wszystkie powierzchnie kanałów przychodzących używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` jest domyślne, ponieważ utrzymuje aktywną turę modelu responsywną bez
uruchamiania drugiego przebiegu sesji. Opróżnia wszystkie wiadomości sterujące,
które dotarły przed następną granicą modelu. Jeśli bieżące uruchomienie nie może
przyjąć sterowania, OpenClaw wraca do wpisu kolejki follow-up.

## Tryby kolejki

Wiadomości przychodzące mogą sterować bieżącym uruchomieniem, czekać na turę follow-up albo robić jedno i drugie:

- `steer`: dodaje wiadomości sterujące do aktywnego środowiska uruchomieniowego. Pi dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi przez bieżącą turę asystenta**, przed następnym wywołaniem LLM; serwer aplikacji Codex otrzymuje jedno zbiorcze `turn/steer`. Jeśli uruchomienie nie przesyła aktywnie strumienia lub sterowanie jest niedostępne, OpenClaw wraca do wpisu kolejki follow-up.
- `queue` (starszy tryb): dawne sterowanie pojedynczo. Pi dostarcza jedną wiadomość sterującą z kolejki na każdej granicy modelu; serwer aplikacji Codex otrzymuje osobne żądania `turn/steer`. Preferuj `steer`, chyba że potrzebujesz poprzedniego serializowanego zachowania.
- `followup`: dodaje każdą wiadomość do kolejki na późniejszą turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: scala wiadomości z kolejki w **pojedynczą** turę follow-up po okresie ciszy. Jeśli wiadomości kierują do różnych kanałów/wątków, są opróżniane osobno, aby zachować trasowanie.
- `steer-backlog` (czyli `steer+backlog`): steruje teraz **i** zachowuje tę samą wiadomość na turę follow-up.
- `interrupt` (starszy tryb): przerywa aktywne uruchomienie dla tej sesji, a następnie uruchamia najnowszą wiadomość.

Steer-backlog oznacza, że możesz otrzymać odpowiedź follow-up po sterowanym
uruchomieniu, więc powierzchnie strumieniowe mogą wyglądać jak duplikaty.
Preferuj `collect`/`steer`, jeśli chcesz jedną odpowiedź na wiadomość przychodzącą.

Informacje o czasie i zachowaniu zależności specyficznych dla środowiska uruchomieniowego znajdziesz w
[Kolejce sterowania](/pl/concepts/queue-steering).

Konfiguruj globalnie lub per kanał przez `messages.queue`:

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

Opcje mają zastosowanie do `followup`, `collect` i `steer-backlog` (oraz do `steer` lub starszego `queue`, gdy sterowanie wraca do follow-up):

- `debounceMs`: okres ciszy przed opróżnieniem follow-upów w kolejce. Same liczby oznaczają milisekundy; jednostki `ms`, `s`, `m`, `h` i `d` są akceptowane przez opcje `/queue`.
- `cap`: maksymalna liczba wiadomości w kolejce na sesję. Wartości poniżej `1` są ignorowane.
- `drop: "summarize"`: domyślne. Usuwa najstarsze wpisy z kolejki według potrzeb, zachowuje zwięzłe podsumowania i wstrzykuje je jako syntetyczny prompt follow-up.
- `drop: "old"`: usuwa najstarsze wpisy z kolejki według potrzeb, bez zachowywania podsumowań.
- `drop: "new"`: odrzuca najnowszą wiadomość, gdy kolejka jest już pełna.

Domyślne wartości: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Pierwszeństwo

Przy wyborze trybu OpenClaw rozstrzyga:

1. Wbudowane lub zapisane nadpisanie `/queue` dla sesji.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślne `steer`.

Dla opcji wbudowane lub zapisane opcje `/queue` mają pierwszeństwo nad konfiguracją. Następnie
stosowane są opóźnienie specyficzne dla kanału (`messages.queue.debounceMsByChannel`), domyślne
opóźnienia Plugin, globalne opcje `messages.queue` oraz wbudowane wartości domyślne.
`cap` i `drop` są opcjami globalnymi/sesyjnymi, a nie kluczami konfiguracji per kanał.

## Nadpisania per sesja

- Wyślij `/queue <mode>` jako samodzielne polecenie, aby zapisać tryb dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agentów automatycznych odpowiedzi we wszystkich kanałach przychodzących, które używają potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny pas (`main`) obejmuje cały proces dla ruchu przychodzącego i głównych Heartbeat; ustaw `agents.defaults.maxConcurrent`, aby zezwolić na wiele sesji równolegle.
- Mogą istnieć dodatkowe pasy (np. `cron`, `cron-nested`, `nested`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agentów Cron trzymają slot `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba używają `cron.maxConcurrentRuns`. Współdzielone przepływy nie-Cron `nested` zachowują własne zachowanie pasa. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Pasy per sesja gwarantują, że tylko jedno uruchomienie agenta naraz dotyka danej sesji.
- Brak zewnętrznych zależności lub wątków roboczych w tle; czysty TypeScript + obietnice.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy „queued for …ms”, aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze czasu kolejki.
- Gdy diagnostyka jest włączona, sesje pozostające w `processing` dłużej niż `diagnostics.stuckSessionWarnMs` zapisują ostrzeżenie o zablokowanej sesji. Aktywne uruchomienia osadzone, aktywne operacje odpowiedzi i aktywne zadania pasa domyślnie pozostają tylko ostrzeżeniami; nieaktualna ewidencja startowa bez aktywnej pracy sesji może zwolnić dotknięty pas sesji, aby praca w kolejce mogła się opróżnić.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Zasady ponawiania](/pl/concepts/retry)
