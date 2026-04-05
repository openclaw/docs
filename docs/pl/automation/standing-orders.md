---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów, które działają bez promptów dla każdego zadania
    - Określanie, co agent może robić samodzielnie, a co wymaga zgody człowieka
    - Strukturyzowanie agentów złożonych z wielu programów z wyraźnymi granicami i regułami eskalacji
summary: Określ stałe uprawnienia operacyjne dla autonomicznych programów agentów
title: Stałe zlecenia
x-i18n:
    generated_at: "2026-04-05T13:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81347d7a51a6ce20e6493277afee92073770f69a91a2e6b3bf87b99bb586d038
    source_path: automation/standing-orders.md
    workflow: 15
---

# Stałe zlecenia

Stałe zlecenia przyznają agentowi **stałe uprawnienia operacyjne** dla określonych programów. Zamiast za każdym razem przekazywać instrukcje dla pojedynczych zadań, definiujesz programy z jasno określonym zakresem, wyzwalaczami i regułami eskalacji — a agent wykonuje je autonomicznie w tych granicach.

To różnica między mówieniem asystentowi „wysyłaj cotygodniowy raport” w każdy piątek a przyznaniem stałych uprawnień: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj go i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego stałe zlecenia?

**Bez stałych zleceń:**

- Musisz promptować agenta przy każdym zadaniu
- Agent pozostaje bezczynny między zgłoszeniami
- Rutynowe zadania są zapominane lub opóźniane
- Stajesz się wąskim gardłem

**Ze stałymi zleceniami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowe zadania są wykonywane zgodnie z harmonogramem bez promptów
- Angażujesz się tylko w wyjątkach i przy akceptacjach
- Agent produktywnie wykorzystuje czas bezczynności

## Jak to działa

Stałe zlecenia są definiowane w plikach [obszaru roboczego agenta](/concepts/agent-workspace). Zalecanym podejściem jest umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. W przypadku większych konfiguracji możesz też umieścić je w osobnym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** — do czego agent ma uprawnienia
2. **Wyzwalacze** — kiedy wykonać działanie (harmonogram, zdarzenie lub warunek)
3. **Bramki akceptacji** — co wymaga zatwierdzenia przez człowieka przed działaniem
4. **Reguły eskalacji** — kiedy się zatrzymać i poprosić o pomoc

Agent wczytuje te instrukcje w każdej sesji za pośrednictwem plików bootstrap obszaru roboczego (pełną listę plików wstrzykiwanych automatycznie znajdziesz w [Agent Workspace](/concepts/agent-workspace)) i działa zgodnie z nimi, w połączeniu z [cron jobs](/automation/cron-jobs) do egzekwowania działań opartych na czasie.

<Tip>
Umieść stałe zlecenia w `AGENTS.md`, aby mieć pewność, że będą wczytywane w każdej sesji. Bootstrap obszaru roboczego automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` — ale nie dowolne pliki w podkatalogach.
</Tip>

## Anatomia stałego zlecenia

```markdown
## Program: Cotygodniowy raport statusu

**Uprawnienia:** Zbieranie danych, generowanie raportu, dostarczanie interesariuszom
**Wyzwalacz:** W każdy piątek o 16:00 (egzekwowane przez cron job)
**Bramka akceptacji:** Brak dla standardowych raportów. Oznacz anomalie do przeglądu przez człowieka.
**Eskalacja:** Jeśli źródło danych jest niedostępne lub metryki wyglądają nietypowo (>2σ od normy)

### Kroki wykonania

1. Pobierz metryki ze skonfigurowanych źródeł
2. Porównaj z poprzednim tygodniem i celami
3. Wygeneruj raport w Reports/weekly/YYYY-MM-DD.md
4. Dostarcz podsumowanie przez skonfigurowany kanał
5. Zaloguj ukończenie do Agent/Logs/

### Czego NIE robić

- Nie wysyłaj raportów do podmiotów zewnętrznych
- Nie modyfikuj danych źródłowych
- Nie pomijaj wysyłki, jeśli metryki wyglądają źle — raportuj je rzetelnie
```

## Stałe zlecenia + cron jobs

Stałe zlecenia definiują, **co** agent ma uprawnienia robić. [Cron jobs](/automation/cron-jobs) definiują, **kiedy** to się dzieje. Działają razem:

```
Stałe zlecenie: „Odpowiadasz za codzienny triage skrzynki odbiorczej”
    ↓
