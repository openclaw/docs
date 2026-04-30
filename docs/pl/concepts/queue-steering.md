---
read_when:
    - Wyjaśnienie, jak działa sterowanie, gdy agent używa narzędzi
    - Zmiana zachowania kolejki aktywnych uruchomień lub integracji sterowania środowiskiem uruchomieniowym
    - Porównanie trybów steer, queue, collect i followup
summary: Jak sterowanie aktywnym przebiegiem kolejkuje wiadomości na granicach środowiska wykonawczego
title: Kolejka sterowania
x-i18n:
    generated_at: "2026-04-30T09:49:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Gdy wiadomość nadejdzie, kiedy przebieg sesji już strumieniuje, OpenClaw może
wysłać tę wiadomość do aktywnego środowiska wykonawczego zamiast rozpoczynać
kolejny przebieg dla tej samej sesji. Tryby publiczne są neutralne względem
środowiska wykonawczego; Pi i natywny mechanizm serwera aplikacji Codex
implementują szczegóły dostarczania inaczej.

## Granica środowiska wykonawczego

Sterowanie nie przerywa wywołania narzędzia, które już działa. Pi sprawdza
zakolejkowane wiadomości sterujące na granicach modelu:

1. Asystent prosi o wywołania narzędzi.
2. Pi wykonuje bieżącą partię wywołań narzędzi z wiadomości asystenta.
3. Pi emituje zdarzenie końca tury.
4. Pi opróżnia zakolejkowane wiadomości sterujące.
5. Pi dołącza te wiadomości jako wiadomości użytkownika przed następnym wywołaniem LLM.

Dzięki temu wyniki narzędzi pozostają sparowane z wiadomością asystenta, która o
nie poprosiła, a następne wywołanie modelu widzi najnowsze dane wejściowe
użytkownika.

Natywny mechanizm serwera aplikacji Codex udostępnia `turn/steer` zamiast
wewnętrznej kolejki sterowania Pi. OpenClaw adaptuje tam te same tryby:

- `steer` grupuje zakolejkowane wiadomości przez skonfigurowane okno ciszy, a
  następnie wysyła pojedyncze żądanie `turn/steer` ze wszystkimi zebranymi
  danymi wejściowymi użytkownika w kolejności nadejścia.
- `queue` zachowuje starszy, serializowany kształt przez wysyłanie osobnych
  żądań `turn/steer`.
- `followup`, `collect`, `steer-backlog` i `interrupt` pozostają zachowaniem
  kolejki należącym do OpenClaw wokół aktywnej tury Codex.

Tury przeglądu Codex i ręcznej Compaction odrzucają sterowanie w tej samej
turze. Gdy środowisko wykonawcze nie może przyjąć sterowania, OpenClaw wraca do
kolejki followup tam, gdzie dany tryb na to pozwala.

## Tryby

| Tryb            | Zachowanie podczas aktywnego przebiegu                                                                                       | Późniejsze zachowanie followup                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Wstrzykuje wszystkie zakolejkowane wiadomości sterujące razem na następnej granicy środowiska wykonawczego. To ustawienie domyślne. | Wraca do followup tylko wtedy, gdy sterowanie jest niedostępne.                     |
| `queue`         | Starsze sterowanie po jednej wiadomości naraz. Pi wstrzykuje jedną zakolejkowaną wiadomość na granicę modelu; Codex wysyła osobne żądania `turn/steer`. | Wraca do followup tylko wtedy, gdy sterowanie jest niedostępne.                     |
| `steer-backlog` | Takie samo zachowanie sterowania podczas aktywnego przebiegu jak `steer`.                                                     | Zachowuje też tę samą wiadomość dla późniejszej tury followup.                      |
| `followup`      | Nie steruje bieżącym przebiegiem.                                                                                            | Uruchamia zakolejkowane wiadomości później.                                         |
| `collect`       | Nie steruje bieżącym przebiegiem.                                                                                            | Łączy zgodne zakolejkowane wiadomości w jedną późniejszą turę po oknie debounce.    |
| `interrupt`     | Przerywa aktywny przebieg, a następnie rozpoczyna najnowszą wiadomość.                                                        | Brak.                                                                               |

## Przykład serii wiadomości

Jeśli czterech użytkowników wyśle wiadomości, gdy agent wykonuje wywołanie
narzędzia:

- `steer`: aktywne środowisko wykonawcze otrzymuje wszystkie cztery wiadomości w
  kolejności nadejścia przed następną decyzją modelu. Pi opróżnia je na
  następnej granicy modelu; Codex otrzymuje je jako jedno zbiorcze `turn/steer`.
- `queue`: starsze, serializowane sterowanie. Pi wstrzykuje po jednej
  zakolejkowanej wiadomości naraz; Codex otrzymuje osobne żądania `turn/steer`.
- `collect`: OpenClaw czeka, aż aktywny przebieg się zakończy, a następnie
  tworzy turę followup ze zgodnymi zakolejkowanymi wiadomościami po oknie
  debounce.

## Zakres

Sterowanie zawsze celuje w bieżący aktywny przebieg sesji. Nie tworzy nowej
sesji, nie zmienia polityki narzędzi aktywnego przebiegu ani nie dzieli
wiadomości według nadawcy. W kanałach wieloużytkownikowych przychodzące prompty
zawierają już kontekst nadawcy i trasy, więc następne wywołanie modelu widzi,
kto wysłał każdą wiadomość.

Użyj `collect`, gdy chcesz, aby OpenClaw zbudował późniejszą turę followup, która
może połączyć zgodne wiadomości i zachować politykę odrzucania kolejki followup.
Używaj `queue` tylko wtedy, gdy potrzebujesz starszego zachowania sterowania po
jednej wiadomości naraz.

## Debounce

`messages.queue.debounceMs` ma zastosowanie do dostarczania followup, w tym
`collect`, `followup`, `steer-backlog` oraz awaryjnego zachowania `steer`, gdy
sterowanie aktywnym przebiegiem nie jest dostępne. W przypadku Pi samo aktywne
`steer` nie używa timera debounce, ponieważ Pi naturalnie grupuje wiadomości do
następnej granicy modelu. W przypadku natywnego mechanizmu Codex OpenClaw używa
tej samej wartości debounce jako okna ciszy przed wysłaniem zbiorczego
`turn/steer`.

## Powiązane

- [Kolejka poleceń](/pl/concepts/queue)
- [Wiadomości](/pl/concepts/messages)
- [Pętla agenta](/pl/concepts/agent-loop)
