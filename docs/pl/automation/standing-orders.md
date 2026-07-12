---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów działających bez monitów dla każdego zadania
    - Określanie, co agent może robić samodzielnie, a co wymaga zatwierdzenia przez człowieka
    - Strukturyzowanie agentów wieloprogramowych z jasno określonymi granicami i zasadami eskalacji
summary: Określ stałe uprawnienia operacyjne dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-07-12T14:51:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Stałe zlecenia przyznają agentowi **trwałe uprawnienia operacyjne** w ramach zdefiniowanych programów. Zamiast przekazywać agentowi polecenie dla każdego zadania, definiujesz programy z wyraźnym zakresem, wyzwalaczami i regułami eskalacji, a agent wykonuje je autonomicznie w tych granicach: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego warto używać stałych zleceń

**Bez stałych zleceń:** przekazujesz agentowi polecenie dla każdego zadania, rutynowe prace są zapominane lub opóźniane, a Ty stajesz się wąskim gardłem.

**Ze stałymi zleceniami:** agent działa autonomicznie w zdefiniowanych granicach, rutynowe prace odbywają się zgodnie z harmonogramem, a Twój udział jest potrzebny tylko w przypadku wyjątków i zatwierdzeń.

## Jak działają

Stałe zlecenia definiuje się w plikach [przestrzeni roboczej agenta](/pl/concepts/agent-workspace). Zalecane podejście polega na umieszczeniu ich bezpośrednio w pliku `AGENTS.md` (który jest automatycznie wstrzykiwany podczas każdej sesji), dzięki czemu agent zawsze ma je w kontekście. W przypadku większych konfiguracji możesz również umieścić je w osobnym pliku, takim jak `standing-orders.md`, i odwołać się do niego z pliku `AGENTS.md`.

Każdy program określa:

1. **Zakres** — co agent może robić
2. **Wyzwalacze** — kiedy należy go wykonać (harmonogram, zdarzenie lub warunek)
3. **Punkty zatwierdzania** — co przed wykonaniem wymaga zgody człowieka
4. **Reguły eskalacji** — kiedy należy przerwać działanie i poprosić o pomoc

Agent wczytuje te instrukcje podczas każdej sesji za pośrednictwem plików inicjalizacyjnych przestrzeni roboczej (pełną listę automatycznie wstrzykiwanych plików znajdziesz w sekcji [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)) i wykonuje je w połączeniu z [zadaniami Cron](/pl/automation/cron-jobs), które zapewniają realizację według harmonogramu.

<Tip>
Umieść stałe zlecenia w pliku `AGENTS.md`, aby zagwarantować ich wczytywanie podczas każdej sesji. Mechanizm inicjalizacji przestrzeni roboczej automatycznie wstrzykuje pliki `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` — ale nie dowolne pliki znajdujące się w podkatalogach.
</Tip>

## Struktura stałego zlecenia

```markdown
## Program: Cotygodniowy raport o stanie

**Uprawnienia:** Zbieranie danych, generowanie raportu, dostarczanie go interesariuszom
**Wyzwalacz:** W każdy piątek o 16:00 (egzekwowane za pomocą zadania cron)
**Punkt zatwierdzania:** Brak w przypadku standardowych raportów. Oznaczaj anomalie do sprawdzenia przez człowieka.
**Eskalacja:** Jeśli źródło danych jest niedostępne lub wskaźniki wyglądają nietypowo (>2σ od normy)

### Kroki wykonania

1. Pobierz wskaźniki ze skonfigurowanych źródeł
2. Porównaj je z poprzednim tygodniem i wartościami docelowymi
3. Wygeneruj raport w Reports/weekly/YYYY-MM-DD.md
4. Dostarcz podsumowanie przez skonfigurowany kanał
5. Zapisz ukończenie w Agent/Logs/

### Czego NIE robić

- Nie wysyłaj raportów podmiotom zewnętrznym
- Nie modyfikuj danych źródłowych
- Nie pomijaj dostarczenia raportu, jeśli wskaźniki wyglądają źle — przedstaw je rzetelnie
```

## Stałe zlecenia i zadania Cron

Stałe zlecenia definiują, **co** agent może robić. [Zadania Cron](/pl/automation/cron-jobs) definiują, **kiedy** ma się to odbywać. Działają razem:

```text
Stałe zlecenie: „Odpowiadasz za codzienną klasyfikację skrzynki odbiorczej”
    ↓
Zadanie Cron (codziennie o 8:00): „Wykonaj klasyfikację skrzynki odbiorczej zgodnie ze stałymi zleceniami”
    ↓
Agent: Odczytuje stałe zlecenia → wykonuje kroki → raportuje wyniki
```

