---
read_when:
    - Configurando fluxos de trabalho de agentes autônomos que são executados sem prompts por tarefa
    - Definindo o que o agente pode fazer de forma independente versus o que precisa de aprovação humana
    - Estruturando agentes com vários programas com limites claros e regras de escalonamento
summary: Definir autoridade operacional permanente para programas de agentes autônomos
title: Ordens permanentes
x-i18n:
    generated_at: "2026-04-25T13:40:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

As ordens permanentes concedem ao seu agente **autoridade operacional permanente** para programas definidos. Em vez de fornecer instruções de tarefas individuais a cada vez, você define programas com escopo, gatilhos e regras de escalonamento claros — e o agente executa de forma autônoma dentro desses limites.

Essa é a diferença entre dizer ao seu assistente "envie o relatório semanal" toda sexta-feira e conceder autoridade permanente: "Você é responsável pelo relatório semanal. Compile-o toda sexta-feira, envie-o e só escale se algo parecer errado."

## Por que ordens permanentes?

**Sem ordens permanentes:**

- Você precisa dar prompts ao agente para cada tarefa
- O agente fica ocioso entre solicitações
- O trabalho rotineiro é esquecido ou atrasado
- Você se torna o gargalo

**Com ordens permanentes:**

- O agente executa de forma autônoma dentro de limites definidos
- O trabalho rotineiro acontece no cronograma, sem necessidade de prompt
- Você só se envolve em exceções e aprovações
- O agente preenche o tempo ocioso de forma produtiva

## Como funcionam

As ordens permanentes são definidas nos arquivos do seu [workspace do agente](/pt-BR/concepts/agent-workspace). A abordagem recomendada é incluí-las diretamente em `AGENTS.md` (que é injetado automaticamente em toda sessão) para que o agente sempre as tenha no contexto. Para configurações maiores, você também pode colocá-las em um arquivo dedicado, como `standing-orders.md`, e referenciá-lo a partir de `AGENTS.md`.

Cada programa especifica:

1. **Escopo** — o que o agente está autorizado a fazer
2. **Gatilhos** — quando executar (cronograma, evento ou condição)
3. **Portões de aprovação** — o que exige aprovação humana antes de agir
4. **Regras de escalonamento** — quando parar e pedir ajuda

O agente carrega essas instruções em toda sessão por meio dos arquivos de bootstrap do workspace (consulte [Workspace do agente](/pt-BR/concepts/agent-workspace) para a lista completa de arquivos injetados automaticamente) e executa com base nelas, em conjunto com [jobs Cron](/pt-BR/automation/cron-jobs) para aplicação baseada em tempo.

<Tip>
Coloque as ordens permanentes em `AGENTS.md` para garantir que sejam carregadas em toda sessão. O bootstrap do workspace injeta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` — mas não arquivos arbitrários em subdiretórios.
</Tip>

## Anatomia de uma ordem permanente

```markdown
## Programa: Relatório semanal de status

**Autoridade:** Compilar dados, gerar relatório, entregar às partes interessadas
**Gatilho:** Toda sexta-feira às 16h (aplicado via job Cron)
**Portão de aprovação:** Nenhum para relatórios padrão. Sinalize anomalias para revisão humana.
**Escalonamento:** Se a fonte de dados estiver indisponível ou as métricas parecerem incomuns (>2σ da norma)

### Etapas de execução

1. Coletar métricas das fontes configuradas
2. Comparar com a semana anterior e com as metas
3. Gerar relatório em Reports/weekly/YYYY-MM-DD.md
4. Entregar resumo pelo canal configurado
5. Registrar a conclusão em Agent/Logs/

### O que NÃO fazer

- Não envie relatórios para partes externas
- Não modifique os dados de origem
- Não pule a entrega se as métricas parecerem ruins — relate com precisão
```

## Ordens permanentes + jobs Cron

As ordens permanentes definem **o que** o agente está autorizado a fazer. Os [jobs Cron](/pt-BR/automation/cron-jobs) definem **quando** isso acontece. Eles funcionam juntos:

```
Ordem permanente: "Você é responsável pela triagem diária da caixa de entrada"
    ↓
Job Cron (8h diariamente): "Execute a triagem da caixa de entrada conforme as ordens permanentes"
    ↓
Agente: Lê as ordens permanentes → executa as etapas → relata os resultados
```

O prompt do job Cron deve referenciar a ordem permanente em vez de duplicá-la:

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
## Programa: Conteúdo e redes sociais

**Autoridade:** Redigir conteúdo, agendar publicações, compilar relatórios de engajamento
**Portão de aprovação:** Todas as publicações exigem revisão do proprietário nos primeiros 30 dias, depois aprovação permanente
**Gatilho:** Ciclo semanal (revisão na segunda-feira → rascunhos no meio da semana → resumo na sexta-feira)

### Ciclo semanal

- **Segunda-feira:** Revisar métricas da plataforma e engajamento do público
- **Terça a quinta-feira:** Redigir posts para redes sociais, criar conteúdo para blog
- **Sexta-feira:** Compilar resumo semanal de marketing → entregar ao proprietário

### Regras de conteúdo

- A voz deve corresponder à marca (consulte `SOUL.md` ou o guia de voz da marca)
- Nunca se identifique como IA em conteúdo voltado ao público
- Inclua métricas quando disponíveis
- Foque no valor para o público, não em autopromoção
```

### Exemplo 2: Operações financeiras (acionado por evento)

