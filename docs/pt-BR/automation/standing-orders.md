---
read_when:
    - Configuração de fluxos de trabalho de agentes autônomos que são executados sem prompts para cada tarefa
    - Definir o que o agente pode fazer de forma independente e o que precisa de aprovação humana
    - Estruturação de agentes multiprograma com limites claros e regras de escalonamento
summary: Defina a autoridade operacional permanente para programas de agentes autônomos
title: Ordens permanentes
x-i18n:
    generated_at: "2026-07-12T14:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e7ad622efe734facc9dc3716f5ee7f57ed3923499db78730bda234a5c62ad80
    source_path: automation/standing-orders.md
    workflow: 16
---

Ordens permanentes concedem ao seu agente **autoridade operacional permanente** para programas definidos. Em vez de instruir o agente para cada tarefa, você define programas com escopo, gatilhos e regras de escalonamento claros, e o agente executa de forma autônoma dentro desses limites: "Você é responsável pelo relatório semanal. Compile-o toda sexta-feira, envie-o e só escalone se algo parecer errado."

## Por que usar ordens permanentes

**Sem ordens permanentes:** você instrui o agente para cada tarefa, o trabalho rotineiro é esquecido ou atrasado, e você se torna o gargalo.

**Com ordens permanentes:** o agente executa de forma autônoma dentro dos limites definidos, o trabalho rotineiro acontece conforme o cronograma, e você só participa em casos de exceções e aprovações.

## Como funcionam

As ordens permanentes são definidas nos arquivos do seu [workspace do agente](/pt-BR/concepts/agent-workspace). A abordagem recomendada é incluí-las diretamente no `AGENTS.md` (que é injetado automaticamente em cada sessão), para que o agente sempre as tenha no contexto. Para configurações maiores, você também pode colocá-las em um arquivo dedicado, como `standing-orders.md`, e referenciá-lo no `AGENTS.md`.

Cada programa especifica:

1. **Escopo** - o que o agente está autorizado a fazer
2. **Gatilhos** - quando executar (cronograma, evento ou condição)
3. **Pontos de aprovação** - o que exige autorização humana antes da ação
4. **Regras de escalonamento** - quando parar e pedir ajuda

O agente carrega essas instruções em cada sessão por meio dos arquivos de inicialização do workspace (consulte [Workspace do agente](/pt-BR/concepts/agent-workspace) para ver a lista completa de arquivos injetados automaticamente) e as executa em conjunto com [tarefas Cron](/pt-BR/automation/cron-jobs) para aplicação baseada em tempo.

<Tip>
Coloque as ordens permanentes no `AGENTS.md` para garantir que sejam carregadas em cada sessão. A inicialização do workspace injeta automaticamente `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` e `MEMORY.md` - mas não arquivos arbitrários em subdiretórios.
</Tip>

## Anatomia de uma ordem permanente

```markdown
## Programa: Relatório semanal de status

**Autoridade:** Compilar dados, gerar relatório, entregá-lo às partes interessadas
**Gatilho:** Toda sexta-feira às 16h (aplicado por meio de uma tarefa Cron)
**Ponto de aprovação:** Nenhum para relatórios padrão. Sinalizar anomalias para análise humana.
**Escalonamento:** Se a fonte de dados estiver indisponível ou as métricas parecerem incomuns (>2σ da norma)

### Etapas de execução

1. Obter métricas das fontes configuradas
2. Comparar com a semana anterior e as metas
3. Gerar relatório em Reports/weekly/YYYY-MM-DD.md
4. Entregar resumo pelo canal configurado
5. Registrar a conclusão em Agent/Logs/

### O que NÃO fazer

- Não enviar relatórios a partes externas
- Não modificar os dados de origem
- Não deixar de entregar se as métricas parecerem ruins - relatar com precisão
```

## Ordens permanentes mais tarefas Cron

As ordens permanentes definem **o que** o agente está autorizado a fazer. As [tarefas Cron](/pt-BR/automation/cron-jobs) definem **quando** isso acontece. Elas funcionam em conjunto:

```text
Ordem permanente: "Você é responsável pela triagem diária da caixa de entrada"
    ↓
Tarefa Cron (diariamente às 8h): "Execute a triagem da caixa de entrada conforme as ordens permanentes"
    ↓
Agente: Lê as ordens permanentes → executa as etapas → relata os resultados
```

O prompt da tarefa Cron deve fazer referência à ordem permanente em vez de duplicá-la:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute a triagem diária da caixa de entrada conforme as ordens permanentes. Verifique se há novos alertas no e-mail. Analise, categorize e persista cada item. Envie um resumo ao proprietário. Escalone itens desconhecidos."
```

## Exemplos

### Exemplo 1: conteúdo e redes sociais (ciclo semanal)

```markdown
## Programa: Conteúdo e redes sociais

**Autoridade:** Elaborar conteúdo, agendar publicações, compilar relatórios de engajamento
**Ponto de aprovação:** Todas as publicações exigem análise do proprietário nos primeiros 30 dias e, depois, aprovação permanente
**Gatilho:** Ciclo semanal (análise na segunda-feira → rascunhos no meio da semana → resumo na sexta-feira)

### Ciclo semanal

- **Segunda-feira:** Analisar métricas das plataformas e o engajamento do público
- **Terça a quinta-feira:** Elaborar publicações para redes sociais e criar conteúdo para o blog
- **Sexta-feira:** Compilar o resumo semanal de marketing → entregar ao proprietário

### Regras de conteúdo

