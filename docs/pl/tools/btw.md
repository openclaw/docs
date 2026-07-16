---
read_when:
    - Chcesz zadać krótkie pytanie poboczne dotyczące bieżącej sesji
    - Implementujesz lub debugujesz zachowanie BTW w różnych klientach
summary: Ulotne pytania poboczne z /btw
title: A przy okazji, dodatkowe pytania
x-i18n:
    generated_at: "2026-07-16T19:10:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 338a54d0e15ec90aebaeeaee551559a26f1437f7b6dcdde4a4b1e63347ad0759
    source_path: tools/btw.md
    workflow: 16
---

`/btw` (alias `/side`) zadaje szybkie pytanie poboczne dotyczące **bieżącej
sesji** bez dodawania go do historii konwersacji. Funkcja jest wzorowana na
`/btw` z Claude Code i dostosowana do architektury Gateway oraz
wielokanałowej architektury OpenClaw.

```text
/btw co się zmieniło?
/side co oznacza ten błąd?
```

## Działanie

1. Tworzy migawkę bieżącej sesji jako kontekst tła (w tym oczekujący
   prompt głównego przebiegu).
2. Uruchamia osobne, jednorazowe zapytanie poboczne, instruując model, aby odpowiedział wyłącznie na
   pytanie poboczne i nie wznawiał ani nie ukierunkowywał głównego zadania.
3. Dostarcza odpowiedź jako wynik poboczny na żywo, a nie zwykłą wiadomość asystenta.
4. Nigdy nie zapisuje pytania ani odpowiedzi w historii sesji ani w `chat.history`.

Główny przebieg, jeśli jest aktywny, pozostaje niezmieniony.

W sesjach uprzęży Codex funkcja BTW rozwidla aktywny wątek serwera aplikacji Codex,
tworząc efemeryczny wątek podrzędny, zamiast wykonywać osobne wywołanie dostawcy. Pozwala to
zachować OAuth Codex oraz natywne działanie narzędzi i wątków, a rozwidlony
wątek zachowuje bieżące zasady zatwierdzania, piaskownicę i natywny
zestaw narzędzi wątku nadrzędnego. Rozwidlony wątek otrzymuje prompt graniczny informujący model, że
wszystko przed nim stanowi odziedziczony kontekst referencyjny, a nie aktywne instrukcje,
oraz że aktywne są wyłącznie wiadomości po tej granicy. `/btw` wymaga
istniejącego wątku Codex; najpierw należy wysłać zwykłą wiadomość.

W przypadku aliasów środowiska uruchomieniowego CLI funkcja BTW wywołuje odpowiedni backend CLI w jednorazowym
trybie pytania pobocznego: przekazuje oczyszczony kontekst konwersacji do nowego wywołania CLI
z wyłączonym pakietowaniem narzędzi i stanem sesji wielokrotnego użytku oraz dodaje
obsługiwane przez backend flagi wyłączające wznawianie i narzędzia. Bezpośrednie środowiska uruchomieniowe
(inne niż CLI) używają zamiast tego bezpośredniego, jednorazowego wywołania dostawcy.

## Czego ta funkcja nie robi

`/btw` nie tworzy trwałej sesji, nie kontynuuje niedokończonego głównego zadania,
nie utrwala danych pytania ani odpowiedzi w historii transkrypcji i nie zachowuje ich po ponownym wczytaniu.

## Model dostarczania

Zwykły czat z asystentem używa zdarzenia Gateway `chat`. Funkcja BTW używa osobnego
zdarzenia `chat.side_result`, dzięki czemu klienty nie mogą pomylić go ze zwykłą
historią konwersacji. Ponieważ zdarzenie nie jest odtwarzane z `chat.history`,
znika po ponownym wczytaniu.

## Zachowanie w interfejsach

| Interfejs         | Zachowanie                                                                                                                                                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TUI               | Wyświetlany w wierszu dziennika czatu, wyraźnie odróżniony od zwykłej odpowiedzi; można go zamknąć za pomocą `Enter` lub `Esc`.                                                                                                                                                                           |
| Kanały zewnętrzne | Dostarczany jako wyraźnie oznaczona, jednorazowa odpowiedź (Telegram, WhatsApp i Discord nie mają lokalnej efemerycznej nakładki).                                                                                                                                                                         |
| Control UI / web  | Wyświetlany jako pływający panel „Czat poboczny” przypięty do wątku. Odpowiedzi gromadzą się jako kolejne wypowiedzi, a pole „Kontynuuj” służy do zadania następnego pytania pobocznego. Zamknięcie (`Esc` lub X) zachowuje konwersację, a panel otwiera się ponownie po otrzymaniu następnej odpowiedzi; przycisk kosza odrzuca ją i zatrzymuje oczekujący przebieg. |

## Wyskakujące menu zaznaczenia (Control UI)

Zaznaczenie tekstu w wiadomości czatu w Control UI otwiera małe
wyskakujące menu zaznaczenia z dwiema akcjami:

- **Więcej szczegółów** natychmiast wysyła niejawne pytanie `/btw` z prośbą, aby
  model wyjaśnił zaznaczony tekst w kontekście bieżącej
  sesji. Odpowiedź pojawia się w pływającym panelu czatu pobocznego.
- **Zapytaj na czacie pobocznym** wstępnie wypełnia edytor wersją roboczą `/btw` cytującą
  zaznaczony tekst, aby umożliwić wpisanie własnego pytania na jego temat.

Obie akcje działają zgodnie ze zwykłą semantyką `/btw`: pytanie i odpowiedź nie trafiają
do historii sesji, a główny przebieg pozostaje niezmieniony.

## Kiedy używać

Funkcja `/btw` służy do szybkiego uzyskania wyjaśnienia, otrzymania pobocznej odpowiedzi rzeczowej podczas trwania długiego przebiegu
lub uzyskania tymczasowej odpowiedzi, która nie powinna wejść do przyszłego
kontekstu sesji.

```text
/btw który plik edytujemy?
/btw podsumuj bieżące zadanie w jednym zdaniu
/btw ile wynosi 17 * 19?
```

Jeśli informacja ma stać się częścią przyszłego kontekstu roboczego
sesji, należy zamiast tego zadać pytanie w zwykły sposób w sesji głównej.

## Powiązane

<CardGroup cols={2}>
  <Card title="Polecenia z ukośnikiem" href="/pl/tools/slash-commands" icon="terminal">
    Katalog natywnych poleceń i dyrektywy czatu.
  </Card>
  <Card title="Poziomy rozumowania" href="/pl/tools/thinking" icon="brain">
    Poziomy nakładu rozumowania dla wywołania modelu obsługującego pytanie poboczne.
  </Card>
  <Card title="Sesja" href="/pl/concepts/session" icon="comments">
    Klucze sesji, historia i semantyka trwałości.
  </Card>
  <Card title="Polecenie sterujące" href="/pl/tools/steer" icon="arrow-right">
    Wstrzykiwanie wiadomości sterującej do aktywnego przebiegu bez jego kończenia.
  </Card>
</CardGroup>