Polecenie zadania Cron powinno odwoływać się do stałego zlecenia zamiast je powielać:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Wykonaj codzienną klasyfikację skrzynki odbiorczej zgodnie ze stałymi zleceniami. Sprawdź pocztę pod kątem nowych alertów. Przeanalizuj, skategoryzuj i utrwal każdy element. Przekaż właścicielowi podsumowanie. Eskaluj nieznane przypadki."
```

## Przykłady

### Przykład 1: treści i media społecznościowe (cykl tygodniowy)

```markdown
## Program: Treści i media społecznościowe

**Uprawnienia:** Tworzenie wersji roboczych treści, planowanie publikacji, przygotowywanie raportów zaangażowania
**Punkt zatwierdzania:** Wszystkie publikacje wymagają sprawdzenia przez właściciela przez pierwsze 30 dni, a następnie obowiązuje stała zgoda
**Wyzwalacz:** Cykl tygodniowy (przegląd w poniedziałek → wersje robocze w środku tygodnia → podsumowanie w piątek)

### Cykl tygodniowy

- **Poniedziałek:** Przejrzyj wskaźniki platformy i zaangażowanie odbiorców
- **Wtorek–czwartek:** Przygotuj wersje robocze postów społecznościowych i treści na blog
- **Piątek:** Przygotuj cotygodniowe podsumowanie marketingowe → dostarcz je właścicielowi

### Reguły dotyczące treści

- Styl komunikacji musi odpowiadać marce (patrz SOUL.md lub przewodnik po stylu komunikacji marki)
- Nigdy nie przedstawiaj się jako AI w treściach publicznych
- Uwzględniaj wskaźniki, gdy są dostępne
- Koncentruj się na wartości dla odbiorców, a nie na autopromocji
```

### Przykład 2: operacje finansowe (wyzwalane zdarzeniami)

```markdown
## Program: Przetwarzanie finansowe

**Uprawnienia:** Przetwarzanie danych transakcyjnych, generowanie raportów, wysyłanie podsumowań
**Punkt zatwierdzania:** Brak w przypadku analiz. Rekomendacje wymagają zatwierdzenia przez właściciela.
**Wyzwalacz:** Wykrycie nowego pliku danych LUB zaplanowany cykl miesięczny

### Gdy pojawią się nowe dane

1. Wykryj nowy plik w wyznaczonym katalogu wejściowym
2. Przeanalizuj i skategoryzuj wszystkie transakcje
3. Porównaj je z wartościami docelowymi budżetu
4. Oznacz: nietypowe pozycje, przekroczenia progów, nowe opłaty cykliczne
5. Wygeneruj raport w wyznaczonym katalogu wyjściowym
6. Dostarcz podsumowanie właścicielowi przez skonfigurowany kanał

### Reguły eskalacji

- Pojedyncza pozycja > 500 USD: natychmiastowy alert
- Kategoria przekracza budżet o 20%: oznacz w raporcie
- Nierozpoznana transakcja: poproś właściciela o jej skategoryzowanie
- Nieudane przetwarzanie po 2 ponowieniach: zgłoś niepowodzenie, nie zgaduj
```

### Przykład 3: monitorowanie i alerty (ciągłe)

```markdown
## Program: Monitorowanie systemu

**Uprawnienia:** Sprawdzanie stanu systemu, ponowne uruchamianie usług, wysyłanie alertów
**Punkt zatwierdzania:** Automatycznie uruchamiaj usługi ponownie. Eskaluj, jeśli ponowne uruchomienie nie powiedzie się dwukrotnie.
**Wyzwalacz:** Każdy cykl Heartbeat

### Kontrole

- Punkty końcowe stanu usług odpowiadają
- Ilość wolnego miejsca na dysku przekracza próg
- Oczekujące zadania nie są przeterminowane (>24 godziny)
- Kanały dostarczania działają

### Macierz reakcji

