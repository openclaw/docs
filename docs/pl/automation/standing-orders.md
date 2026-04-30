---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów działających bez monitowania przy każdym zadaniu
    - Określanie, co agent może robić samodzielnie, a co wymaga zatwierdzenia przez człowieka
    - Strukturyzowanie agentów wieloprogramowych z jasnymi granicami i zasadami eskalacji
summary: Określ stałe uprawnienia operacyjne dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-04-30T09:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

Stałe zlecenia nadają Twojemu agentowi **stałe uprawnienia operacyjne** dla zdefiniowanych programów. Zamiast za każdym razem podawać instrukcje do pojedynczych zadań, definiujesz programy z jasnym zakresem, wyzwalaczami i regułami eskalacji — a agent wykonuje je autonomicznie w tych granicach.

To różnica między mówieniem asystentowi „wyślij cotygodniowy raport” w każdy piątek a nadaniem stałego uprawnienia: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego stałe zlecenia

**Bez stałych zleceń:**

- Musisz wydawać agentowi polecenie dla każdego zadania
- Agent pozostaje bezczynny między żądaniami
- Rutynowa praca zostaje zapomniana lub opóźniona
- Stajesz się wąskim gardłem

**Ze stałymi zleceniami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowa praca odbywa się zgodnie z harmonogramem bez przypominania
- Angażujesz się tylko przy wyjątkach i zatwierdzeniach
- Agent produktywnie wykorzystuje czas bezczynności

## Jak działają

Stałe zlecenia są definiowane w plikach [przestrzeni roboczej agenta](/pl/concepts/agent-workspace). Zalecane podejście to umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. Przy większych konfiguracjach możesz też umieścić je w dedykowanym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** — co agent ma uprawnienia robić
2. **Wyzwalacze** — kiedy wykonać zadanie (harmonogram, zdarzenie lub warunek)
3. **Bramki zatwierdzania** — co wymaga akceptacji człowieka przed wykonaniem
4. **Reguły eskalacji** — kiedy zatrzymać się i poprosić o pomoc

Agent ładuje te instrukcje w każdej sesji przez pliki inicjalizacji przestrzeni roboczej (pełną listę automatycznie wstrzykiwanych plików znajdziesz w [Przestrzeni roboczej agenta](/pl/concepts/agent-workspace)) i wykonuje je, łącząc z [zadaniami Cron](/pl/automation/cron-jobs) w celu egzekwowania działań zależnych od czasu.

<Tip>
Umieść stałe zlecenia w `AGENTS.md`, aby zagwarantować ich ładowanie w każdej sesji. Inicjalizacja przestrzeni roboczej automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` — ale nie dowolne pliki w podkatalogach.
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
- Do not skip delivery if metrics look bad — report accurately
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

Prompt zadania Cron powinien odwoływać się do stałego zlecenia, a nie je duplikować:

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
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
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

Stałe zlecenia działają najlepiej w połączeniu ze ścisłą dyscypliną wykonania. Każde zadanie w stałym zleceniu powinno podążać za tą pętlą:

1. **Wykonaj** — wykonaj rzeczywistą pracę (nie tylko potwierdź instrukcję)
2. **Zweryfikuj** — potwierdź, że wynik jest poprawny (plik istnieje, wiadomość dostarczona, dane przeanalizowane)
3. **Zaraportuj** — powiedz właścicielowi, co zostało zrobione i co zweryfikowano

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Ten wzorzec zapobiega najczęstszemu trybowi awarii agenta: potwierdzeniu zadania bez jego ukończenia.

## Architektura wielu programów

W przypadku agentów zarządzających wieloma obszarami zorganizuj stałe zlecenia jako oddzielne programy z jasnymi granicami:

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
- Własne **bramki zatwierdzania** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Najlepsze praktyki

### Rób

- Zacznij od wąskich uprawnień i rozszerzaj je wraz ze wzrostem zaufania
- Definiuj jawne bramki zatwierdzania dla działań wysokiego ryzyka
- Uwzględniaj sekcje „Czego NIE robić” — granice są równie ważne jak uprawnienia
- Łącz ze zadaniami Cron, aby zapewnić niezawodne wykonanie zależne od czasu
- Co tydzień przeglądaj logi agenta, aby zweryfikować, że stałe zlecenia są realizowane
- Aktualizuj stałe zlecenia wraz ze zmianą potrzeb — to żywe dokumenty

### Unikaj

- Nadawania szerokich uprawnień pierwszego dnia („rób, co uważasz za najlepsze”)
- Pomijania reguł eskalacji — każdy program potrzebuje klauzuli „kiedy zatrzymać się i zapytać”
- Zakładania, że agent zapamięta instrukcje ustne — umieść wszystko w pliku
- Mieszania obszarów w jednym programie — oddzielne programy dla oddzielnych domen
- Zapominania o egzekwowaniu przez zadania Cron — stałe zlecenia bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automatyzacja i zadania](/pl/automation): wszystkie mechanizmy automatyzacji w skrócie.
- [Zadania Cron](/pl/automation/cron-jobs): egzekwowanie harmonogramu dla stałych zleceń.
- [Hooki](/pl/automation/hooks): skrypty sterowane zdarzeniami dla zdarzeń cyklu życia agenta.
- [Webhooki](/pl/automation/cron-jobs#webhooks): przychodzące wyzwalacze zdarzeń HTTP.
- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace): miejsce, w którym znajdują się stałe zlecenia, w tym pełna lista automatycznie wstrzykiwanych plików inicjalizacji (`AGENTS.md`, `SOUL.md` itd.).
