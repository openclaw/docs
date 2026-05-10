---
read_when:
    - Configuração de fluxos de trabalho de agentes autônomos executados sem solicitação por tarefa
    - Definindo o que o agente pode fazer de forma independente e o que precisa de aprovação humana
    - Estruturação de agentes multiprograma com limites claros e regras de escalonamento
summary: Defina uma autoridade operacional permanente para programas de agentes autônomos
title: Ordens permanentes
x-i18n:
    generated_at: "2026-05-10T19:21:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c78a723c296e1b695fd0fa7b0c3dbc3572fcfc1f49d6fadcab7a5a7a44c4b8d
    source_path: automation/standing-orders.md
    workflow: 16
---

Ordens permanentes concedem ao seu agente **autoridade operacional permanente** para programas definidos. Em vez de fornecer instruções de tarefas individuais a cada vez, você define programas com escopo, gatilhos e regras de escalonamento claros - e o agente executa autonomamente dentro desses limites.

Essa é a diferença entre dizer ao seu assistente "envie o relatório semanal" toda sexta-feira e conceder autoridade permanente: "Você é responsável pelo relatório semanal. Compile-o toda sexta-feira, envie-o e só escale se algo parecer errado."

## Por que usar ordens permanentes

**Sem ordens permanentes:**

- Você precisa instruir o agente para cada tarefa
- O agente fica ocioso entre solicitações
- Trabalho rotineiro é esquecido ou atrasado
- Você se torna o gargalo

**Com ordens permanentes:**

- O agente executa autonomamente dentro de limites definidos
- Trabalho rotineiro acontece no cronograma sem instruções
- Você só se envolve para exceções e aprovações
- O agente preenche o tempo ocioso de forma produtiva

## Como elas funcionam

Ordens permanentes são definidas nos arquivos do seu [workspace do agente](/pt-BR/concepts/agent-workspace). A abordagem recomendada é incluí-las diretamente em `AGENTS.md` (que é injetado automaticamente em toda sessão), para que o agente sempre as tenha em contexto. Para configurações maiores, você também pode colocá-las em um arquivo dedicado, como `standing-orders.md`, e referenciá-lo a partir de `AGENTS.md`.

Cada programa especifica:

1. **Escopo** - o que o agente está autorizado a fazer
2. **Gatilhos** - quando executar (cronograma, evento ou condição)
3. **Portões de aprovação** - o que exige aprovação humana antes de agir
4. **Regras de escalonamento** - quando parar e pedir ajuda

O agente carrega essas instruções em toda sessão por meio dos arquivos de bootstrap do workspace (consulte [Workspace do Agente](/pt-BR/concepts/agent-workspace) para a lista completa de arquivos injetados automaticamente) e as executa, combinadas com [tarefas Cron](/pt-BR/automation/cron-jobs) para aplicação baseada em tempo.

<Tip>
Coloque ordens permanentes em `AGENTS.md` para garantir que elas sejam carregadas em toda sessão. O bootstrap do workspace injeta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` - mas não arquivos arbitrários em subdiretórios.
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

## Ordens permanentes mais tarefas Cron

Ordens permanentes definem **o que** o agente está autorizado a fazer. [Tarefas Cron](/pt-BR/automation/cron-jobs) definem **quando** isso acontece. Elas funcionam em conjunto:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

O prompt da tarefa Cron deve referenciar a ordem permanente em vez de duplicá-la:

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

Ordens permanentes funcionam melhor quando combinadas com disciplina rigorosa de execução. Toda tarefa em uma ordem permanente deve seguir este loop:

1. **Executar** - Faça o trabalho real (não apenas confirme a instrução)
2. **Verificar** - Confirme que o resultado está correto (arquivo existe, mensagem entregue, dados analisados)
3. **Relatar** - Informe ao proprietário o que foi feito e o que foi verificado

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Esse padrão evita o modo de falha mais comum de agentes: reconhecer uma tarefa sem concluí-la.

## Arquitetura de múltiplos programas

Para agentes que gerenciam várias áreas, organize ordens permanentes como programas separados com limites claros:

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

- Sua própria **cadência de gatilho** (semanal, mensal, orientada por eventos, contínua)
- Seus próprios **portões de aprovação** (alguns programas precisam de mais supervisão do que outros)
- **Limites** claros (o agente deve saber onde um programa termina e outro começa)

## Melhores práticas

### Faça

- Comece com autoridade restrita e expanda conforme a confiança aumenta
- Defina portões de aprovação explícitos para ações de alto risco
- Inclua seções "O que NÃO fazer" - limites importam tanto quanto permissões
- Combine com tarefas Cron para execução confiável baseada em tempo
- Revise os logs do agente semanalmente para verificar se as ordens permanentes estão sendo seguidas
- Atualize as ordens permanentes conforme suas necessidades evoluem - elas são documentos vivos

### Evite

- Conceder autoridade ampla no primeiro dia ("faça o que achar melhor")
- Ignorar regras de escalonamento - todo programa precisa de uma cláusula de "quando parar e perguntar"
- Supor que o agente lembrará instruções verbais - coloque tudo no arquivo
- Misturar áreas em um único programa - programas separados para domínios separados
- Esquecer de aplicar com tarefas Cron - ordens permanentes sem gatilhos viram sugestões

## Relacionado

- [Automação e tarefas](/pt-BR/automation): todos os mecanismos de automação em um relance.
- [Tarefas Cron](/pt-BR/automation/cron-jobs): aplicação de cronograma para ordens permanentes.
- [Hooks](/pt-BR/automation/hooks): scripts orientados por eventos para eventos de ciclo de vida do agente.
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks): gatilhos de eventos HTTP de entrada.
- [Workspace do agente](/pt-BR/concepts/agent-workspace): onde ficam as ordens permanentes, incluindo a lista completa de arquivos de bootstrap injetados automaticamente (`AGENTS.md`, `SOUL.md` etc.).
