---
read_when:
    - Configurando fluxos de trabalho autônomos de agentes que são executados sem prompts para cada tarefa
    - Definindo o que o agente pode fazer de forma independente e o que requer aprovação humana
    - Estruturação de agentes multiprograma com limites claros e regras de escalonamento
summary: Defina a autoridade operacional permanente para programas de agentes autônomos
title: Ordens permanentes
x-i18n:
    generated_at: "2026-07-11T23:43:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

As ordens permanentes concedem ao seu agente **autoridade operacional contínua** para programas definidos. Em vez de instruir o agente a cada tarefa, você define programas com escopo, gatilhos e regras de escalonamento claros, e o agente executa de forma autônoma dentro desses limites: “Você é responsável pelo relatório semanal. Compile-o toda sexta-feira, envie-o e só escale se algo parecer errado.”

## Por que usar ordens permanentes

**Sem ordens permanentes:** você instrui o agente para cada tarefa, o trabalho rotineiro é esquecido ou atrasado, e você se torna o gargalo.

**Com ordens permanentes:** o agente executa de forma autônoma dentro de limites definidos, o trabalho rotineiro ocorre conforme o cronograma, e você só precisa se envolver em exceções e aprovações.

## Como funcionam

As ordens permanentes são definidas nos arquivos do seu [espaço de trabalho do agente](/pt-BR/concepts/agent-workspace). A abordagem recomendada é incluí-las diretamente no `AGENTS.md` (que é injetado automaticamente em todas as sessões), para que o agente sempre as tenha em contexto. Para configurações maiores, você também pode colocá-las em um arquivo dedicado, como `standing-orders.md`, e referenciá-lo no `AGENTS.md`.

Cada programa especifica:

1. **Escopo** — o que o agente está autorizado a fazer
2. **Gatilhos** — quando executar (cronograma, evento ou condição)
3. **Pontos de aprovação** — o que exige autorização humana antes da execução
4. **Regras de escalonamento** — quando parar e pedir ajuda

O agente carrega essas instruções em todas as sessões por meio dos arquivos de inicialização do espaço de trabalho (consulte [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace) para ver a lista completa de arquivos injetados automaticamente) e as executa em conjunto com [trabalhos Cron](/pt-BR/automation/cron-jobs) para garantir o cumprimento de horários.

<Tip>
Coloque as ordens permanentes no `AGENTS.md` para garantir que sejam carregadas em todas as sessões. A inicialização do espaço de trabalho injeta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md`, mas não arquivos arbitrários em subdiretórios.
</Tip>

## Anatomia de uma ordem permanente

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

## Ordens permanentes combinadas com trabalhos Cron

As ordens permanentes definem **o que** o agente está autorizado a fazer. Os [trabalhos Cron](/pt-BR/automation/cron-jobs) definem **quando** isso acontece. Eles funcionam em conjunto:

```text
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

A instrução do trabalho Cron deve fazer referência à ordem permanente em vez de duplicá-la:

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

## Exemplos

### Exemplo 1: conteúdo e redes sociais (ciclo semanal)

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

### Exemplo 2: operações financeiras (acionadas por evento)

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

### Exemplo 3: monitoramento e alertas (contínuo)

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

## Padrão executar-verificar-relatar

As ordens permanentes funcionam melhor quando combinadas com uma disciplina rigorosa de execução. Toda tarefa de uma ordem permanente deve seguir este ciclo:

1. **Executar** — faça o trabalho de fato (não apenas confirme que recebeu a instrução)
2. **Verificar** — confirme que o resultado está correto (o arquivo existe, a mensagem foi entregue, os dados foram analisados)
3. **Relatar** — informe ao responsável o que foi feito e o que foi verificado

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Esse padrão evita o modo de falha mais comum dos agentes: confirmar uma tarefa sem concluí-la.

## Arquitetura com vários programas

Para agentes que gerenciam várias áreas, organize as ordens permanentes como programas separados, com limites claros:

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

Cada programa deve ter:

- Sua própria **cadência de acionamento** (semanal, mensal, orientada por eventos ou contínua)
- Seus próprios **pontos de aprovação** (alguns programas precisam de mais supervisão do que outros)
- **Limites** claros (o agente deve saber onde um programa termina e outro começa)

## Práticas recomendadas

### Faça

- Comece com autoridade restrita e amplie-a à medida que a confiança aumentar
- Defina pontos de aprovação explícitos para ações de alto risco
- Inclua seções “O que NÃO fazer” — os limites são tão importantes quanto as permissões
- Combine com trabalhos Cron para uma execução confiável baseada em horários
- Revise semanalmente os registros do agente para verificar se as ordens permanentes estão sendo seguidas
- Atualize as ordens permanentes à medida que suas necessidades evoluírem — elas são documentos vivos

### Evite

- Conceder autoridade ampla logo no primeiro dia (“faça o que você achar melhor”)
- Omitir regras de escalonamento — todo programa precisa de uma cláusula que defina “quando parar e perguntar”
- Presumir que o agente lembrará de instruções verbais — coloque tudo no arquivo
- Misturar áreas em um único programa — use programas separados para áreas distintas
- Esquecer de aplicar os gatilhos com trabalhos Cron — ordens permanentes sem gatilhos se tornam apenas sugestões

## Conteúdo relacionado

- [Automação](/pt-BR/automation): visão geral de todos os mecanismos de automação.
- [Trabalhos Cron](/pt-BR/automation/cron-jobs): aplicação de cronogramas para ordens permanentes.
- [Hooks](/pt-BR/automation/hooks): scripts orientados por eventos do ciclo de vida do agente.
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks): gatilhos de eventos HTTP recebidos.
- [Espaço de trabalho do agente](/pt-BR/concepts/agent-workspace): onde ficam as ordens permanentes, incluindo a lista completa de arquivos de inicialização injetados automaticamente (`AGENTS.md`, `SOUL.md` etc.).
