---
read_when:
    - Configurando fluxos de trabalho de agentes autônomos que são executados sem solicitação por tarefa
    - Definindo o que o agente pode fazer de forma independente versus o que precisa de aprovação humana
    - Estruturando agentes de múltiplos programas com limites claros e regras de escalonamento
summary: Definir autoridade operacional permanente para programas de agentes autônomos
title: Ordens permanentes
x-i18n:
    generated_at: "2026-04-24T05:40:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a69cd16b23caedea5020e6bf6dfbe4f77b5bcd5a329af7dfcf535c6aa0924ce4
    source_path: automation/standing-orders.md
    workflow: 15
---

As ordens permanentes concedem ao seu agente **autoridade operacional permanente** para programas definidos. Em vez de fornecer instruções de tarefa individuais a cada vez, você define programas com escopo, gatilhos e regras de escalonamento claros — e o agente executa de forma autônoma dentro desses limites.

Essa é a diferença entre dizer ao seu assistente "envie o relatório semanal" toda sexta-feira versus conceder autoridade permanente: "Você é responsável pelo relatório semanal. Compile-o toda sexta-feira, envie-o e só escale se algo parecer errado."

## Por que usar ordens permanentes?

**Sem ordens permanentes:**

- Você precisa solicitar cada tarefa ao agente
- O agente fica ocioso entre as solicitações
- O trabalho rotineiro é esquecido ou atrasado
- Você se torna o gargalo

**Com ordens permanentes:**

- O agente executa de forma autônoma dentro de limites definidos
- O trabalho rotineiro acontece no horário, sem necessidade de solicitação
- Você só se envolve em exceções e aprovações
- O agente preenche o tempo ocioso de forma produtiva

## Como funcionam

As ordens permanentes são definidas nos arquivos do seu [espaço de trabalho do agente](/pt-BR/concepts/agent-workspace). A abordagem recomendada é incluí-las diretamente em `AGENTS.md` (que é injetado automaticamente em toda sessão) para que o agente sempre as tenha no contexto. Para configurações maiores, você também pode colocá-las em um arquivo dedicado, como `standing-orders.md`, e referenciá-lo a partir de `AGENTS.md`.

Cada programa especifica:

1. **Escopo** — o que o agente está autorizado a fazer
2. **Gatilhos** — quando executar (agenda, evento ou condição)
3. **Portões de aprovação** — o que exige aprovação humana antes de agir
4. **Regras de escalonamento** — quando parar e pedir ajuda

O agente carrega essas instruções em toda sessão por meio dos arquivos de bootstrap do espaço de trabalho (consulte [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace) para ver a lista completa de arquivos injetados automaticamente) e as executa em conjunto com [tarefas Cron](/pt-BR/automation/cron-jobs) para aplicação baseada em tempo.

<Tip>
Coloque as ordens permanentes em `AGENTS.md` para garantir que sejam carregadas em toda sessão. O bootstrap do espaço de trabalho injeta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` — mas não arquivos arbitrários em subdiretórios.
</Tip>

## Anatomia de uma ordem permanente

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

## Ordens permanentes + tarefas Cron

As ordens permanentes definem **o que** o agente está autorizado a fazer. As [tarefas Cron](/pt-BR/automation/cron-jobs) definem **quando** isso acontece. Elas funcionam em conjunto:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

O prompt da tarefa Cron deve fazer referência à ordem permanente em vez de duplicá-la:

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

## Exemplos

### Exemplo 1: Conteúdo e redes sociais (ciclo semanal)

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

### Exemplo 2: Operações financeiras (acionadas por evento)

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

### Exemplo 3: Monitoramento e alertas (contínuo)

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

## O padrão Executar-Verificar-Relatar

As ordens permanentes funcionam melhor quando combinadas com disciplina rigorosa de execução. Toda tarefa em uma ordem permanente deve seguir este ciclo:

1. **Executar** — fazer o trabalho de fato (não apenas reconhecer a instrução)
2. **Verificar** — confirmar que o resultado está correto (o arquivo existe, a mensagem foi entregue, os dados foram analisados)
3. **Relatar** — informar ao proprietário o que foi feito e o que foi verificado

```markdown
### Execution Rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Esse padrão evita o modo de falha mais comum dos agentes: reconhecer uma tarefa sem concluí-la.

## Arquitetura de múltiplos programas

Para agentes que gerenciam várias áreas, organize as ordens permanentes como programas separados com limites claros:

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

Cada programa deve ter:

- Seu próprio **ritmo de acionamento** (semanal, mensal, orientado por evento, contínuo)
- Seus próprios **portões de aprovação** (alguns programas exigem mais supervisão do que outros)
- **Limites** claros (o agente deve saber onde um programa termina e outro começa)

## Boas práticas

### Faça

- Comece com autoridade limitada e expanda à medida que a confiança aumenta
- Defina portões de aprovação explícitos para ações de alto risco
- Inclua seções de "O que NÃO fazer" — os limites importam tanto quanto as permissões
- Combine com tarefas Cron para execução confiável baseada em tempo
- Revise os logs do agente semanalmente para verificar se as ordens permanentes estão sendo seguidas
- Atualize as ordens permanentes conforme suas necessidades evoluem — elas são documentos vivos

### Evite

- Conceder autoridade ampla no primeiro dia ("faça o que você achar melhor")
- Pular regras de escalonamento — todo programa precisa de uma cláusula de "quando parar e perguntar"
- Pressupor que o agente vai se lembrar de instruções verbais — coloque tudo no arquivo
- Misturar assuntos em um único programa — programas separados para domínios separados
- Esquecer de aplicar com tarefas Cron — ordens permanentes sem gatilhos viram sugestões

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um relance
- [Tarefas Cron](/pt-BR/automation/cron-jobs) — aplicação de agendamento para ordens permanentes
- [Hooks](/pt-BR/automation/hooks) — scripts orientados por evento para eventos do ciclo de vida do agente
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks) — gatilhos de eventos HTTP de entrada
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace) — onde as ordens permanentes ficam, incluindo a lista completa de arquivos de bootstrap injetados automaticamente (`AGENTS.md`, `SOUL.md` etc.)