Cron Job (codziennie o 8:00): „Wykonaj triage skrzynki odbiorczej zgodnie ze stałymi zleceniami”
    ↓
Agent: Odczytuje stałe zlecenia → wykonuje kroki → raportuje wyniki
```

Prompt cron job powinien odwoływać się do stałego zlecenia zamiast je powielać:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Wykonaj codzienny triage skrzynki odbiorczej zgodnie ze stałymi zleceniami. Sprawdź pocztę pod kątem nowych alertów. Przeanalizuj, skategoryzuj i zapisz każdy element. Zgłoś podsumowanie właścicielowi. Eskaluj nieznane przypadki."
```

## Przykłady

### Przykład 1: Treści i media społecznościowe (cykl tygodniowy)

```markdown
## Program: Treści i media społecznościowe

**Uprawnienia:** Tworzenie wersji roboczych treści, planowanie publikacji, przygotowywanie raportów zaangażowania
**Bramka akceptacji:** Wszystkie posty wymagają przeglądu właściciela przez pierwsze 30 dni, potem stała akceptacja
**Wyzwalacz:** Cykl tygodniowy (przegląd w poniedziałek → wersje robocze w środku tygodnia → podsumowanie w piątek)

### Cykl tygodniowy

- **Poniedziałek:** Przegląd metryk platform i zaangażowania odbiorców
- **Wtorek–czwartek:** Tworzenie wersji roboczych postów społecznościowych, przygotowywanie treści blogowych
- **Piątek:** Przygotowanie cotygodniowego briefu marketingowego → dostarczenie właścicielowi

### Reguły dotyczące treści

- Ton musi być zgodny z marką (zobacz `SOUL.md` lub przewodnik po tonie marki)
- Nigdy nie ujawniaj się jako AI w treściach publicznych
- Uwzględniaj metryki, gdy są dostępne
- Skupiaj się na wartości dla odbiorców, a nie na autopromocji
```

### Przykład 2: Operacje finansowe (wyzwalane zdarzeniem)

```markdown
## Program: Przetwarzanie finansowe

**Uprawnienia:** Przetwarzanie danych transakcyjnych, generowanie raportów, wysyłanie podsumowań
**Bramka akceptacji:** Brak dla analiz. Rekomendacje wymagają akceptacji właściciela.
**Wyzwalacz:** Wykrycie nowego pliku danych LUB zaplanowany cykl miesięczny

### Gdy nadejdą nowe dane

1. Wykryj nowy plik w wyznaczonym katalogu wejściowym
2. Przeanalizuj i skategoryzuj wszystkie transakcje
3. Porównaj z celami budżetowymi
4. Oznacz: nietypowe pozycje, przekroczenia progów, nowe opłaty cykliczne
5. Wygeneruj raport w wyznaczonym katalogu wyjściowym
6. Dostarcz podsumowanie właścicielowi przez skonfigurowany kanał

### Reguły eskalacji

- Pojedyncza pozycja > 500 USD: natychmiastowy alert
- Kategoria > budżet o 20%: oznacz w raporcie
- Nierozpoznawalna transakcja: poproś właściciela o kategoryzację
- Nieudane przetwarzanie po 2 ponownych próbach: zgłoś błąd, nie zgaduj
```

### Przykład 3: Monitoring i alerty (ciągłe)

```markdown
## Program: Monitorowanie systemu

**Uprawnienia:** Sprawdzanie stanu systemu, restartowanie usług, wysyłanie alertów
**Bramka akceptacji:** Restartuj usługi automatycznie. Eskaluj, jeśli restart nie powiedzie się dwa razy.
**Wyzwalacz:** W każdym cyklu heartbeat

### Kontrole

- Punkty końcowe stanu usług odpowiadają
- Miejsce na dysku powyżej progu
- Oczekujące zadania nie są przeterminowane (>24 godziny)
- Kanały dostarczania działają

### Macierz reakcji

| Warunek         | Działanie                | Eskalować?               |
| ---------------- | ------------------------ | ------------------------ |
| Usługa nie działa | Zrestartuj automatycznie | Tylko jeśli restart nie powiedzie się 2x |
| Miejsce na dysku < 10% | Zaalarmuj właściciela | Tak                      |
| Przeterminowane zadanie > 24h | Przypomnij właścicielowi | Nie                      |
| Kanał offline   | Zaloguj i spróbuj ponownie w następnym cyklu | Jeśli offline > 2 godziny |
```

