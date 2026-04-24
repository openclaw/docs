---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów, które działają bez promptów dla każdego zadania
    - Określanie, co agent może robić samodzielnie, a co wymaga zgody człowieka
    - Strukturyzowanie agentów wieloprogramowych z jasno określonymi granicami i zasadami eskalacji
summary: Zdefiniuj stałe uprawnienia operacyjne dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-04-24T08:57:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

Stałe polecenia przyznają agentowi **stałe uprawnienia operacyjne** dla zdefiniowanych programów. Zamiast za każdym razem wydawać instrukcje do pojedynczego zadania, definiujesz programy z jasnym zakresem, wyzwalaczami i zasadami eskalacji — a agent działa autonomicznie w tych granicach.

To jest różnica między mówieniem asystentowi „wyślij cotygodniowy raport” w każdy piątek a przyznaniem stałych uprawnień: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego stałe polecenia?

**Bez stałych poleceń:**

- Musisz wywoływać agenta do każdego zadania
- Agent pozostaje bezczynny między żądaniami
- Rutynowe zadania są zapominane lub opóźniane
- Stajesz się wąskim gardłem

**Ze stałymi poleceniami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowe zadania są wykonywane zgodnie z harmonogramem bez dodatkowych poleceń
- Angażujesz się tylko w przypadku wyjątków i zgód
- Agent produktywnie wykorzystuje czas bezczynności

## Jak to działa

Stałe polecenia są definiowane w plikach [obszaru roboczego agenta](/pl/concepts/agent-workspace). Zalecanym podejściem jest umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. W przypadku większych konfiguracji możesz też umieścić je w dedykowanym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** — do czego agent jest upoważniony
2. **Wyzwalacze** — kiedy ma działać (harmonogram, zdarzenie lub warunek)
3. **Bramki zatwierdzania** — co wymaga akceptacji człowieka przed działaniem
4. **Zasady eskalacji** — kiedy przerwać i poprosić o pomoc

Agent ładuje te instrukcje w każdej sesji przez pliki bootstrap obszaru roboczego (zobacz [Agent Workspace](/pl/concepts/agent-workspace), aby poznać pełną listę plików wstrzykiwanych automatycznie) i działa na ich podstawie, w połączeniu z [zadaniami Cron](/pl/automation/cron-jobs) dla egzekwowania opartego na czasie.

<Tip>
Umieść stałe polecenia w `AGENTS.md`, aby mieć pewność, że są ładowane w każdej sesji. Bootstrap obszaru roboczego automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` — ale nie dowolne pliki w podkatalogach.
</Tip>

## Anatomia stałego polecenia

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution Steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to Do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Stałe polecenia + zadania Cron

Stałe polecenia definiują, **co** agent jest upoważniony robić. [Zadania Cron](/pl/automation/cron-jobs) definiują, **kiedy** to się dzieje. Działają razem:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Prompt zadania Cron powinien odwoływać się do stałego polecenia, zamiast je powielać:

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

### Przykład 1: Treści i media społecznościowe (cykl tygodniowy)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly Cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content Rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Przykład 2: Operacje finansowe (wyzwalane zdarzeniami)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When New Data Arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation Rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Przykład 3: Monitorowanie i alerty (ciągłe)

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

### Response Matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Wzorzec Wykonaj-Sprawdź-Zgłoś

Stałe polecenia działają najlepiej w połączeniu ze ścisłą dyscypliną wykonania. Każde zadanie w stałym poleceniu powinno przebiegać według tej pętli:

1. **Wykonaj** — wykonaj rzeczywistą pracę (nie tylko potwierdź instrukcję)
2. **Sprawdź** — potwierdź, że wynik jest prawidłowy (plik istnieje, wiadomość została dostarczona, dane zostały sparsowane)
3. **Zgłoś** — poinformuj właściciela, co zostało wykonane i co zostało sprawdzone

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Ten wzorzec zapobiega najczęstszemu trybowi awarii agentów: potwierdzeniu zadania bez jego ukończenia.

## Architektura wieloprogramowa

W przypadku agentów zarządzających wieloma obszarami, organizuj stałe polecenia jako osobne programy z jasno określonymi granicami:

```markdown
# Standing Orders

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

- Własną **częstotliwość wyzwalania** (tygodniową, miesięczną, sterowaną zdarzeniami, ciągłą)
- Własne **bramki zatwierdzania** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Sprawdzone praktyki

### Rób

- Zaczynaj od wąskiego zakresu uprawnień i rozszerzaj go wraz ze wzrostem zaufania
- Definiuj jawne bramki zatwierdzania dla działań o wysokim ryzyku
- Dodawaj sekcje „Czego NIE robić” — granice są tak samo ważne jak uprawnienia
- Łącz z zadaniami Cron, aby zapewnić niezawodne wykonywanie oparte na czasie
- Co tydzień przeglądaj logi agenta, aby sprawdzać, czy stałe polecenia są przestrzegane
- Aktualizuj stałe polecenia wraz ze zmianą potrzeb — to żywe dokumenty

### Unikaj

- Przyznawania szerokich uprawnień pierwszego dnia („rób, co uznasz za najlepsze”)
- Pomijania zasad eskalacji — każdy program potrzebuje klauzuli „kiedy się zatrzymać i zapytać”
- Zakładania, że agent zapamięta ustne instrukcje — wszystko umieszczaj w pliku
- Mieszania różnych obszarów w jednym programie — oddzielne programy dla oddzielnych domen
- Zapominania o egzekwowaniu przez zadania Cron — stałe polecenia bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automation & Tasks](/pl/automation) — wszystkie mechanizmy automatyzacji w skrócie
- [Cron Jobs](/pl/automation/cron-jobs) — egzekwowanie harmonogramu dla stałych poleceń
- [Hooks](/pl/automation/hooks) — skrypty sterowane zdarzeniami dla zdarzeń cyklu życia agenta
- [Webhooks](/pl/automation/cron-jobs#webhooks) — przychodzące wyzwalacze zdarzeń HTTP
- [Agent Workspace](/pl/concepts/agent-workspace) — miejsce, w którym znajdują się stałe polecenia, wraz z pełną listą automatycznie wstrzykiwanych plików bootstrap (AGENTS.md, SOUL.md itd.)
