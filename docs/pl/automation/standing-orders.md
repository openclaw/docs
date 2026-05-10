---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów działających bez każdorazowego podawania poleceń dla zadań
    - Określanie, co agent może zrobić samodzielnie, a co wymaga zatwierdzenia przez człowieka
    - Strukturyzowanie agentów wieloprogramowych z jasnymi granicami i zasadami eskalacji
summary: Zdefiniuj stałe uprawnienia do działania dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-05-10T19:21:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

Stałe zlecenia nadają Twojemu agentowi **stałe uprawnienia operacyjne** dla zdefiniowanych programów. Zamiast za każdym razem podawać instrukcje dla pojedynczego zadania, definiujesz programy z jasnym zakresem, wyzwalaczami i regułami eskalacji - a agent wykonuje je autonomicznie w tych granicach.

To różnica między mówieniem asystentowi „wyślij cotygodniowy raport” w każdy piątek a nadaniem stałych uprawnień: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego stałe zlecenia

**Bez stałych zleceń:**

- Musisz monitować agenta dla każdego zadania
- Agent pozostaje bezczynny między żądaniami
- Rutynowa praca jest zapominana lub opóźniana
- Stajesz się wąskim gardłem

**Ze stałymi zleceniami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowa praca odbywa się zgodnie z harmonogramem bez monitowania
- Angażujesz się tylko przy wyjątkach i zatwierdzeniach
- Agent produktywnie wykorzystuje czas bezczynności

## Jak działają

Stałe zlecenia są definiowane w plikach Twojego [obszaru roboczego agenta](/pl/concepts/agent-workspace). Zalecane podejście to umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. W przypadku większych konfiguracji możesz też umieścić je w dedykowanym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** - do czego agent jest upoważniony
2. **Wyzwalacze** - kiedy wykonywać działania (harmonogram, zdarzenie lub warunek)
3. **Bramki zatwierdzania** - co wymaga podpisu człowieka przed działaniem
4. **Reguły eskalacji** - kiedy zatrzymać się i poprosić o pomoc

Agent ładuje te instrukcje w każdej sesji przez pliki inicjalizujące obszar roboczy (pełną listę automatycznie wstrzykiwanych plików znajdziesz w [Obszar roboczy agenta](/pl/concepts/agent-workspace)) i wykonuje je, łącząc je z [zadaniami Cron](/pl/automation/cron-jobs) w celu egzekwowania działań opartych na czasie.

<Tip>
Umieść stałe zlecenia w `AGENTS.md`, aby zagwarantować, że będą ładowane w każdej sesji. Inicjalizacja obszaru roboczego automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` - ale nie dowolne pliki w podkatalogach.
</Tip>

## Anatomia stałego zlecenia

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## Stałe zlecenia plus zadania Cron

Stałe zlecenia definiują, **co** agent ma uprawnienia robić. [Zadania Cron](/pl/automation/cron-jobs) definiują, **kiedy** to się dzieje. Działają razem:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Monit zadania Cron powinien odwoływać się do stałego zlecenia, zamiast je powielać:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Przykłady

### Przykład 1: treści i media społecznościowe (cykl tygodniowy)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Przykład 2: operacje finansowe (wyzwalane zdarzeniem)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Przykład 3: monitorowanie i alerty (ciągłe)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Wzorzec wykonaj-sprawdź-zaraportuj

Stałe zlecenia działają najlepiej w połączeniu ze ścisłą dyscypliną wykonania. Każde zadanie w stałym zleceniu powinno przebiegać według tej pętli:

1. **Wykonaj** - Zrób faktyczną pracę (nie tylko potwierdź instrukcję)
2. **Sprawdź** - Potwierdź, że wynik jest poprawny (plik istnieje, wiadomość dostarczona, dane sparsowane)
3. **Zaraportuj** - Powiedz właścicielowi, co zostało zrobione i co zostało sprawdzone

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Ten wzorzec zapobiega najczęstszemu trybowi awarii agenta: potwierdzeniu zadania bez jego ukończenia.

## Architektura wielu programów

W przypadku agentów zarządzających wieloma obszarami uporządkuj stałe zlecenia jako osobne programy z jasnymi granicami:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Każdy program powinien mieć:

- Własną **kadencję wyzwalania** (tygodniową, miesięczną, sterowaną zdarzeniami, ciągłą)
- Własne **bramki zatwierdzania** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Najlepsze praktyki

### Rób

- Zacznij od wąskich uprawnień i rozszerzaj je wraz ze wzrostem zaufania
- Zdefiniuj jawne bramki zatwierdzania dla działań wysokiego ryzyka
- Uwzględnij sekcje „Czego NIE robić” - granice są równie ważne jak uprawnienia
- Łącz z zadaniami Cron, aby zapewnić niezawodne wykonywanie oparte na czasie
- Przeglądaj logi agenta co tydzień, aby sprawdzać, czy stałe zlecenia są przestrzegane
- Aktualizuj stałe zlecenia wraz ze zmianą potrzeb - to żywe dokumenty

### Unikaj

- Nadawania szerokich uprawnień pierwszego dnia („rób, co uważasz za najlepsze”)
- Pomijania reguł eskalacji - każdy program potrzebuje klauzuli „kiedy zatrzymać się i zapytać”
- Zakładania, że agent zapamięta instrukcje ustne - umieść wszystko w pliku
- Mieszania obszarów w jednym programie - osobne programy dla osobnych domen
- Zapominania o egzekwowaniu przez zadania Cron - stałe zlecenia bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automatyzacja i zadania](/pl/automation): wszystkie mechanizmy automatyzacji w skrócie.
- [Zadania Cron](/pl/automation/cron-jobs): egzekwowanie harmonogramu dla stałych zleceń.
- [Hooki](/pl/automation/hooks): skrypty sterowane zdarzeniami dla zdarzeń cyklu życia agenta.
- [Webhooki](/pl/automation/cron-jobs#webhooks): przychodzące wyzwalacze zdarzeń HTTP.
- [Obszar roboczy agenta](/pl/concepts/agent-workspace): miejsce, w którym znajdują się stałe zlecenia, wraz z pełną listą automatycznie wstrzykiwanych plików inicjalizujących (`AGENTS.md`, `SOUL.md` itd.).