## Wzorzec wykonaj-sprawdź-zaraportuj

Stałe zlecenia działają najlepiej w połączeniu ze ścisłą dyscypliną wykonywania. Każde zadanie w stałym zleceniu powinno przebiegać według tej pętli:

1. **Wykonaj** — wykonaj faktyczną pracę (nie tylko potwierdź instrukcję)
2. **Sprawdź** — potwierdź, że wynik jest poprawny (plik istnieje, wiadomość została dostarczona, dane przeanalizowano)
3. **Zaraportuj** — poinformuj właściciela, co zostało zrobione i co zostało zweryfikowane

```markdown
### Reguły wykonania

- Każde zadanie przebiega według wzorca wykonaj-sprawdź-zaraportuj. Bez wyjątków.
- „Zajmę się tym” nie jest wykonaniem. Zrób to, a potem zaraportuj.
- „Gotowe” bez weryfikacji nie jest akceptowalne. Udowodnij to.
- Jeśli wykonanie się nie powiedzie: spróbuj ponownie raz, zmieniając podejście.
- Jeśli nadal się nie powiedzie: zgłoś błąd wraz z diagnozą. Nigdy nie zawódź po cichu.
- Nigdy nie powtarzaj prób bez końca — maksymalnie 3 próby, potem eskalacja.
```

Ten wzorzec zapobiega najczęstszemu trybowi awarii agentów: potwierdzaniu zadania bez jego ukończenia.

## Architektura wieloprogramowa

W przypadku agentów zarządzających wieloma obszarami organizuj stałe zlecenia jako oddzielne programy z wyraźnymi granicami:

```markdown
# Stałe zlecenia

## Program 1: [Domena A] (Tygodniowo)

...

## Program 2: [Domena B] (Miesięcznie + Na żądanie)

...

## Program 3: [Domena C] (W razie potrzeby)

...

## Reguły eskalacji (Wszystkie programy)

- [Wspólne kryteria eskalacji]
- [Bramki akceptacji obowiązujące we wszystkich programach]
```

Każdy program powinien mieć:

- Własną **częstotliwość wyzwalania** (tygodniową, miesięczną, opartą na zdarzeniach, ciągłą)
- Własne **bramki akceptacji** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Najlepsze praktyki

### Rób

- Zaczynaj od wąskich uprawnień i rozszerzaj je wraz ze wzrostem zaufania
- Określaj jawne bramki akceptacji dla działań wysokiego ryzyka
- Dodawaj sekcje „Czego NIE robić” — granice są tak samo ważne jak uprawnienia
- Łącz z cron jobs, aby zapewnić niezawodne wykonywanie działań opartych na czasie
- Co tydzień przeglądaj logi agenta, aby sprawdzić, czy stałe zlecenia są przestrzegane
- Aktualizuj stałe zlecenia wraz ze zmianą potrzeb — to żywe dokumenty

### Unikaj

- Przyznawania szerokich uprawnień pierwszego dnia („rób, co uznasz za najlepsze”)
- Pomijania reguł eskalacji — każdy program potrzebuje klauzuli „kiedy się zatrzymać i zapytać”
- Zakładania, że agent zapamięta ustne instrukcje — umieść wszystko w pliku
- Mieszania różnych obszarów w jednym programie — oddzielne programy dla oddzielnych domen
- Zapominania o egzekwowaniu za pomocą cron jobs — stałe zlecenia bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automation & Tasks](/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Cron Jobs](/automation/cron-jobs) — egzekwowanie harmonogramu dla stałych zleceń
- [Hooks](/automation/hooks) — skrypty wyzwalane zdarzeniami dla zdarzeń cyklu życia agenta
- [Webhooks](/automation/cron-jobs#webhooks) — przychodzące wyzwalacze zdarzeń HTTP
- [Agent Workspace](/concepts/agent-workspace) — miejsce przechowywania stałych zleceń, w tym pełna lista automatycznie wstrzykiwanych plików bootstrap (`AGENTS.md`, `SOUL.md` itd.)
