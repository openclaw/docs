---
read_when:
    - Configurar flujos de trabajo de agentes autónomos que se ejecutan sin solicitar instrucciones para cada tarea
    - Definir qué puede hacer el agente de forma independiente y qué requiere aprobación humana
    - Estructurar agentes de múltiples programas con límites claros y reglas de escalamiento
summary: Definir la autoridad operativa permanente para programas de agentes autónomos
title: Instrucciones permanentes
x-i18n:
    generated_at: "2026-05-12T00:56:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Las instrucciones permanentes otorgan a tu agente **autoridad operativa permanente** para programas definidos. En lugar de dar instrucciones de tarea individuales cada vez, defines programas con alcance, activadores y reglas de escalamiento claros, y el agente ejecuta de forma autónoma dentro de esos límites.

Esta es la diferencia entre decirle a tu asistente "envía el informe semanal" cada viernes y concederle autoridad permanente: "Tú te encargas del informe semanal. Compílalo cada viernes, envíalo y escala solo si algo parece incorrecto."

## Por qué usar instrucciones permanentes

**Sin instrucciones permanentes:**

- Debes indicarle al agente cada tarea
- El agente permanece inactivo entre solicitudes
- El trabajo rutinario se olvida o se retrasa
- Tú te conviertes en el cuello de botella

**Con instrucciones permanentes:**

- El agente ejecuta de forma autónoma dentro de límites definidos
- El trabajo rutinario ocurre según lo programado sin indicaciones
- Solo participas en excepciones y aprobaciones
- El agente aprovecha el tiempo inactivo de forma productiva

## Cómo funcionan

Las instrucciones permanentes se definen en los archivos de tu [espacio de trabajo del agente](/es/concepts/agent-workspace). El enfoque recomendado es incluirlas directamente en `AGENTS.md` (que se inyecta automáticamente en cada sesión) para que el agente siempre las tenga en contexto. Para configuraciones más grandes, también puedes colocarlas en un archivo dedicado como `standing-orders.md` y hacer referencia a él desde `AGENTS.md`.

Cada programa especifica:

1. **Alcance** - lo que el agente está autorizado a hacer
2. **Activadores** - cuándo ejecutar (programación, evento o condición)
3. **Puertas de aprobación** - qué requiere aprobación humana antes de actuar
4. **Reglas de escalamiento** - cuándo detenerse y pedir ayuda

El agente carga estas instrucciones en cada sesión mediante los archivos de inicialización del espacio de trabajo (consulta [Espacio de trabajo del agente](/es/concepts/agent-workspace) para ver la lista completa de archivos inyectados automáticamente) y las ejecuta, combinadas con [trabajos Cron](/es/automation/cron-jobs) para la aplicación basada en tiempo.

<Tip>
Coloca las instrucciones permanentes en `AGENTS.md` para garantizar que se carguen en cada sesión. La inicialización del espacio de trabajo inyecta automáticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` y `MEMORY.md`, pero no archivos arbitrarios en subdirectorios.
</Tip>

## Anatomía de una instrucción permanente

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

## Instrucciones permanentes más trabajos Cron

Las instrucciones permanentes definen **qué** está autorizado a hacer el agente. Los [trabajos Cron](/es/automation/cron-jobs) definen **cuándo** ocurre. Funcionan juntos:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

El prompt del trabajo Cron debe hacer referencia a la instrucción permanente en lugar de duplicarla:

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

## Ejemplos

### Ejemplo 1: contenido y redes sociales (ciclo semanal)

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

### Ejemplo 2: operaciones financieras (activado por evento)

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

### Ejemplo 3: monitoreo y alertas (continuo)

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

## Patrón ejecutar-verificar-informar

Las instrucciones permanentes funcionan mejor cuando se combinan con una disciplina estricta de ejecución. Cada tarea en una instrucción permanente debe seguir este ciclo:

1. **Ejecutar** - Hacer el trabajo real (no solo reconocer la instrucción)
2. **Verificar** - Confirmar que el resultado es correcto (el archivo existe, el mensaje se entregó, los datos se analizaron)
3. **Informar** - Decirle al propietario qué se hizo y qué se verificó

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Este patrón evita el modo de fallo más común del agente: reconocer una tarea sin completarla.

## Arquitectura multiprograma

Para agentes que gestionan varias áreas, organiza las instrucciones permanentes como programas separados con límites claros:

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

Cada programa debe tener:

- Su propia **cadencia de activación** (semanal, mensual, basada en eventos, continua)
- Sus propias **puertas de aprobación** (algunos programas necesitan más supervisión que otros)
- **Límites** claros (el agente debe saber dónde termina un programa y empieza otro)

## Buenas prácticas

### Haz

- Comienza con autoridad limitada y amplíala a medida que aumente la confianza
- Define puertas de aprobación explícitas para acciones de alto riesgo
- Incluye secciones de "Qué NO hacer": los límites importan tanto como los permisos
- Combina con trabajos Cron para una ejecución fiable basada en tiempo
- Revisa los registros del agente semanalmente para verificar que se estén siguiendo las instrucciones permanentes
- Actualiza las instrucciones permanentes a medida que evolucionen tus necesidades: son documentos vivos

### Evita

- Conceder autoridad amplia el primer día ("haz lo que creas mejor")
- Omitir reglas de escalamiento: cada programa necesita una cláusula de "cuándo detenerse y preguntar"
- Asumir que el agente recordará instrucciones verbales: ponlo todo en el archivo
- Mezclar áreas en un solo programa: programas separados para dominios separados
- Olvidar aplicar con trabajos Cron: las instrucciones permanentes sin activadores se convierten en sugerencias

## Relacionado

- [Automatización](/es/automation): todos los mecanismos de automatización de un vistazo.
- [Trabajos Cron](/es/automation/cron-jobs): aplicación de programación para instrucciones permanentes.
- [Hooks](/es/automation/hooks): scripts activados por eventos para eventos del ciclo de vida del agente.
- [Webhooks](/es/automation/cron-jobs#webhooks): activadores de eventos HTTP entrantes.
- [Espacio de trabajo del agente](/es/concepts/agent-workspace): donde viven las instrucciones permanentes, incluida la lista completa de archivos de inicialización inyectados automáticamente (`AGENTS.md`, `SOUL.md`, etc.).
