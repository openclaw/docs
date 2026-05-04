---
read_when:
    - Wyjaśnienie działania sterowania, gdy agent używa narzędzi
    - Zmiana zachowania kolejki aktywnych uruchomień lub integracji sterowania w czasie wykonywania
    - Porównanie trybów steer, queue, collect i followup
summary: Jak sterowanie aktywnym uruchomieniem kolejkuje wiadomości na granicach czasu wykonywania
title: Kolejka sterowania
x-i18n:
    generated_at: "2026-05-04T02:23:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Gdy wiadomość nadejdzie, gdy uruchomienie sesji już strumieniuje, OpenClaw może wysłać tę wiadomość do aktywnego środowiska uruchomieniowego zamiast rozpoczynać kolejne uruchomienie dla tej samej sesji. Publiczne tryby są niezależne od środowiska uruchomieniowego; Pi i natywny mechanizm app-server Codex implementują szczegóły dostarczania inaczej.

## Granica środowiska uruchomieniowego

Sterowanie nie przerywa wywołania narzędzia, które już działa. Pi sprawdza oczekujące wiadomości sterujące na granicach modelu:

1. Asystent prosi o wywołania narzędzi.
2. Pi wykonuje partię wywołań narzędzi z bieżącej wiadomości asystenta.
3. Pi emituje zdarzenie zakończenia tury.
4. Pi opróżnia oczekujące wiadomości sterujące.
5. Pi dołącza te wiadomości jako wiadomości użytkownika przed następnym wywołaniem LLM.

Dzięki temu wyniki narzędzi pozostają sparowane z wiadomością asystenta, która o nie poprosiła, a następne wywołanie modelu widzi najnowsze dane wejściowe użytkownika.

Natywny mechanizm app-server Codex udostępnia `turn/steer` zamiast wewnętrznej kolejki sterowania Pi. OpenClaw dostosowuje tam te same tryby:

- `steer` grupuje oczekujące wiadomości przez skonfigurowane okno ciszy, a następnie wysyła pojedyncze żądanie `turn/steer` ze wszystkimi zebranymi danymi wejściowymi użytkownika w kolejności nadejścia.
- `queue` zachowuje starszy serializowany kształt, wysyłając oddzielne żądania `turn/steer`.
- `followup`, `collect`, `steer-backlog` i `interrupt` pozostają obsługiwaną przez OpenClaw logiką kolejki wokół aktywnej tury Codex.

Tury przeglądu Codex i ręcznej Compaction odrzucają sterowanie w tej samej turze. Gdy środowisko uruchomieniowe nie może przyjąć sterowania, OpenClaw wraca do kolejki uzupełniającej tam, gdzie dany tryb na to pozwala.

Ta strona wyjaśnia sterowanie w trybie kolejki dla zwykłych wiadomości przychodzących. Informacje o jawnym poleceniu `/steer <message>` znajdziesz w [Steer](/pl/tools/steer).

## Tryby

| Tryb            | Zachowanie podczas aktywnego uruchomienia                                                                                                          | Zachowanie późniejszego uzupełnienia                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Wstrzykuje wszystkie oczekujące wiadomości sterujące razem na następnej granicy środowiska uruchomieniowego. To ustawienie domyślne.                             | Wraca do uzupełnienia tylko wtedy, gdy sterowanie jest niedostępne.                           |
| `queue`         | Starsze sterowanie pojedynczo. Pi wstrzykuje jedną oczekującą wiadomość na granicę modelu; Codex wysyła oddzielne żądania `turn/steer`. | Wraca do uzupełnienia tylko wtedy, gdy sterowanie jest niedostępne.                           |
| `steer-backlog` | Takie samo zachowanie sterowania aktywnego uruchomienia jak `steer`.                                                                                | Zachowuje też tę samą wiadomość dla późniejszej tury uzupełniającej.                              |
| `followup`      | Nie steruje bieżącym uruchomieniem.                                                                                              | Uruchamia oczekujące wiadomości później.                                                         |
| `collect`       | Nie steruje bieżącym uruchomieniem.                                                                                              | Scala zgodne oczekujące wiadomości w jedną późniejszą turę po oknie debounce. |
| `interrupt`     | Przerywa aktywne uruchomienie, a następnie uruchamia najnowszą wiadomość.                                                                       | Brak.                                                                               |

## Przykład serii

Jeśli czterech użytkowników wyśle wiadomości, gdy agent wykonuje wywołanie narzędzia:

- `steer`: aktywne środowisko uruchomieniowe otrzymuje wszystkie cztery wiadomości w kolejności nadejścia przed następną decyzją modelu. Pi opróżnia je na następnej granicy modelu; Codex otrzymuje je jako jedno zgrupowane `turn/steer`.
- `queue`: starsze serializowane sterowanie. Pi wstrzykuje po jednej oczekującej wiadomości naraz; Codex otrzymuje oddzielne żądania `turn/steer`.
- `collect`: OpenClaw czeka, aż aktywne uruchomienie się zakończy, a następnie tworzy turę uzupełniającą ze zgodnymi oczekującymi wiadomościami po oknie debounce.

## Zakres

Sterowanie zawsze celuje w bieżące aktywne uruchomienie sesji. Nie tworzy nowej sesji, nie zmienia zasad narzędzi aktywnego uruchomienia ani nie dzieli wiadomości według nadawcy. W kanałach wieloużytkownikowych prompty przychodzące zawierają już kontekst nadawcy i trasy, więc następne wywołanie modelu może zobaczyć, kto wysłał każdą wiadomość.

Użyj `collect`, gdy chcesz, aby OpenClaw utworzył późniejszą turę uzupełniającą, która może scalić zgodne wiadomości i zachować zasady odrzucania kolejki uzupełniającej. Używaj `queue` tylko wtedy, gdy potrzebujesz starszego zachowania sterowania po jednej wiadomości naraz.

## Debounce

`messages.queue.debounceMs` dotyczy dostarczania uzupełniającego, w tym `collect`, `followup`, `steer-backlog` oraz awaryjnego `steer`, gdy sterowanie aktywnym uruchomieniem nie jest dostępne. W przypadku Pi samo aktywne `steer` nie używa timera debounce, ponieważ Pi naturalnie grupuje wiadomości do następnej granicy modelu. W przypadku natywnego mechanizmu Codex OpenClaw używa tej samej wartości debounce jako okna ciszy przed wysłaniem zgrupowanego `turn/steer`.

## Powiązane

- [Kolejka poleceń](/pl/concepts/queue)
- [Steer](/pl/tools/steer)
- [Wiadomości](/pl/concepts/messages)
- [Pętla agenta](/pl/concepts/agent-loop)