- A voz deve corresponder à marca (consulte SOUL.md ou o guia de voz da marca)
- Nunca se identificar como IA em conteúdo voltado ao público
- Incluir métricas quando disponíveis
- Concentrar-se no valor para o público, não em autopromoção
```

### Exemplo 2: operações financeiras (acionadas por evento)

```markdown
## Programa: Processamento financeiro

**Autoridade:** Processar dados de transações, gerar relatórios, enviar resumos
**Ponto de aprovação:** Nenhum para análise. Recomendações exigem aprovação do proprietário.
**Gatilho:** Novo arquivo de dados detectado OU ciclo mensal agendado

### Quando novos dados chegarem

1. Detectar novo arquivo no diretório de entrada designado
2. Analisar e categorizar todas as transações
3. Comparar com as metas orçamentárias
4. Sinalizar: itens incomuns, violações de limites, novas cobranças recorrentes
5. Gerar relatório no diretório de saída designado
6. Entregar o resumo ao proprietário pelo canal configurado

### Regras de escalonamento

- Item individual > $500: alerta imediato
- Categoria > orçamento em 20%: sinalizar no relatório
- Transação não reconhecida: pedir ao proprietário que a categorize
- Falha no processamento após 2 tentativas: relatar a falha, não presumir
```

### Exemplo 3: monitoramento e alertas (contínuo)

```markdown
## Programa: Monitoramento do sistema

**Autoridade:** Verificar a integridade do sistema, reiniciar serviços, enviar alertas
**Ponto de aprovação:** Reiniciar serviços automaticamente. Escalonar se a reinicialização falhar duas vezes.
**Gatilho:** A cada ciclo de Heartbeat

### Verificações

- Endpoints de integridade dos serviços respondendo
- Espaço em disco acima do limite
- Tarefas pendentes não estão obsoletas (>24 horas)
- Canais de entrega operacionais

### Matriz de resposta

| Condição             | Ação                              | Escalonar?                          |
| -------------------- | --------------------------------- | ----------------------------------- |
| Serviço indisponível | Reiniciar automaticamente         | Somente se a reinicialização falhar 2x |
| Espaço em disco < 10% | Alertar o proprietário           | Sim                                 |
| Tarefa obsoleta > 24h | Lembrar o proprietário           | Não                                 |
| Canal offline        | Registrar e tentar no próximo ciclo | Se ficar offline > 2 horas         |
```

## Padrão executar-verificar-relatar

As ordens permanentes funcionam melhor quando combinadas com uma disciplina rigorosa de execução. Cada tarefa de uma ordem permanente deve seguir este ciclo:

1. **Executar** - Fazer o trabalho de fato (não apenas confirmar a instrução)
2. **Verificar** - Confirmar que o resultado está correto (o arquivo existe, a mensagem foi entregue, os dados foram analisados)
3. **Relatar** - Informar ao proprietário o que foi feito e o que foi verificado

```markdown
### Regras de execução

- Cada tarefa segue Executar-Verificar-Relatar. Sem exceções.
- "Vou fazer isso" não é execução. Faça e depois relate.
- "Concluído" sem verificação não é aceitável. Comprove.
- Se a execução falhar: tentar novamente uma vez com uma abordagem ajustada.
- Se ainda falhar: relatar a falha com o diagnóstico. Nunca falhar silenciosamente.
- Nunca tentar novamente indefinidamente - no máximo 3 tentativas; depois, escalonar.
```

Esse padrão evita o modo de falha mais comum dos agentes: confirmar uma tarefa sem concluí-la.

## Arquitetura de múltiplos programas

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
- [Pontos de aprovação aplicáveis a todos os programas]
```

Cada programa deve ter:

- Sua própria **cadência de gatilho** (semanal, mensal, acionada por evento, contínua)
- Seus próprios **pontos de aprovação** (alguns programas precisam de mais supervisão do que outros)
- **Limites** claros (o agente deve saber onde um programa termina e outro começa)

## Práticas recomendadas

### Faça

- Comece com autoridade limitada e amplie-a conforme a confiança aumenta
- Defina pontos de aprovação explícitos para ações de alto risco
- Inclua seções "O que NÃO fazer" - os limites são tão importantes quanto as permissões
- Combine com tarefas Cron para uma execução confiável baseada em tempo
- Analise semanalmente os registros do agente para verificar se as ordens permanentes estão sendo seguidas
- Atualize as ordens permanentes conforme suas necessidades evoluírem - elas são documentos vivos

### Evite

- Conceder autoridade ampla desde o primeiro dia ("faça o que considerar melhor")
- Omitir regras de escalonamento - cada programa precisa de uma cláusula sobre "quando parar e perguntar"
- Presumir que o agente se lembrará de instruções verbais - coloque tudo no arquivo
- Misturar áreas em um único programa - use programas separados para domínios distintos
- Esquecer de aplicar as ordens com tarefas Cron - ordens permanentes sem gatilhos tornam-se sugestões

## Relacionados

- [Automação](/pt-BR/automation): visão geral de todos os mecanismos de automação.
- [Tarefas Cron](/pt-BR/automation/cron-jobs): aplicação de cronogramas para ordens permanentes.
- [Hooks](/pt-BR/automation/hooks): scripts acionados por eventos do ciclo de vida do agente.
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks): gatilhos de eventos HTTP de entrada.
- [Workspace do agente](/pt-BR/concepts/agent-workspace): onde ficam as ordens permanentes, incluindo a lista completa de arquivos de inicialização injetados automaticamente (`AGENTS.md`, `SOUL.md` etc.).
