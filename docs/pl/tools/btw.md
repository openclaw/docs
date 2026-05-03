---
read_when:
    - Chcesz zadać szybkie pytanie poboczne dotyczące bieżącej sesji
    - Implementujesz lub debugujesz zachowanie BTW w różnych klientach
summary: Ulotne pytania poboczne przy użyciu /btw
title: 'Przy okazji: pytania poboczne'
x-i18n:
    generated_at: "2026-05-03T21:37:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f09ee066c02d31c9fbd66de1922f7a03fe2b48f1ba2c969c65551376e92c80d4
    source_path: tools/btw.md
    workflow: 16
---

`/btw` pozwala zadać szybkie pytanie poboczne dotyczące **bieżącej sesji** bez
zamieniania tego pytania w normalną historię rozmowy. `/side` jest aliasem.

Jest wzorowane na zachowaniu `/btw` w Claude Code, ale dostosowane do Gateway
OpenClaw i architektury wielokanałowej.

## Co robi

Gdy wyślesz:

```text
/btw what changed?
```

OpenClaw:

1. tworzy migawkę bieżącego kontekstu sesji,
2. uruchamia osobne wywołanie modelu **bez użycia narzędzi**,
3. odpowiada tylko na pytanie poboczne,
4. pozostawia główne uruchomienie bez zmian,
5. **nie** zapisuje pytania ani odpowiedzi BTW w historii sesji,
6. emituje odpowiedź jako **wynik poboczny na żywo**, a nie normalną wiadomość asystenta.

Ważny model mentalny to:

- ten sam kontekst sesji
- osobne jednorazowe zapytanie poboczne
- brak wywołań narzędzi
- brak zanieczyszczania przyszłego kontekstu
- brak trwałego zapisu transkrypcji

## Czego nie robi

`/btw` **nie**:

- tworzy nowej trwałej sesji,
- kontynuuje niedokończonego głównego zadania,
- uruchamia narzędzi ani pętli narzędzi agenta,
- zapisuje danych pytania/odpowiedzi BTW w historii transkrypcji,
- pojawia się w `chat.history`,
- przetrwa ponownego wczytania.

Jest celowo **efemeryczne**.

## Jak działa kontekst

BTW używa bieżącej sesji wyłącznie jako **kontekstu tła**.

Jeśli główne uruchomienie jest obecnie aktywne, OpenClaw tworzy migawkę
bieżącego stanu wiadomości i dołącza trwający główny prompt jako kontekst tła,
jednocześnie wyraźnie instruując model:

- odpowiedz tylko na pytanie poboczne,
- nie wznawiaj ani nie kończ niedokończonego głównego zadania,
- nie emituj wywołań narzędzi ani pseudo-wywołań narzędzi.

Dzięki temu BTW pozostaje odizolowane od głównego uruchomienia, a jednocześnie
wie, czego dotyczy sesja.

## Model dostarczania

BTW **nie** jest dostarczane jako normalna wiadomość asystenta w transkrypcji.

Na poziomie protokołu Gateway:

- normalny czat asystenta używa zdarzenia `chat`
- BTW używa zdarzenia `chat.side_result`

Ten rozdział jest celowy. Gdyby BTW ponownie używało normalnej ścieżki zdarzenia
`chat`, klienci traktowaliby je jak zwykłą historię rozmowy.

Ponieważ BTW używa osobnego zdarzenia na żywo i nie jest odtwarzane z
`chat.history`, znika po ponownym wczytaniu.

## Zachowanie na powierzchniach

### TUI

W TUI BTW jest renderowane inline w bieżącym widoku sesji, ale pozostaje
efemeryczne:

- widocznie odróżnione od normalnej odpowiedzi asystenta
- możliwe do odrzucenia za pomocą `Enter` lub `Esc`
- nieodtwarzane po ponownym wczytaniu

### Kanały zewnętrzne

W kanałach takich jak Telegram, WhatsApp i Discord BTW jest dostarczane jako
wyraźnie oznaczona jednorazowa odpowiedź, ponieważ te powierzchnie nie mają
lokalnej koncepcji efemerycznej nakładki.

Odpowiedź nadal jest traktowana jako wynik poboczny, a nie normalna historia
sesji.

### Control UI / web

Gateway poprawnie emituje BTW jako `chat.side_result`, a BTW nie jest uwzględniane
w `chat.history`, więc kontrakt trwałości dla web jest już poprawny.

Obecny Control UI nadal potrzebuje dedykowanego konsumenta `chat.side_result`,
aby renderować BTW na żywo w przeglądarce. Dopóki ta obsługa po stronie klienta
nie zostanie dostarczona, BTW jest funkcją na poziomie Gateway z pełnym
zachowaniem w TUI i kanałach zewnętrznych, ale jeszcze bez kompletnego UX w
przeglądarce.

## Kiedy używać BTW

Użyj `/btw`, gdy chcesz uzyskać:

- szybkie doprecyzowanie dotyczące bieżącej pracy,
- rzeczową odpowiedź poboczną, gdy długie uruchomienie wciąż trwa,
- tymczasową odpowiedź, która nie powinna stać się częścią przyszłego kontekstu sesji.

Przykłady:

```text
/btw what file are we editing?
/side what changed while the main run continued?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kiedy nie używać BTW

Nie używaj `/btw`, gdy chcesz, aby odpowiedź stała się częścią przyszłego
kontekstu roboczego sesji.

W takim przypadku zapytaj normalnie w głównej sesji zamiast używać BTW.

## Powiązane

- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
- [Poziomy myślenia](/pl/tools/thinking)
- [Sesja](/pl/concepts/session)
