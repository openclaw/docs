---
read_when:
    - Wyjaśnienie działania funkcji sterowania, gdy agent używa narzędzi
    - Zmiana działania kolejki aktywnych uruchomień lub integracji sterowania środowiskiem wykonawczym
    - Porównanie sterowania z trybami kolejki followup, collect i interrupt
summary: Jak sterowanie aktywnym uruchomieniem kolejkuje wiadomości na granicach środowiska wykonawczego
title: Kolejka sterowania
x-i18n:
    generated_at: "2026-07-12T15:05:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Gdy zwykły monit przychodzi w trakcie przesyłania strumieniowego wykonania sesji, a tryb kolejki to `steer` (domyślny, niewymagający konfiguracji), OpenClaw próbuje przekazać ten monit do aktywnego środowiska wykonawczego. OpenClaw i natywny mechanizm serwera aplikacji Codex realizują szczegóły dostarczania w różny sposób.

Ta strona opisuje sterowanie w trybie kolejki dla zwykłych wiadomości przychodzących w trybie `steer`. W trybie `followup` lub `collect` zwykłe wiadomości pomijają tę ścieżkę i czekają na zakończenie aktywnego wykonania. Informacje o jawnym poleceniu `/steer <message>` zawiera strona [Sterowanie](/pl/tools/steer).

## Granica środowiska wykonawczego

Sterowanie nie przerywa już trwającego wywołania narzędzia. OpenClaw sprawdza obecność oczekujących wiadomości sterujących na granicach wywołań modelu:

1. Asystent żąda wywołań narzędzi.
2. OpenClaw wykonuje partię wywołań narzędzi z bieżącej wiadomości asystenta.
3. OpenClaw emituje zdarzenie końca tury.
4. OpenClaw pobiera oczekujące wiadomości sterujące z kolejki.
5. OpenClaw dołącza te wiadomości jako wiadomości użytkownika przed następnym wywołaniem LLM.

Dzięki temu wyniki narzędzi pozostają powiązane z wiadomością asystenta, która o nie poprosiła, a następne wywołanie modelu uwzględnia najnowsze dane wejściowe użytkownika.

Natywny mechanizm serwera aplikacji Codex udostępnia `turn/steer` zamiast wewnętrznej kolejki sterowania środowiska wykonawczego OpenClaw. OpenClaw grupuje oczekujące monity w skonfigurowanym okresie bezczynności, a następnie wysyła pojedyncze żądanie `turn/steer` ze wszystkimi zebranymi danymi wejściowymi użytkowników w kolejności ich nadejścia.

Tury przeglądu Codex i ręcznej kompaktacji odrzucają sterowanie w tej samej turze. Gdy środowisko wykonawcze nie może przyjąć sterowania w trybie `steer`, OpenClaw czeka na zakończenie aktywnego wykonania przed uruchomieniem monitu.

## Tryby

| Tryb        | Zachowanie podczas aktywnego wykonania                              | Późniejsze zachowanie                                                                        |
| ----------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `steer`     | Przekazuje monit do aktywnego środowiska wykonawczego, jeśli może.  | Czeka na zakończenie aktywnego wykonania, jeśli sterowanie jest niedostępne.                   |
| `followup`  | Nie steruje.                                                        | Uruchamia oczekujące wiadomości później, po zakończeniu aktywnego wykonania.                   |
| `collect`   | Nie steruje.                                                        | Scala zgodne oczekujące wiadomości w jedną późniejszą turę po upływie okna eliminacji drgań.   |
| `interrupt` | Przerywa aktywne wykonanie zamiast nim sterować.                    | Po przerwaniu rozpoczyna przetwarzanie najnowszej wiadomości.                                 |

## Przykład serii wiadomości

Jeśli czterech użytkowników wyśle wiadomości podczas wykonywania przez agenta wywołania narzędzia:

- Przy domyślnym zachowaniu aktywne środowisko wykonawcze otrzymuje wszystkie cztery wiadomości w kolejności ich nadejścia przed podjęciem następnej decyzji przez model. OpenClaw pobiera je z kolejki na następnej granicy modelu; Codex otrzymuje je jako jedno zbiorcze żądanie `turn/steer`.
- Przy `/queue collect` OpenClaw nie steruje. Czeka na zakończenie aktywnego wykonania, a następnie po upływie okna eliminacji drgań tworzy turę uzupełniającą ze zgodnymi oczekującymi wiadomościami.
- Przy `/queue interrupt` OpenClaw przerywa aktywne wykonanie i zamiast sterowania rozpoczyna przetwarzanie najnowszej wiadomości.

## Zakres

Sterowanie zawsze dotyczy bieżącego aktywnego wykonania sesji. Nie tworzy nowej sesji, nie zmienia zasad używania narzędzi aktywnego wykonania ani nie rozdziela wiadomości według nadawcy. W kanałach wieloosobowych monity przychodzące zawierają już kontekst nadawcy i routingu, dzięki czemu następne wywołanie modelu może rozpoznać nadawcę każdej wiadomości.

Użyj `followup` lub `collect`, jeśli wiadomości mają domyślnie trafiać do kolejki zamiast sterować aktywnym wykonaniem. Użyj `interrupt`, jeśli najnowszy monit powinien zastąpić aktywne wykonanie.

## Eliminacja drgań

`messages.queue.debounceMs` ma zastosowanie do dostarczania oczekujących wiadomości w trybach `followup` i `collect`. W trybie `steer` z natywnym mechanizmem Codex określa również okres bezczynności przed wysłaniem zbiorczego żądania `turn/steer`. W przypadku OpenClaw aktywne sterowanie nie korzysta z licznika eliminacji drgań, ponieważ OpenClaw naturalnie grupuje wiadomości do następnej granicy modelu.

## Powiązane materiały

- [Kolejka poleceń](/pl/concepts/queue)
- [Sterowanie](/pl/tools/steer)
- [Wiadomości](/pl/concepts/messages)
- [Pętla agenta](/pl/concepts/agent-loop)
