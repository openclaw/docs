---
read_when:
    - Wyjaśnianie, jak zachowuje się sterowanie, gdy agent używa narzędzi
    - Zmiana zachowania kolejki aktywnych uruchomień lub integracji sterowania runtime
    - Porównywanie sterowania z trybami kolejki followup, collect i interrupt
summary: Jak sterowanie aktywnym uruchomieniem kolejkuje wiadomości na granicach środowiska wykonawczego
title: Kolejka sterowania
x-i18n:
    generated_at: "2026-06-27T17:29:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Gdy podczas strumieniowania uruchomienia sesji nadejdzie zwykły prompt, OpenClaw
domyślnie próbuje wysłać ten prompt do aktywnego środowiska uruchomieniowego, gdy tryb kolejki
to `steer`. Do tego domyślnego zachowania nie jest wymagana żadna pozycja konfiguracji
ani dyrektywa kolejki. OpenClaw i natywny harness app-server Codex implementują szczegóły
dostarczania w różny sposób.

## Granica środowiska uruchomieniowego

Sterowanie nie przerywa już działającego wywołania narzędzia. OpenClaw sprawdza
zakolejkowane komunikaty sterujące na granicach modelu:

1. Asystent prosi o wywołania narzędzi.
2. OpenClaw wykonuje bieżącą partię wywołań narzędzi z komunikatu asystenta.
3. OpenClaw emituje zdarzenie zakończenia tury.
4. OpenClaw opróżnia zakolejkowane komunikaty sterujące.
5. OpenClaw dołącza te komunikaty jako komunikaty użytkownika przed następnym wywołaniem LLM.

Dzięki temu wyniki narzędzi pozostają powiązane z komunikatem asystenta, który o nie poprosił,
a następne wywołanie modelu widzi najnowsze dane wejściowe użytkownika.

Natywny harness app-server Codex udostępnia `turn/steer` zamiast wewnętrznej kolejki
sterowania środowiska uruchomieniowego OpenClaw. OpenClaw grupuje zakolejkowane prompty dla skonfigurowanego
okna ciszy, a następnie wysyła pojedyncze żądanie `turn/steer` ze wszystkimi zebranymi danymi wejściowymi
użytkownika w kolejności nadejścia.

Tury przeglądu Codex i ręcznej Compaction odrzucają sterowanie w tej samej turze. Gdy
środowisko uruchomieniowe nie może zaakceptować sterowania w trybie `steer`, OpenClaw czeka na zakończenie
aktywnego uruchomienia przed rozpoczęciem promptu.

Ta strona wyjaśnia sterowanie w trybie kolejki dla zwykłych komunikatów przychodzących, gdy tryb
to `steer`. Jeśli tryb to `followup` lub `collect`, zwykłe komunikaty nie trafiają
na tę ścieżkę sterowania; czekają, aż aktywne uruchomienie się zakończy. Informacje o jawnym
poleceniu `/steer <message>` znajdziesz w sekcji [Sterowanie](/pl/tools/steer).

## Tryby

| Tryb        | Zachowanie podczas aktywnego uruchomienia              | Późniejsze zachowanie                                                               |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Steruje promptem do aktywnego środowiska uruchomieniowego, gdy jest to możliwe. | Czeka na zakończenie aktywnego uruchomienia, jeśli sterowanie jest niedostępne.     |
| `followup`  | Nie steruje.                                           | Uruchamia zakolejkowane komunikaty później, po zakończeniu aktywnego uruchomienia.  |
| `collect`   | Nie steruje.                                           | Scala zgodne zakolejkowane komunikaty w jedną późniejszą turę po oknie debounce.    |
| `interrupt` | Przerywa aktywne uruchomienie zamiast nim sterować.    | Uruchamia najnowszy komunikat po przerwaniu.                                        |

## Przykład serii

Jeśli czterech użytkowników wyśle komunikaty, gdy agent wykonuje wywołanie narzędzia:

- Przy domyślnym zachowaniu aktywne środowisko uruchomieniowe otrzymuje wszystkie cztery komunikaty w
  kolejności nadejścia przed następną decyzją modelu. OpenClaw opróżnia je na następnej granicy modelu;
  Codex otrzymuje je jako jedno zgrupowane `turn/steer`.
- Przy `/queue collect` OpenClaw nie steruje. Czeka, aż aktywne uruchomienie
  się zakończy, a następnie tworzy turę followup ze zgodnymi zakolejkowanymi komunikatami po
  oknie debounce.
- Przy `/queue interrupt` OpenClaw przerywa aktywne uruchomienie i uruchamia najnowszy
  komunikat zamiast sterować.

## Zakres

Sterowanie zawsze kieruje na bieżące aktywne uruchomienie sesji. Nie tworzy nowej
sesji, nie zmienia zasad narzędzi aktywnego uruchomienia ani nie dzieli komunikatów według nadawcy. W
kanałach z wieloma użytkownikami prompty przychodzące zawierają już kontekst nadawcy i trasy, więc
następne wywołanie modelu widzi, kto wysłał każdy komunikat.

Użyj `followup` lub `collect`, gdy chcesz, aby komunikaty były domyślnie kolejkowane zamiast
sterować aktywnym uruchomieniem. Użyj `interrupt`, gdy najnowszy prompt powinien
zastąpić aktywne uruchomienie.

## Debounce

`messages.queue.debounceMs` dotyczy zakolejkowanego dostarczania `followup` i `collect`.
W trybie `steer` z natywnym harnessem Codex ustawia też okno ciszy
przed wysłaniem zgrupowanego `turn/steer`. W przypadku OpenClaw samo aktywne sterowanie nie używa
timera debounce, ponieważ OpenClaw naturalnie grupuje komunikaty do następnej granicy modelu.

## Powiązane

- [Kolejka poleceń](/pl/concepts/queue)
- [Sterowanie](/pl/tools/steer)
- [Komunikaty](/pl/concepts/messages)
- [Pętla agenta](/pl/concepts/agent-loop)
