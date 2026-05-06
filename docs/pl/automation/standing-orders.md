---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów, które działają bez monitowania przy każdym zadaniu
    - Określanie, co agent może robić samodzielnie, a co wymaga zatwierdzenia przez człowieka
    - Strukturyzowanie agentów wieloprogramowych z wyraźnymi granicami i zasadami eskalacji
summary: Zdefiniuj stałe uprawnienia operacyjne dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-05-06T09:02:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Stałe dyspozycje przyznają agentowi **stałe uprawnienia operacyjne** dla zdefiniowanych programów. Zamiast za każdym razem podawać instrukcje dla pojedynczego zadania, definiujesz programy z jasnym zakresem, wyzwalaczami i regułami eskalacji - a agent działa autonomicznie w tych granicach.

To różnica między mówieniem asystentowi „wyślij cotygodniowy raport” w każdy piątek a przyznaniem stałego uprawnienia: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego stałe dyspozycje

**Bez stałych dyspozycji:**

- Musisz instruować agenta dla każdego zadania
- Agent pozostaje bezczynny między żądaniami
- Rutynowa praca jest zapominana albo opóźniana
- To Ty stajesz się wąskim gardłem

**Ze stałymi dyspozycjami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowa praca odbywa się zgodnie z harmonogramem bez monitowania
- Angażujesz się tylko przy wyjątkach i zatwierdzeniach
- Agent produktywnie wypełnia czas bezczynności

## Jak działają

Stałe dyspozycje są definiowane w plikach [przestrzeni roboczej agenta](/pl/concepts/agent-workspace). Zalecane podejście to umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. W przypadku większych konfiguracji możesz też umieścić je w dedykowanym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** - do czego agent jest upoważniony
2. **Wyzwalacze** - kiedy wykonać działanie (harmonogram, zdarzenie lub warunek)
3. **Bramki zatwierdzania** - co wymaga akceptacji człowieka przed działaniem
4. **Reguły eskalacji** - kiedy przerwać i poprosić o pomoc

Agent ładuje te instrukcje w każdej sesji przez pliki startowe przestrzeni roboczej (zobacz [Przestrzeń robocza agenta](/pl/concepts/agent-workspace), aby uzyskać pełną listę automatycznie wstrzykiwanych plików) i wykonuje je razem z [zadaniami Cron](/pl/automation/cron-jobs) do wymuszania działań opartych na czasie.

<Tip>
Umieść stałe dyspozycje w `AGENTS.md`, aby zagwarantować, że będą ładowane w każdej sesji. Mechanizm startowy przestrzeni roboczej automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` - ale nie dowolne pliki w podkatalogach.
</Tip>

## Anatomia stałej dyspozycji

```markdown
## Program: Cotygodniowy raport statusu

**Uprawnienie:** Zbierać dane, generować raport, dostarczać go interesariuszom
**Wyzwalacz:** W każdy piątek o 16:00 (wymuszane przez zadanie cron)
**Bramka zatwierdzania:** Brak dla standardowych raportów. Oznaczaj anomalie do przeglądu przez człowieka.
**Eskalacja:** Jeśli źródło danych jest niedostępne lub metryki wyglądają nietypowo (>2σ od normy)

### Kroki wykonania

1. Pobierz metryki ze skonfigurowanych źródeł
2. Porównaj z poprzednim tygodniem i celami
3. Wygeneruj raport w Reports/weekly/YYYY-MM-DD.md
4. Dostarcz podsumowanie przez skonfigurowany kanał
5. Zapisz ukończenie w Agent/Logs/

### Czego NIE robić

- Nie wysyłaj raportów do stron zewnętrznych
- Nie modyfikuj danych źródłowych
- Nie pomijaj dostarczenia, jeśli metryki wyglądają źle - raportuj dokładnie
```

## Stałe dyspozycje plus zadania Cron

Stałe dyspozycje definiują **co** agent jest upoważniony robić. [Zadania Cron](/pl/automation/cron-jobs) definiują **kiedy** to się dzieje. Działają razem:

```
Stała dyspozycja: "Odpowiadasz za codzienną selekcję skrzynki odbiorczej"
    ↓
Zadanie Cron (codziennie o 8:00): "Wykonaj selekcję skrzynki odbiorczej zgodnie ze stałymi dyspozycjami"
    ↓
Agent: Odczytuje stałe dyspozycje → wykonuje kroki → raportuje wyniki
```

Monit zadania Cron powinien odwoływać się do stałej dyspozycji zamiast ją duplikować:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Przykłady

### Przykład 1: treści i media społecznościowe (cykl tygodniowy)

```markdown
## Program: Treści i media społecznościowe

**Uprawnienie:** Tworzyć wersje robocze treści, planować publikacje, przygotowywać raporty zaangażowania
**Bramka zatwierdzania:** Wszystkie wpisy wymagają przeglądu właściciela przez pierwsze 30 dni, potem obowiązuje stałe zatwierdzenie
**Wyzwalacz:** Cykl tygodniowy (poniedziałkowy przegląd → szkice w środku tygodnia → piątkowy brief)

### Cykl tygodniowy

- **Poniedziałek:** Przejrzyj metryki platform i zaangażowanie odbiorców
- **Wtorek-czwartek:** Przygotuj szkice wpisów społecznościowych, utwórz treści blogowe
- **Piątek:** Przygotuj cotygodniowy brief marketingowy → dostarcz właścicielowi

### Reguły treści

- Głos musi pasować do marki (zobacz SOUL.md lub przewodnik głosu marki)
- Nigdy nie identyfikuj się jako AI w treściach publicznych
- Uwzględniaj metryki, gdy są dostępne
- Skupiaj się na wartości dla odbiorców, nie na autopromocji
```

### Przykład 2: operacje finansowe (wyzwalane zdarzeniem)

```markdown
## Program: Przetwarzanie finansowe

