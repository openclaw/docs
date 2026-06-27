---
read_when:
    - Zmienianie wykonywania automatycznych odpowiedzi lub współbieżności
    - Wyjaśnianie trybów /queue lub zachowania sterowania wiadomościami
summary: Tryby kolejki automatycznych odpowiedzi, wartości domyślne i nadpisania dla poszczególnych sesji
title: Kolejka poleceń
x-i18n:
    generated_at: "2026-06-27T17:29:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Serializujemy przychodzące uruchomienia automatycznych odpowiedzi (we wszystkich kanałach) przez niewielką kolejkę w procesie, aby zapobiec kolizjom wielu uruchomień agenta, jednocześnie nadal pozwalając na bezpiełą równoległość między sesjami.

## Dlaczego

- Uruchomienia automatycznych odpowiedzi mogą być kosztowne (wywołania LLM) i mogą kolidować, gdy wiele wiadomości przychodzących dociera w krótkim odstępie czasu.
- Serializacja pozwala uniknąć rywalizacji o współdzielone zasoby (pliki sesji, logi, stdin CLI) i zmniejsza ryzyko limitów szybkości po stronie dostawców.

## Jak to działa

- Świadoma torów kolejka FIFO opróżnia każdy tor z konfigurowalnym limitem współbieżności (domyślnie 1 dla nieskonfigurowanych torów; main domyślnie 4, subagent 8).
- `runEmbeddedAgent` dodaje do kolejki według **klucza sesji** (tor `session:<key>`), aby zagwarantować tylko jedno aktywne uruchomienie na sesję.
- Każde uruchomienie sesji jest następnie kolejkowane w **torze globalnym** (domyślnie `main`), więc ogólna równoległość jest ograniczona przez `agents.defaults.maxConcurrent`.
- Gdy włączone jest szczegółowe logowanie, uruchomienia w kolejce emitują krótką informację, jeśli czekały ponad ~2 s przed startem.
- Wskaźniki pisania nadal uruchamiają się natychmiast po dodaniu do kolejki (gdy kanał to obsługuje), więc doświadczenie użytkownika pozostaje bez zmian, gdy czekamy na swoją kolej.

## Domyślne ustawienia

Gdy nie są ustawione, wszystkie przychodzące powierzchnie kanałów używają:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

Sterowanie w tej samej turze jest domyślne. Prompt, który przychodzi w trakcie uruchomienia, jest wstrzykiwany
do aktywnego runtime, gdy uruchomienie może przyjąć sterowanie, więc drugie uruchomienie
sesji nie jest uruchamiane. Jeśli aktywne uruchomienie nie może przyjąć sterowania, OpenClaw czeka, aż
aktywne uruchomienie się zakończy, zanim uruchomi prompt.

## Tryby kolejki

`/queue` kontroluje, co normalne wiadomości przychodzące robią, gdy sesja ma już
aktywne uruchomienie:

- `steer`: wstrzykuj wiadomości do aktywnego runtime. OpenClaw dostarcza wszystkie oczekujące wiadomości sterujące **po zakończeniu wykonywania wywołań narzędzi w bieżącej turze asystenta**, przed następnym wywołaniem LLM; serwer aplikacji Codex otrzymuje jedno zbiorcze `turn/steer`. Jeśli uruchomienie nie streamuje aktywnie albo sterowanie jest niedostępne, OpenClaw czeka, aż aktywne uruchomienie się zakończy, zanim uruchomi prompt.
- `followup`: nie steruj. Dodaj każdą wiadomość do kolejki na późniejszą turę agenta po zakończeniu bieżącego uruchomienia.
- `collect`: nie steruj. Scal wiadomości w kolejce w **pojedynczą** turę followup po oknie ciszy. Jeśli wiadomości celują w różne kanały/wątki, są opróżniane pojedynczo, aby zachować routing.
- `interrupt`: przerwij aktywne uruchomienie dla tej sesji, a następnie uruchom najnowszą wiadomość.

Aby poznać specyficzne dla runtime zachowanie czasowe i zależności, zobacz
[Kolejka sterowania](/pl/concepts/queue-steering). Aby poznać jawne polecenie `/steer <message>`,
zobacz [Steruj](/pl/tools/steer).

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

Opcje mają zastosowanie do dostarczania z kolejki. `debounceMs` ustawia też okno
ciszy sterowania Codex w trybie `steer`:

- `debounceMs`: okno ciszy przed opróżnieniem kolejkowanych followupów lub partii collect; w trybie Codex `steer`, okno ciszy przed wysłaniem zbiorczego `turn/steer`. Same liczby oznaczają milisekundy; jednostki `ms`, `s`, `m`, `h` i `d` są akceptowane przez opcje `/queue`.
- `cap`: maksymalna liczba wiadomości w kolejce na sesję. Wartości poniżej `1` są ignorowane.
- `drop: "summarize"`: domyślnie. Odrzucaj najstarsze wpisy z kolejki według potrzeb, zachowuj zwięzłe podsumowania i wstrzykuj je jako syntetyczny prompt followup.
- `drop: "old"`: odrzucaj najstarsze wpisy z kolejki według potrzeb, bez zachowywania podsumowań.
- `drop: "new"`: odrzuć najnowszą wiadomość, gdy kolejka jest już pełna.

