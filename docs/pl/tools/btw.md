---
read_when:
    - Chcesz zadać krótkie pytanie poboczne dotyczące bieżącej sesji
    - Implementujesz lub debugujesz zachowanie BTW w różnych klientach
summary: Tymczasowe pytania poboczne za pomocą /btw
title: 'Przy okazji: pytania poboczne'
x-i18n:
    generated_at: "2026-05-11T20:38:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: fba82915b0a8f59d20073dac5c159c4aff4e81ccb1be5979be521212e22c493a
    source_path: tools/btw.md
    workflow: 16
---

`/btw` pozwala zadać szybkie pytanie poboczne dotyczące **bieżącej sesji** bez
zamieniania tego pytania w zwykłą historię rozmowy. `/side` jest aliasem.

Jest wzorowane na zachowaniu `/btw` w Claude Code, ale dostosowane do architektury
Gateway i wielu kanałów w OpenClaw.

## Co robi

Gdy wyślesz:

```text
/btw what changed?
```

OpenClaw:

1. wykonuje migawkę bieżącego kontekstu sesji,
2. uruchamia osobne, efemeryczne zapytanie poboczne,
3. odpowiada tylko na pytanie poboczne,
4. pozostawia główny przebieg bez zmian,
5. **nie** zapisuje pytania ani odpowiedzi BTW w historii sesji,
6. emituje odpowiedź jako **wynik poboczny na żywo**, a nie zwykłą wiadomość asystenta.

Ważny model myślowy to:

- ten sam kontekst sesji
- osobne jednorazowe zapytanie poboczne
- ten sam natywny transport harnessu, gdy sesja używa natywnego harnessu
- brak zanieczyszczania przyszłego kontekstu
- brak utrwalania transkrypcji

W przypadku sesji harnessu Codex BTW pozostaje wewnątrz Codex, rozwidlając aktywny
wątek app-server jako efemeryczny wątek poboczny. Dzięki temu OAuth Codex i natywne
zachowanie wątku pozostają nienaruszone, a jednocześnie odpowiedź poboczna jest
izolowana od transkrypcji nadrzędnej. Podobnie jak `/side` w Codex, wątek poboczny
zachowuje bieżące uprawnienia Codex i natywną powierzchnię narzędzi, z zabezpieczeniami,
które instruują model, aby nie traktował odziedziczonej pracy z wątku nadrzędnego jako
aktywnych instrukcji. Środowiska uruchomieniowe inne niż Codex zachowują starszą,
bezpośrednią ścieżkę jednorazową.

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

Jeśli główny przebieg jest obecnie aktywny, OpenClaw wykonuje migawkę bieżącego
stanu wiadomości i uwzględnia trwający główny prompt jako kontekst tła, jednocześnie
wyraźnie instruując model:

- odpowiedz tylko na pytanie poboczne,
- nie wznawiaj ani nie kończ niedokończonego głównego zadania,
- nie steruj rozmową nadrzędną.

Dzięki temu BTW pozostaje odizolowane od głównego przebiegu, a jednocześnie wie,
czego dotyczy sesja.

## Model dostarczania

BTW **nie** jest dostarczane jako zwykła wiadomość asystenta w transkrypcji.

Na poziomie protokołu Gateway:

- zwykły czat asystenta używa zdarzenia `chat`
- BTW używa zdarzenia `chat.side_result`

To rozdzielenie jest celowe. Gdyby BTW ponownie używało normalnej ścieżki zdarzenia
`chat`, klienci traktowaliby je jak zwykłą historię rozmowy.

Ponieważ BTW używa osobnego zdarzenia na żywo i nie jest odtwarzane z
`chat.history`, znika po ponownym wczytaniu.

## Zachowanie powierzchni

### TUI

W TUI BTW jest renderowane liniowo w bieżącym widoku sesji, ale pozostaje
efemeryczne:

- wyraźnie odróżnione od zwykłej odpowiedzi asystenta
- możliwe do zamknięcia za pomocą `Enter` lub `Esc`
- nieodtwarzane po ponownym wczytaniu

### Kanały zewnętrzne

Na kanałach takich jak Telegram, WhatsApp i Discord BTW jest dostarczane jako
wyraźnie oznaczona jednorazowa odpowiedź, ponieważ te powierzchnie nie mają lokalnej
koncepcji efemerycznej nakładki.

Odpowiedź nadal jest traktowana jako wynik poboczny, a nie zwykła historia sesji.

### Control UI / web

Gateway poprawnie emituje BTW jako `chat.side_result`, a BTW nie jest uwzględniane
w `chat.history`, więc kontrakt trwałości jest już poprawny dla web.

Bieżący Control UI nadal potrzebuje dedykowanego konsumenta `chat.side_result`,
aby renderować BTW na żywo w przeglądarce. Dopóki ta obsługa po stronie klienta
nie zostanie wdrożona, BTW jest funkcją na poziomie Gateway z pełnym zachowaniem
w TUI i kanałach zewnętrznych, ale jeszcze bez kompletnego UX w przeglądarce.

## Kiedy używać BTW

Używaj `/btw`, gdy chcesz uzyskać:

- szybkie wyjaśnienie dotyczące bieżącej pracy,
- rzeczową odpowiedź poboczną, gdy długi przebieg nadal trwa,
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
  <Card title="Polecenia Slash" href="/pl/tools/slash-commands" icon="terminal">
    Natywny katalog poleceń i dyrektywy czatu.
  </Card>
  <Card title="Poziomy myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy nakładu rozumowania dla wywołania modelu pytania pobocznego.
  </Card>
  <Card title="Sesja" href="/pl/concepts/session" icon="comments">
    Klucze sesji, historia i semantyka trwałości.
  </Card>
  <Card title="Polecenie sterowania" href="/pl/tools/steer" icon="arrow-right">
    Wstrzyknij wiadomość sterującą do aktywnego przebiegu bez jego kończenia.
  </Card>
</CardGroup>
