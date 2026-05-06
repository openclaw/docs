---
read_when:
    - Chcesz zadać krótkie pytanie poboczne dotyczące bieżącej sesji
    - Wdrażasz lub debugujesz zachowanie BTW w różnych klientach
summary: Tymczasowe pytania poboczne z /btw
title: 'Przy okazji: pytania poboczne'
x-i18n:
    generated_at: "2026-05-06T09:31:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 356c9817001ba77271c671d20b45640f9d8178ced178aa5390375a79fc97eb6d
    source_path: tools/btw.md
    workflow: 16
---

`/btw` pozwala zadać szybkie pytanie poboczne o **bieżącą sesję** bez
zamieniania tego pytania w zwykłą historię rozmowy. `/side` jest aliasem.

Jest wzorowane na zachowaniu `/btw` z Claude Code, ale dostosowane do
Gateway OpenClaw i architektury wielokanałowej.

## Co robi

Gdy wyślesz:

```text
/btw what changed?
```

OpenClaw:

1. tworzy migawkę kontekstu bieżącej sesji,
2. uruchamia osobne wywołanie modelu **bez narzędzi**,
3. odpowiada tylko na pytanie poboczne,
4. pozostawia główne uruchomienie bez zmian,
5. **nie** zapisuje pytania ani odpowiedzi BTW w historii sesji,
6. emituje odpowiedź jako **wynik poboczny na żywo**, a nie zwykłą wiadomość asystenta.

Ważny model mentalny to:

- ten sam kontekst sesji
- osobne jednorazowe zapytanie poboczne
- brak wywołań narzędzi
- brak zanieczyszczenia przyszłego kontekstu
- brak trwałości transkrypcji

## Czego nie robi

`/btw` **nie**:

- tworzy nowej trwałej sesji,
- kontynuuje niedokończonego głównego zadania,
- uruchamia narzędzi ani pętli narzędzi agenta,
- zapisuje danych pytania/odpowiedzi BTW w historii transkrypcji,
- pojawia się w `chat.history`,
- przetrwa ponownego wczytania.

Jest celowo **tymczasowe**.

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

BTW **nie** jest dostarczane jako zwykła wiadomość asystenta w transkrypcji.

Na poziomie protokołu Gateway:

- zwykły czat asystenta używa zdarzenia `chat`
- BTW używa zdarzenia `chat.side_result`

To rozdzielenie jest celowe. Gdyby BTW ponownie używało zwykłej ścieżki
zdarzenia `chat`, klienci traktowaliby je jak regularną historię rozmowy.

Ponieważ BTW używa osobnego zdarzenia na żywo i nie jest odtwarzane z
`chat.history`, znika po ponownym wczytaniu.

## Zachowanie powierzchni

### TUI

W TUI BTW jest renderowane inline w widoku bieżącej sesji, ale pozostaje
tymczasowe:

- wizualnie odróżnione od zwykłej odpowiedzi asystenta
- możliwe do zamknięcia przez `Enter` lub `Esc`
- nieodtwarzane po ponownym wczytaniu

### Kanały zewnętrzne

W kanałach takich jak Telegram, WhatsApp i Discord BTW jest dostarczane jako
wyraźnie oznaczona jednorazowa odpowiedź, ponieważ te powierzchnie nie mają
lokalnej koncepcji tymczasowej nakładki.

Odpowiedź nadal jest traktowana jako wynik poboczny, a nie zwykła historia sesji.

### Control UI / web

Gateway prawidłowo emituje BTW jako `chat.side_result`, a BTW nie jest
dołączane do `chat.history`, więc kontrakt trwałości jest już poprawny dla webu.

Bieżące Control UI nadal potrzebuje dedykowanego konsumenta `chat.side_result`,
aby renderować BTW na żywo w przeglądarce. Dopóki ta obsługa po stronie klienta
nie zostanie wdrożona, BTW jest funkcją na poziomie Gateway z pełnym zachowaniem
w TUI i kanałach zewnętrznych, ale nie ma jeszcze kompletnego UX przeglądarkowego.

## Kiedy używać BTW

Użyj `/btw`, gdy chcesz:

- szybkiego wyjaśnienia dotyczącego bieżącej pracy,
- rzeczowej odpowiedzi pobocznej, gdy długie uruchomienie nadal trwa,
- tymczasowej odpowiedzi, która nie powinna stać się częścią przyszłego kontekstu sesji.

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

<CardGroup cols={2}>
  <Card title="Polecenia ukośnikiem" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń i dyrektywy czatu.
  </Card>
  <Card title="Poziomy myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy wysiłku rozumowania dla wywołania modelu pytania pobocznego.
  </Card>
  <Card title="Sesja" href="/pl/concepts/session" icon="comments">
    Klucze sesji, historia i semantyka trwałości.
  </Card>
  <Card title="Polecenie sterujące" href="/pl/tools/steer" icon="arrow-right">
    Wstrzyknij wiadomość sterującą do aktywnego uruchomienia bez jego kończenia.
  </Card>
</CardGroup>