Domyślne ustawienia: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Sterowanie i streaming

Gdy streaming kanału ma wartość `partial` lub `block`, sterowanie może wyglądać jak kilka
krótkich widocznych odpowiedzi, podczas gdy aktywne uruchomienie dociera do granic runtime:

- `partial`: podgląd może zakończyć się wcześnie, a potem nowy podgląd zaczyna się po
  zaakceptowaniu sterowania.
- `block`: bloki o rozmiarze szkicu mogą tworzyć taki sam sekwencyjny wygląd.
- Bez streamingu sterowanie wraca do followupu po aktywnym uruchomieniu, gdy
  runtime nie może przyjąć sterowania w tej samej turze.

`steer` nie przerywa narzędzi w toku. Użyj `/queue interrupt`, gdy najnowsza
wiadomość powinna przerwać bieżące uruchomienie.

## Pierwszeństwo

Przy wyborze trybu OpenClaw rozstrzyga:

1. Wbudowane lub zapisane nadpisanie `/queue` per sesja.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Domyślne `steer`.

Dla opcji wbudowane lub zapisane opcje `/queue` mają pierwszeństwo przed konfiguracją. Następnie
stosowane są debounce specyficzny dla kanału (`messages.queue.debounceMsByChannel`), domyślne
debounce Plugin, globalne opcje `messages.queue` i wbudowane ustawienia domyślne. `cap` i `drop` są
opcjami globalnymi/sesyjnymi, a nie kluczami konfiguracji per kanał.

## Nadpisania per sesja

- Wyślij `/queue <steer|followup|collect|interrupt>` jako samodzielne polecenie, aby zapisać tryb kolejki dla bieżącej sesji.
- Opcje można łączyć: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` lub `/queue reset` czyści nadpisanie sesji.

## Zakres i gwarancje

- Dotyczy uruchomień agenta automatycznych odpowiedzi we wszystkich kanałach przychodzących, które używają potoku odpowiedzi Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat itd.).
- Domyślny tor (`main`) jest ogólny dla procesu dla przychodzących wiadomości + głównych Heartbeat; ustaw `agents.defaults.maxConcurrent`, aby pozwolić na wiele sesji równolegle.
- Mogą istnieć dodatkowe tory (np. `cron`, `cron-nested`, `nested`, `subagent`), aby zadania w tle mogły działać równolegle bez blokowania odpowiedzi przychodzących. Izolowane tury agenta Cron zajmują slot `cron`, podczas gdy ich wewnętrzne wykonanie agenta używa `cron-nested`; oba używają `cron.maxConcurrentRuns`. Współdzielone przepływy niebędące Cron `nested` zachowują własne zachowanie toru. Te odłączone uruchomienia są śledzone jako [zadania w tle](/pl/automation/tasks).
- Tory per sesja gwarantują, że tylko jedno uruchomienie agenta dotyka danej sesji naraz.
- Brak zewnętrznych zależności lub wątków pracowników w tle; czysty TypeScript + obietnice.

## Rozwiązywanie problemów

- Jeśli polecenia wydają się zablokowane, włącz szczegółowe logi i szukaj wierszy "queued for ...ms", aby potwierdzić, że kolejka się opróżnia.
- Jeśli potrzebujesz głębokości kolejki, włącz szczegółowe logi i obserwuj wiersze czasu kolejki.
- Uruchomienia serwera aplikacji Codex, które przyjmują turę, a potem przestają emitować postęp, są przerywane przez adapter Codex, aby aktywny tor sesji mógł się zwolnić zamiast czekać na timeout zewnętrznego uruchomienia.
- Gdy diagnostyka jest włączona, sesje, które pozostają w `processing` po `diagnostics.stuckSessionWarnMs` bez zaobserwowanej odpowiedzi, narzędzia, statusu, bloku lub postępu ACP, są klasyfikowane według bieżącej aktywności. Aktywna praca loguje się jako `session.long_running`; posiadane ciche wywołania modelu również pozostają `session.long_running` do `diagnostics.stuckSessionAbortMs`, aby wolni lub niestreamujący dostawcy nie byli zgłaszani jako zablokowani zbyt wcześnie. Aktywna praca bez niedawnego postępu loguje się jako `session.stalled`; posiadane wywołania modelu przełączają się na `session.stalled` na progu przerwania lub po nim, a przestarzała aktywność modelu/narzędzia bez właściciela nie jest ukrywana jako długotrwała. `session.stuck` jest zarezerwowane dla odtwarzalnej przestarzałej księgowości sesji, w tym bezczynnych sesji w kolejce z przestarzałą aktywnością modelu/narzędzia bez właściciela, i tylko ta ścieżka może zwolnić dotknięty tor sesji, aby praca w kolejce została opróżniona. Powtarzające się diagnostyki `session.stuck` wycofują się, dopóki sesja pozostaje niezmieniona.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Kolejka sterowania](/pl/concepts/queue-steering)
- [Steruj](/pl/tools/steer)
- [Zasady ponawiania](/pl/concepts/retry)
