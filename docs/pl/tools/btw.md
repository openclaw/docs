---
read_when:
    - Chcesz zadać krótkie pytanie poboczne dotyczące bieżącej sesji
    - Implementujesz lub debugujesz zachowanie BTW w różnych klientach
summary: Tymczasowe pytania poboczne z /btw
title: 'Przy okazji: pytania poboczne'
x-i18n:
    generated_at: "2026-06-27T18:24:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf97c17fb02c2464b1d1b31cfec652d52c60be6ce0cad25eaf32a9c080843ef2
    source_path: tools/btw.md
    workflow: 16
---

`/btw` pozwala zadać szybkie pytanie poboczne dotyczące **bieżącej sesji** bez
zamieniania tego pytania w zwykłą historię rozmowy. `/side` jest aliasem.

Jest wzorowane na zachowaniu `/btw` w Claude Code, ale dostosowane do architektury
Gateway i wielokanałowej architektury OpenClaw.

## Co robi

Gdy wyślesz:

```text
/btw what changed?
```

OpenClaw:

1. tworzy migawkę bieżącego kontekstu sesji,
2. uruchamia osobne efemeryczne zapytanie poboczne,
3. odpowiada tylko na pytanie poboczne,
4. pozostawia główne uruchomienie bez zmian,
5. **nie** zapisuje pytania ani odpowiedzi BTW w historii sesji,
6. emituje odpowiedź jako **wynik poboczny na żywo**, a nie zwykłą wiadomość asystenta.

Ważny model mentalny to:

- ten sam kontekst sesji
- osobne jednorazowe zapytanie poboczne
- ten sam natywny transport harness, gdy sesja używa natywnego harness
- brak zanieczyszczenia przyszłego kontekstu
- brak utrwalania transkrypcji

W sesjach Codex harness BTW pozostaje wewnątrz Codex przez rozwidlenie aktywnego
wątku app-server jako efemerycznego wątku pobocznego. Dzięki temu OAuth Codex i
natywne zachowanie wątku pozostają nienaruszone, a odpowiedź poboczna nadal jest
izolowana od transkrypcji nadrzędnej. Podobnie jak Codex `/side`, wątek poboczny
zachowuje bieżące uprawnienia Codex i natywną powierzchnię narzędzi, z zabezpieczeniami,
które mówią modelowi, aby nie traktował odziedziczonej pracy z wątku nadrzędnego
jako aktywnych instrukcji.

W przypadku aliasów środowiska uruchomieniowego CLI BTW używa właścicielskiego
backendu CLI w trybie pytania pobocznego zamiast przechodzić awaryjnie do
bezpośredniego wywołania dostawcy. OpenClaw zasila świeże jednorazowe wywołanie
CLI oczyszczonym kontekstem rozmowy, wyłącza pakietowanie narzędzi OpenClaw MCP
i stan wielokrotnego użytku sesji CLI dla tego wywołania oraz pozwala backendowi
dodać wszelkie natywne dla CLI flagi no-resume lub no-tools, które obsługuje.
Bezpośrednie środowiska uruchomieniowe inne niż CLI zachowują bezpośrednią
ścieżkę jednorazową.

## Czego nie robi

`/btw` **nie**:

- tworzy nowej trwałej sesji,
- kontynuuje niedokończonego głównego zadania,
- zapisuje danych pytania/odpowiedzi BTW w historii transkrypcji,
- pojawia się w `chat.history`,
- przetrwa ponownego wczytania.

Jest celowo **efemeryczne**.

## Jak działa kontekst

BTW używa bieżącej sesji wyłącznie jako **kontekstu tła**.

Jeśli główne uruchomienie jest obecnie aktywne, OpenClaw tworzy migawkę bieżącego
stanu wiadomości i dołącza trwający główny prompt jako kontekst tła, jednocześnie
wyraźnie mówiąc modelowi:

- odpowiedz tylko na pytanie poboczne,
- nie wznawiaj ani nie kończ niedokończonego głównego zadania,
- nie kieruj rozmową nadrzędną.

Dzięki temu BTW pozostaje odizolowane od głównego uruchomienia, a jednocześnie
wie, czego dotyczy sesja.

## Model dostarczania

BTW **nie** jest dostarczane jako zwykła wiadomość asystenta w transkrypcji.

Na poziomie protokołu Gateway:

- zwykły czat asystenta używa zdarzenia `chat`
- BTW używa zdarzenia `chat.side_result`

Ten rozdział jest celowy. Gdyby BTW ponownie używało zwykłej ścieżki zdarzenia
`chat`, klienci traktowaliby je jak zwykłą historię rozmowy.

Ponieważ BTW używa osobnego zdarzenia na żywo i nie jest odtwarzane z
`chat.history`, znika po ponownym wczytaniu.

## Zachowanie powierzchni

### TUI

W TUI BTW jest renderowane inline w widoku bieżącej sesji, ale pozostaje
efemeryczne:

- wyraźnie odróżnialne od zwykłej odpowiedzi asystenta
- możliwe do odrzucenia za pomocą `Enter` lub `Esc`
- nieodtwarzane po ponownym wczytaniu

### Kanały zewnętrzne

W kanałach takich jak Telegram, WhatsApp i Discord BTW jest dostarczane jako
wyraźnie oznaczona jednorazowa odpowiedź, ponieważ te powierzchnie nie mają
lokalnej koncepcji efemerycznej nakładki.

Odpowiedź nadal jest traktowana jako wynik poboczny, a nie zwykła historia sesji.

### Control UI / web

Gateway poprawnie emituje BTW jako `chat.side_result`, a BTW nie jest uwzględniane
w `chat.history`, więc kontrakt trwałości jest już poprawny dla web.

Obecny Control UI nadal potrzebuje dedykowanego konsumenta `chat.side_result`,
aby renderować BTW na żywo w przeglądarce. Dopóki ta obsługa po stronie klienta
nie zostanie wdrożona, BTW jest funkcją na poziomie Gateway z pełnym zachowaniem
w TUI i kanałach zewnętrznych, ale nie ma jeszcze kompletnego UX w przeglądarce.

## Kiedy używać BTW

Użyj `/btw`, gdy chcesz uzyskać:

- szybkie wyjaśnienie dotyczące bieżącej pracy,
- rzeczową odpowiedź poboczną, gdy długie uruchomienie nadal trwa,
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

<CardGroup cols={2}>
  <Card title="Slash commands" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń i dyrektywy czatu.
  </Card>
  <Card title="Thinking levels" href="/pl/tools/thinking" icon="brain">
    Poziomy wysiłku rozumowania dla wywołania modelu pytania pobocznego.
  </Card>
  <Card title="Session" href="/pl/concepts/session" icon="comments">
    Klucze sesji, historia i semantyka trwałości.
  </Card>
  <Card title="Steer command" href="/pl/tools/steer" icon="arrow-right">
    Wstrzyknij wiadomość sterującą do aktywnego uruchomienia bez jego kończenia.
  </Card>
</CardGroup>