| Warunek                   | Działanie                              | Eskalować?                                  |
| ------------------------- | -------------------------------------- | -------------------------------------------- |
| Usługa nie działa         | Automatycznie uruchom ponownie         | Tylko jeśli 2 próby ponownego uruchomienia zawiodą |
| Miejsce na dysku < 10%    | Powiadom właściciela                   | Tak                                          |
| Zadanie starsze niż 24 godziny | Przypomnij właścicielowi          | Nie                                          |
| Kanał jest offline        | Zapisz w dzienniku i ponów w następnym cyklu | Jeśli jest offline przez ponad 2 godziny |
```

## Wzorzec wykonaj–zweryfikuj–zaraportuj

Stałe zlecenia działają najlepiej w połączeniu ze ścisłą dyscypliną wykonania. Każde zadanie w stałym zleceniu powinno przebiegać zgodnie z następującą pętlą:

1. **Wykonaj** — wykonaj właściwą pracę (nie ograniczaj się do potwierdzenia instrukcji)
2. **Zweryfikuj** — potwierdź poprawność wyniku (plik istnieje, wiadomość została dostarczona, dane zostały przeanalizowane)
3. **Zaraportuj** — poinformuj właściciela, co wykonano i co zweryfikowano

```markdown
### Reguły wykonania

- Każde zadanie jest realizowane według schematu Wykonaj–Zweryfikuj–Zaraportuj. Bez wyjątków.
- „Zrobię to” nie oznacza wykonania. Najpierw wykonaj zadanie, a potem zdaj raport.
- „Gotowe” bez weryfikacji jest niedopuszczalne. Przedstaw dowód.
- Jeśli wykonanie się nie powiedzie: ponów je raz, stosując zmienione podejście.
- Jeśli nadal się nie powiedzie: zgłoś niepowodzenie wraz z diagnozą. Nigdy nie ukrywaj niepowodzenia.
- Nigdy nie ponawiaj bez końca — maksymalnie 3 próby, a następnie eskalacja.
```

Ten wzorzec zapobiega najczęstszemu trybowi niepowodzenia agenta: potwierdzeniu zadania bez jego ukończenia.

## Architektura wielu programów

W przypadku agentów zarządzających wieloma obszarami uporządkuj stałe zlecenia jako osobne programy z wyraźnymi granicami:

```markdown
## Program 1: [Domena A] (co tydzień)

...

## Program 2: [Domena B] (co miesiąc + na żądanie)

...

## Program 3: [Domena C] (w razie potrzeby)

...

## Reguły eskalacji (wszystkie programy)

- [Wspólne kryteria eskalacji]
- [Punkty zatwierdzania obowiązujące we wszystkich programach]
```

Każdy program powinien mieć:

- Własny **harmonogram wyzwalania** (tygodniowy, miesięczny, sterowany zdarzeniami, ciągły)
- Własne **punkty zatwierdzania** (niektóre programy wymagają większego nadzoru niż inne)
- Wyraźne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Sprawdzone praktyki

### Zalecane

- Zacznij od wąskiego zakresu uprawnień i rozszerzaj go wraz ze wzrostem zaufania
- Zdefiniuj wyraźne punkty zatwierdzania dla działań wysokiego ryzyka
- Uwzględnij sekcje „Czego NIE robić” — granice są równie ważne jak uprawnienia
- Połącz stałe zlecenia z zadaniami Cron, aby zapewnić niezawodne wykonywanie według harmonogramu
- Co tydzień przeglądaj dzienniki agenta, aby zweryfikować przestrzeganie stałych zleceń
- Aktualizuj stałe zlecenia wraz ze zmianą potrzeb — są to żywe dokumenty

### Niezalecane

- Nie przyznawaj szerokich uprawnień od pierwszego dnia („rób wszystko, co uznasz za najlepsze”)
- Nie pomijaj reguł eskalacji — każdy program wymaga klauzuli określającej, kiedy przerwać działanie i zapytać
- Nie zakładaj, że agent zapamięta instrukcje ustne — umieść wszystko w pliku
- Nie łącz różnych obszarów w jednym programie — używaj osobnych programów dla osobnych domen
- Nie zapominaj o egzekwowaniu za pomocą zadań Cron — stałe zlecenia bez wyzwalaczy stają się sugestiami

## Powiązane materiały

- [Automatyzacja](/pl/automation): przegląd wszystkich mechanizmów automatyzacji.
- [Zadania Cron](/pl/automation/cron-jobs): egzekwowanie harmonogramu stałych zleceń.
- [Hooki](/pl/automation/hooks): skrypty sterowane zdarzeniami cyklu życia agenta.
- [Webhooki](/pl/automation/cron-jobs#webhooks): wyzwalacze przychodzących zdarzeń HTTP.
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace): miejsce przechowywania stałych zleceń wraz z pełną listą automatycznie wstrzykiwanych plików inicjalizacyjnych (`AGENTS.md`, `SOUL.md` itd.).