```markdown
## Programa: Processamento financeiro

**Autoridade:** Processar dados de transações, gerar relatórios, enviar resumos
**Portão de aprovação:** Nenhum para análise. Recomendações exigem aprovação do proprietário.
**Gatilho:** Novo arquivo de dados detectado OU ciclo mensal agendado

### Quando novos dados chegarem

1. Detectar novo arquivo no diretório de entrada designado
2. Analisar e categorizar todas as transações
3. Comparar com as metas de orçamento
4. Sinalizar: itens incomuns, estouros de limite, novas cobranças recorrentes
5. Gerar relatório no diretório de saída designado
6. Entregar resumo ao proprietário pelo canal configurado

### Regras de escalonamento

- Item único > $500: alerta imediato
- Categoria > orçamento em 20%: sinalizar no relatório
- Transação irreconhecível: pedir categorização ao proprietário
- Processamento com falha após 2 tentativas: relatar falha, não adivinhar
```

### Exemplo 3: Monitoramento e alertas (contínuo)

```markdown
## Programa: Monitoramento do sistema

**Autoridade:** Verificar a integridade do sistema, reiniciar serviços, enviar alertas
**Portão de aprovação:** Reinicie serviços automaticamente. Escale se a reinicialização falhar duas vezes.
**Gatilho:** Todo ciclo de Heartbeat

### Verificações

- Endpoints de integridade do serviço respondendo
- Espaço em disco acima do limite
- Tarefas pendentes não obsoletas (>24 horas)
- Canais de entrega operacionais

### Matriz de resposta

| Condição         | Ação                     | Escalar?                 |
| ---------------- | ------------------------ | ------------------------ |
| Serviço fora do ar | Reiniciar automaticamente | Somente se falhar 2x     |
| Espaço em disco < 10% | Alertar o proprietário   | Sim                      |
| Tarefa obsoleta > 24h | Lembrar o proprietário   | Não                      |
| Canal offline    | Registrar e tentar novamente no próximo ciclo | Se offline > 2 horas |
```

## O padrão Executar-Verificar-Relatar

As ordens permanentes funcionam melhor quando combinadas com disciplina rigorosa de execução. Toda tarefa em uma ordem permanente deve seguir este ciclo:

1. **Executar** — Faça o trabalho real (não apenas reconheça a instrução)
2. **Verificar** — Confirme que o resultado está correto (arquivo existe, mensagem entregue, dados analisados)
3. **Relatar** — Informe ao proprietário o que foi feito e o que foi verificado

```markdown
### Regras de execução

- Toda tarefa segue Executar-Verificar-Relatar. Sem exceções.
- "Eu vou fazer isso" não é execução. Faça e depois relate.
- "Concluído" sem verificação não é aceitável. Comprove.
- Se a execução falhar: tente novamente uma vez com uma abordagem ajustada.
- Se ainda falhar: relate a falha com diagnóstico. Nunca falhe em silêncio.
- Nunca tente indefinidamente — máximo de 3 tentativas, depois escale.
```

Esse padrão evita o modo de falha mais comum dos agentes: reconhecer uma tarefa sem concluí-la.

## Arquitetura com vários programas

Para agentes que gerenciam várias áreas, organize as ordens permanentes como programas separados com limites claros:

```markdown
## Programa 1: [Domínio A] (Semanal)

...

## Programa 2: [Domínio B] (Mensal + Sob demanda)

...

## Programa 3: [Domínio C] (Conforme necessário)

...

## Regras de escalonamento (Todos os programas)

- [Critérios comuns de escalonamento]
- [Portões de aprovação que se aplicam a todos os programas]
```

Cada programa deve ter:

- Seu próprio **ritmo de gatilho** (semanal, mensal, orientado por evento, contínuo)
- Seus próprios **portões de aprovação** (alguns programas precisam de mais supervisão do que outros)
- **Limites** claros (o agente deve saber onde um programa termina e outro começa)

## Boas práticas

### Faça

- Comece com autoridade limitada e amplie à medida que a confiança cresce
- Defina portões de aprovação explícitos para ações de alto risco
- Inclua seções de "O que NÃO fazer" — limites importam tanto quanto permissões
- Combine com jobs Cron para execução confiável baseada em tempo
- Revise os logs do agente semanalmente para verificar se as ordens permanentes estão sendo seguidas
- Atualize as ordens permanentes conforme suas necessidades evoluem — são documentos vivos

### Evite

- Conceder ampla autoridade no primeiro dia ("faça o que achar melhor")
- Pular regras de escalonamento — todo programa precisa de uma cláusula de "quando parar e perguntar"
- Presumir que o agente lembrará instruções verbais — coloque tudo no arquivo
- Misturar assuntos em um único programa — programas separados para domínios separados
- Esquecer de aplicar com jobs Cron — ordens permanentes sem gatilhos viram sugestões

## Relacionado

- [Automação e tarefas](/pt-BR/automation) — todos os mecanismos de automação em um só lugar
- [Jobs Cron](/pt-BR/automation/cron-jobs) — aplicação de agendamento para ordens permanentes
- [Hooks](/pt-BR/automation/hooks) — scripts orientados por evento para eventos do ciclo de vida do agente
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks) — gatilhos de eventos HTTP de entrada
- [Workspace do agente](/pt-BR/concepts/agent-workspace) — onde as ordens permanentes ficam, incluindo a lista completa de arquivos de bootstrap injetados automaticamente (`AGENTS.md`, `SOUL.md` etc.)
