---
read_when:
    - Chcesz zadać szybkie poboczne pytanie dotyczące bieżącej sesji
    - Implementujesz lub debugujesz zachowanie BTW w różnych klientach
summary: Poboczne, efemeryczne pytania za pomocą `/btw`
title: Poboczne pytania BTW
x-i18n:
    generated_at: "2026-04-24T09:35:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` pozwala zadać szybkie poboczne pytanie dotyczące **bieżącej sesji** bez
zamieniania tego pytania w zwykłą historię rozmowy.

Jest wzorowane na zachowaniu `/btw` w Claude Code, ale dostosowane do architektury
Gateway i wielokanałowej architektury OpenClaw.

## Co to robi

Gdy wyślesz:

```text
/btw co się zmieniło?
```

OpenClaw:

1. tworzy migawkę bieżącego kontekstu sesji,
2. uruchamia oddzielne **bez-narzędziowe** wywołanie modelu,
3. odpowiada wyłącznie na poboczne pytanie,
4. pozostawia główny przebieg bez zmian,
5. **nie** zapisuje pytania ani odpowiedzi BTW do historii sesji,
6. emituje odpowiedź jako **wynik poboczny na żywo**, a nie jako zwykłą wiadomość asystenta.

Ważny model mentalny to:

- ten sam kontekst sesji
- oddzielne jednorazowe zapytanie poboczne
- brak wywołań narzędzi
- brak zanieczyszczania przyszłego kontekstu
- brak utrwalania w transkrypcji

## Czego to nie robi

`/btw` **nie**:

- tworzy nowej trwałej sesji,
- kontynuuje niedokończonego głównego zadania,
- uruchamia narzędzi ani pętli narzędzi agenta,
- zapisuje danych pytania/odpowiedzi BTW do historii transkrypcji,
- pojawia się w `chat.history`,
- przetrwa przeładowania.

Jest celowo **efemeryczne**.

## Jak działa kontekst

BTW używa bieżącej sesji wyłącznie jako **kontekstu w tle**.

Jeśli główny przebieg jest obecnie aktywny, OpenClaw tworzy migawkę bieżącego
stanu wiadomości i dołącza trwający prompt główny jako kontekst w tle, jednocześnie
jawnie instruując model, aby:

- odpowiadał tylko na poboczne pytanie,
- nie wznawiał ani nie kończył niedokończonego głównego zadania,
- nie emitował wywołań narzędzi ani pseudo-wywołań narzędzi.

Dzięki temu BTW pozostaje odseparowane od głównego przebiegu, a jednocześnie
wie, czego dotyczy sesja.

## Model dostarczania

BTW **nie** jest dostarczane jako zwykła wiadomość asystenta w transkrypcji.

Na poziomie protokołu Gateway:

- zwykły czat asystenta używa zdarzenia `chat`
- BTW używa zdarzenia `chat.side_result`

To rozdzielenie jest celowe. Gdyby BTW używało zwykłej ścieżki zdarzenia `chat`,
klienci traktowaliby je jak zwykłą historię rozmowy.

Ponieważ BTW używa oddzielnego zdarzenia na żywo i nie jest odtwarzane z
`chat.history`, znika po przeładowaniu.

## Zachowanie powierzchni

### TUI

W TUI BTW jest renderowane inline w widoku bieżącej sesji, ale pozostaje
efemeryczne:

- jest wyraźnie odróżnione od zwykłej odpowiedzi asystenta
- można je zamknąć klawiszem `Enter` lub `Esc`
- nie jest odtwarzane po przeładowaniu

### Kanały zewnętrzne

W kanałach takich jak Telegram, WhatsApp i Discord BTW jest dostarczane jako
wyraźnie oznaczona jednorazowa odpowiedź, ponieważ te powierzchnie nie mają
lokalnej koncepcji efemerycznej nakładki.

Odpowiedź nadal jest traktowana jako wynik poboczny, a nie zwykła historia sesji.

### Control UI / web

Gateway poprawnie emituje BTW jako `chat.side_result`, a BTW nie jest uwzględniane
w `chat.history`, więc kontrakt trwałości dla web jest już poprawny.

Obecne Control UI nadal wymaga dedykowanego konsumenta `chat.side_result`, aby
renderować BTW na żywo w przeglądarce. Dopóki ta obsługa po stronie klienta nie zostanie dodana, BTW jest funkcją na poziomie Gateway z pełnym zachowaniem w TUI i kanałach zewnętrznych, ale jeszcze bez kompletnego UX w przeglądarce.

## Kiedy używać BTW

Użyj `/btw`, gdy chcesz:

- szybko doprecyzować coś w bieżącej pracy,
- uzyskać faktyczną odpowiedź poboczną, gdy długi przebieg nadal trwa,
- otrzymać tymczasową odpowiedź, która nie powinna stać się częścią przyszłego kontekstu sesji.

Przykłady:

```text
/btw jaki plik edytujemy?
/btw co oznacza ten błąd?
/btw podsumuj bieżące zadanie w jednym zdaniu
/btw ile to 17 * 19?
```

## Kiedy nie używać BTW

Nie używaj `/btw`, jeśli chcesz, aby odpowiedź stała się częścią przyszłego
kontekstu roboczego sesji.

W takim przypadku zadaj pytanie normalnie w głównej sesji zamiast używać BTW.

## Powiązane

- [Polecenia ukośnikowe](/pl/tools/slash-commands)
- [Poziomy myślenia](/pl/tools/thinking)
- [Sesja](/pl/concepts/session)
