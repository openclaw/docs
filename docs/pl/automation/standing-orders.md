---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów działających bez monitowania przy każdym zadaniu
    - Określanie, co agent może robić samodzielnie, a co wymaga zatwierdzenia przez człowieka
    - Strukturyzowanie agentów wieloprogramowych z wyraźnymi granicami i regułami eskalacji
summary: Zdefiniuj trwałe uprawnienia operacyjne dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-05-12T00:56:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
---

Stałe zlecenia nadają agentowi **trwałe uprawnienia operacyjne** dla zdefiniowanych programów. Zamiast za każdym razem podawać instrukcje dla pojedynczego zadania, definiujesz programy z jasnym zakresem, wyzwalaczami i regułami eskalacji - a agent działa autonomicznie w tych granicach.

To różnica między mówieniem asystentowi „wyślij cotygodniowy raport” w każdy piątek a nadaniem stałych uprawnień: „Odpowiadasz za cotygodniowy raport. Przygotuj go w każdy piątek, wyślij i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego stałe zlecenia

**Bez stałych zleceń:**

- Musisz instruować agenta przy każdym zadaniu
- Agent pozostaje bezczynny między żądaniami
- Rutynowa praca jest zapominana lub opóźniana
- Ty stajesz się wąskim gardłem

**Ze stałymi zleceniami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowa praca odbywa się zgodnie z harmonogramem bez przypominania
- Angażujesz się tylko przy wyjątkach i zatwierdzeniach
- Agent produktywnie wykorzystuje czas bezczynności

## Jak działają

Stałe zlecenia są definiowane w plikach [przestrzeni roboczej agenta](/pl/concepts/agent-workspace). Zalecane podejście to umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. W przypadku większych konfiguracji możesz też umieścić je w dedykowanym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** - co agent ma prawo robić
2. **Wyzwalacze** - kiedy wykonać działanie (harmonogram, zdarzenie lub warunek)
3. **Bramki zatwierdzeń** - co wymaga zgody człowieka przed działaniem
4. **Reguły eskalacji** - kiedy przerwać i poprosić o pomoc

Agent ładuje te instrukcje w każdej sesji za pośrednictwem plików inicjalizujących przestrzeń roboczą (pełna lista automatycznie wstrzykiwanych plików: [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)) i wykonuje je w połączeniu z [zadaniami Cron](/pl/automation/cron-jobs) do egzekwowania działań opartych na czasie.

<Tip>
Umieść stałe zlecenia w `AGENTS.md`, aby zagwarantować ich ładowanie w każdej sesji. Inicjalizacja przestrzeni roboczej automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` - ale nie dowolne pliki w podkatalogach.
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

Stałe zlecenia definiują, **co** agent ma prawo robić. [Zadania Cron](/pl/automation/cron-jobs) definiują, **kiedy** to się dzieje. Działają razem:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt zadania Cron powinien odwoływać się do stałego zlecenia zamiast je duplikować:

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

## Wzorzec wykonaj-zweryfikuj-zaraportuj

Stałe zlecenia działają najlepiej, gdy są połączone z rygorystyczną dyscypliną wykonania. Każde zadanie w stałym zleceniu powinno stosować tę pętlę:

1. **Wykonaj** - Wykonaj właściwą pracę (nie tylko potwierdź instrukcję)
2. **Zweryfikuj** - Potwierdź, że wynik jest poprawny (plik istnieje, wiadomość dostarczona, dane przeanalizowane)
3. **Zaraportuj** - Powiedz właścicielowi, co zrobiono i co zweryfikowano

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

## Architektura wieloprogramowa

W przypadku agentów zarządzających wieloma obszarami organizuj stałe zlecenia jako osobne programy z jasnymi granicami:

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

- Własną **kadencję wyzwalaczy** (tygodniową, miesięczną, sterowaną zdarzeniami, ciągłą)
- Własne **bramki zatwierdzeń** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Najlepsze praktyki

### Rób

- Zacznij od wąskich uprawnień i rozszerzaj je wraz ze wzrostem zaufania
- Definiuj wyraźne bramki zatwierdzeń dla działań wysokiego ryzyka
- Uwzględniaj sekcje „Czego NIE robić” - granice są równie ważne jak uprawnienia
- Łącz z zadaniami Cron, aby zapewnić niezawodne wykonywanie oparte na czasie
- Przeglądaj logi agenta co tydzień, aby sprawdzić, czy stałe zlecenia są przestrzegane
- Aktualizuj stałe zlecenia wraz ze zmianą potrzeb - to żywe dokumenty

### Unikaj

- Nadawania szerokich uprawnień pierwszego dnia („rób, co uważasz za najlepsze”)
- Pomijania reguł eskalacji - każdy program potrzebuje klauzuli „kiedy przerwać i zapytać”
- Zakładania, że agent zapamięta instrukcje ustne - umieść wszystko w pliku
- Mieszania obszarów w jednym programie - osobne programy dla osobnych domen
- Zapominania o egzekwowaniu przez zadania Cron - stałe zlecenia bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automatyzacja](/pl/automation): wszystkie mechanizmy automatyzacji w skrócie.
- [Zadania Cron](/pl/automation/cron-jobs): egzekwowanie harmonogramu dla stałych zleceń.
- [Hooks](/pl/automation/hooks): skrypty sterowane zdarzeniami dla zdarzeń cyklu życia agenta.
- [Webhooks](/pl/automation/cron-jobs#webhooks): przychodzące wyzwalacze zdarzeń HTTP.
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace): miejsce przechowywania stałych zleceń, w tym pełna lista automatycznie wstrzykiwanych plików inicjalizujących (`AGENTS.md`, `SOUL.md` itd.).
