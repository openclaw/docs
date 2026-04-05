---
read_when:
    - Chcesz zadać szybkie pytanie poboczne dotyczące bieżącej sesji
    - Implementujesz lub debugujesz działanie BTW w różnych klientach
summary: Efemeryczne pytania poboczne z użyciem /btw
title: Pytania poboczne BTW
x-i18n:
    generated_at: "2026-04-05T14:07:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: aeef33ba19eb0561693fecea9dd39d6922df93be0b9a89446ed17277bcee58aa
    source_path: tools/btw.md
    workflow: 15
---

# Pytania poboczne BTW

`/btw` pozwala zadać szybkie pytanie poboczne dotyczące **bieżącej sesji** bez
zamieniania tego pytania w zwykłą historię rozmowy.

Jest wzorowane na zachowaniu `/btw` w Claude Code, ale dostosowane do architektury
Gateway i wielokanałowej architektury OpenClaw.

## Co robi

Gdy wyślesz:

```text
/btw what changed?
```

OpenClaw:

1. zapisuje migawkę kontekstu bieżącej sesji,
2. uruchamia osobne wywołanie modelu **bez narzędzi**,
3. odpowiada tylko na pytanie poboczne,
4. pozostawia główne uruchomienie bez zmian,
5. **nie** zapisuje pytania BTW ani odpowiedzi do historii sesji,
6. emituje odpowiedź jako **wynik poboczny na żywo** zamiast zwykłej wiadomości asystenta.

Najważniejszy model mentalny jest taki:

- ten sam kontekst sesji
- osobne jednorazowe zapytanie poboczne
- brak wywołań narzędzi
- brak zanieczyszczania przyszłego kontekstu
- brak trwałego zapisu transkryptu

## Czego nie robi

`/btw` **nie**:

- tworzy nowej trwałej sesji,
- kontynuuje niedokończonego głównego zadania,
- uruchamia narzędzi ani pętli narzędzi agenta,
- zapisuje danych pytania/odpowiedzi BTW do historii transkryptu,
- pojawia się w `chat.history`,
- przetrwa przeładowania.

Jest celowo **efemeryczne**.

## Jak działa kontekst

BTW używa bieżącej sesji wyłącznie jako **kontekstu w tle**.

Jeśli główne uruchomienie jest obecnie aktywne, OpenClaw zapisuje migawkę bieżącego
stanu wiadomości i dołącza trwający główny prompt jako kontekst w tle, jednocześnie
jawnie informując model, aby:

- odpowiadał tylko na pytanie poboczne,
- nie wznawiał ani nie kończył niedokończonego głównego zadania,
- nie emitował wywołań narzędzi ani pseudo-wywołań narzędzi.

To utrzymuje BTW w izolacji od głównego uruchomienia, a jednocześnie pozwala mu
wiedzieć, czego dotyczy sesja.

## Model dostarczania

BTW **nie** jest dostarczane jako zwykła wiadomość asystenta w transkrypcie.

Na poziomie protokołu Gateway:

- zwykły czat asystenta używa zdarzenia `chat`
- BTW używa zdarzenia `chat.side_result`

To rozdzielenie jest celowe. Gdyby BTW używało tej samej ścieżki zwykłego zdarzenia `chat`,
klienci traktowaliby je jak zwykłą historię rozmowy.

Ponieważ BTW używa osobnego zdarzenia na żywo i nie jest odtwarzane z
`chat.history`, znika po przeładowaniu.

## Zachowanie na powierzchniach

### TUI

W TUI BTW jest renderowane inline w bieżącym widoku sesji, ale nadal pozostaje
efemeryczne:

- wyraźnie odróżnia się od zwykłej odpowiedzi asystenta
- można je zamknąć klawiszem `Enter` lub `Esc`
- nie jest odtwarzane po przeładowaniu

### Kanały zewnętrzne

Na kanałach takich jak Telegram, WhatsApp i Discord, BTW jest dostarczane jako
wyraźnie oznaczona jednorazowa odpowiedź, ponieważ te powierzchnie nie mają lokalnej
koncepcji efemerycznej nakładki.

Odpowiedź nadal jest traktowana jako wynik poboczny, a nie zwykła historia sesji.

### Control UI / web

Gateway emituje BTW poprawnie jako `chat.side_result`, a BTW nie jest uwzględniane
w `chat.history`, więc kontrakt trwałości jest już poprawny dla web.

Obecne Control UI nadal potrzebuje dedykowanego konsumenta `chat.side_result`, aby
renderować BTW na żywo w przeglądarce. Dopóki ta obsługa po stronie klienta nie zostanie dodana,
BTW jest funkcją na poziomie Gateway z pełnym zachowaniem w TUI i kanałach zewnętrznych,
ale jeszcze bez kompletnego UX w przeglądarce.

## Kiedy używać BTW

Używaj `/btw`, gdy chcesz:

- szybkiego doprecyzowania dotyczącego bieżącej pracy,
- rzeczowej odpowiedzi pobocznej, gdy długie uruchomienie nadal trwa,
- tymczasowej odpowiedzi, która nie powinna stać się częścią przyszłego kontekstu sesji.

Przykłady:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## Kiedy nie używać BTW

Nie używaj `/btw`, gdy chcesz, aby odpowiedź stała się częścią
przyszłego kontekstu roboczego sesji.

W takim przypadku zadaj pytanie normalnie w głównej sesji zamiast używać BTW.

## Powiązane

- [Polecenia slash](/tools/slash-commands)
- [Poziomy myślenia](/tools/thinking)
- [Sesja](/pl/concepts/session)