**Uprawnienie:** Przetwarzać dane transakcyjne, generować raporty, wysyłać podsumowania
**Bramka zatwierdzania:** Brak dla analizy. Rekomendacje wymagają zatwierdzenia właściciela.
**Wyzwalacz:** Wykryto nowy plik danych ALBO zaplanowany cykl miesięczny

### Gdy pojawiają się nowe dane

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
- Nieudane przetwarzanie po 2 ponowieniach: zgłoś niepowodzenie, nie zgaduj
```

### Przykład 3: monitorowanie i alerty (ciągłe)

```markdown
## Program: Monitorowanie systemu

**Uprawnienie:** Sprawdzać kondycję systemu, restartować usługi, wysyłać alerty
**Bramka zatwierdzania:** Restartuj usługi automatycznie. Eskaluj, jeśli restart nie powiedzie się dwa razy.
**Wyzwalacz:** Każdy cykl heartbeat

### Kontrole

- Endpointy kondycji usług odpowiadają
- Miejsce na dysku powyżej progu
- Oczekujące zadania nie są przestarzałe (>24 godziny)
- Kanały dostarczania działają

### Macierz reakcji

| Warunek          | Działanie                | Eskalować?              |
| ---------------- | ------------------------ | ----------------------- |
| Usługa nie działa | Restart automatyczny     | Tylko jeśli restart nie powiedzie się 2x |
| Miejsce na dysku < 10% | Powiadom właściciela | Tak                     |
| Przestarzałe zadanie > 24h | Przypomnij właścicielowi | Nie              |
| Kanał offline    | Zaloguj i ponów w następnym cyklu | Jeśli offline > 2 godziny |
```

## Wzorzec wykonaj-zweryfikuj-zaraportuj

Stałe dyspozycje działają najlepiej w połączeniu ze ścisłą dyscypliną wykonania. Każde zadanie w stałej dyspozycji powinno przechodzić przez tę pętlę:

1. **Wykonaj** - Wykonaj właściwą pracę (nie tylko potwierdź instrukcję)
2. **Zweryfikuj** - Potwierdź, że wynik jest poprawny (plik istnieje, wiadomość dostarczona, dane przeanalizowane)
3. **Zaraportuj** - Powiedz właścicielowi, co zostało zrobione i co zweryfikowano

```markdown
### Reguły wykonania

- Każde zadanie stosuje Wykonaj-Zweryfikuj-Zaraportuj. Bez wyjątków.
- "Zrobię to" nie jest wykonaniem. Zrób to, a potem zaraportuj.
- "Gotowe" bez weryfikacji jest niedopuszczalne. Udowodnij to.
- Jeśli wykonanie się nie powiedzie: ponów raz ze zmienionym podejściem.
- Jeśli nadal się nie udaje: zgłoś niepowodzenie z diagnozą. Nigdy nie kończ po cichu.
- Nigdy nie ponawiaj bez końca - maksymalnie 3 próby, potem eskaluj.
```

Ten wzorzec zapobiega najczęstszemu trybowi awarii agenta: potwierdzeniu zadania bez jego ukończenia.

## Architektura wielu programów

W przypadku agentów zarządzających wieloma obszarami organizuj stałe dyspozycje jako oddzielne programy z jasnymi granicami:

```markdown
## Program 1: [Domena A] (Tygodniowo)

...

## Program 2: [Domena B] (Miesięcznie + na żądanie)

...

## Program 3: [Domena C] (W razie potrzeby)

...

## Reguły eskalacji (wszystkie programy)

- [Wspólne kryteria eskalacji]
- [Bramki zatwierdzania obowiązujące we wszystkich programach]
```

Każdy program powinien mieć:

- Własny **rytm wyzwalania** (tygodniowy, miesięczny, zdarzeniowy, ciągły)
- Własne **bramki zatwierdzania** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Najlepsze praktyki

### Zalecane

- Zacznij od wąskich uprawnień i rozszerzaj je wraz ze wzrostem zaufania
- Definiuj jednoznaczne bramki zatwierdzania dla działań wysokiego ryzyka
- Uwzględniaj sekcje „Czego NIE robić” - granice są równie ważne jak uprawnienia
- Łącz z zadaniami Cron, aby zapewnić niezawodne wykonywanie oparte na czasie
- Co tydzień przeglądaj logi agenta, aby zweryfikować, że stałe dyspozycje są przestrzegane
- Aktualizuj stałe dyspozycje wraz ze zmianą potrzeb - to żywe dokumenty

### Unikaj

- Przyznawania szerokich uprawnień pierwszego dnia („rób to, co uważasz za najlepsze”)
- Pomijania reguł eskalacji - każdy program potrzebuje klauzuli „kiedy przerwać i zapytać”
- Zakładania, że agent zapamięta instrukcje ustne - umieść wszystko w pliku
- Mieszania obszarów w jednym programie - oddzielne programy dla oddzielnych domen
- Zapominania o wymuszeniu przez zadania Cron - stałe dyspozycje bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automatyzacja i zadania](/pl/automation): wszystkie mechanizmy automatyzacji w skrócie.
- [Zadania Cron](/pl/automation/cron-jobs): wymuszanie harmonogramu dla stałych dyspozycji.
- [Hooki](/pl/automation/hooks): skrypty sterowane zdarzeniami dla zdarzeń cyklu życia agenta.
- [Webhooki](/pl/automation/cron-jobs#webhooks): przychodzące wyzwalacze zdarzeń HTTP.
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace): miejsce, w którym znajdują się stałe dyspozycje, w tym pełna lista automatycznie wstrzykiwanych plików startowych (`AGENTS.md`, `SOUL.md` itd.).
