---
read_when:
    - Executando verificações de confiabilidade do agente pessoal local
    - Estendendo o catálogo de cenários de QA mantido no repositório
    - Verificação de lembretes, respostas, memória, redação, continuidade segura do uso de ferramentas, status de tarefas, diagnósticos seguros para compartilhamento, alegações de conclusão respaldadas por evidências e recuperação de falhas
summary: Cenários locais do qa-channel para verificações de fluxos de trabalho de assistente pessoal com preservação de privacidade.
title: Pacote de benchmarks para agentes pessoais
x-i18n:
    generated_at: "2026-07-12T15:06:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

O Pacote de Benchmark de Agente Pessoal é um pequeno pacote de cenários de QA respaldado por repositório para
fluxos de trabalho locais de assistente pessoal. Ele não é um benchmark genérico de modelos e
não precisa de um novo executor: reutiliza a pilha privada de QA ([visão geral de QA](/pt-BR/concepts/qa-e2e-automation)),
o [canal de QA](/pt-BR/channels/qa-channel) sintético e o catálogo YAML existente em
`qa/scenarios`.

## Cenários

Dez cenários, definidos em `qa/scenarios/personal/*.yaml`:

| ID do cenário                              | Verificações                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Lembretes pessoais fictícios por meio de entrega Cron local                                               |
| `personal-channel-thread-reply`            | Roteamento de DM fictícia e resposta em thread por meio de `qa-channel`                                   |
| `personal-memory-preference-recall`        | Recuperação de preferência fictícia dos arquivos de memória do espaço de trabalho temporário de QA        |
| `personal-redaction-no-secret-leak`        | Verificações fictícias de não repetição de segredos                                                       |
| `personal-tool-safety-followthrough`       | Acompanhamento seguro de ferramenta respaldado por leitura após uma breve interação no estilo de aprovação |
| `personal-approval-denial-stop`            | Comportamento de interrupção após negação de aprovação para uma solicitação sensível de leitura local     |
| `personal-task-followthrough-status`       | Relatório do status da tarefa respaldado por evidências que mantém pendente, bloqueado e concluído separados |
| `personal-share-safe-diagnostics-artifact` | Artefatos de diagnóstico seguros para compartilhamento que mantêm o status útil enquanto omitem conteúdo pessoal bruto |
| `personal-no-fake-progress`                | Alegações de conclusão respaldadas por evidências que evitam progresso falso antes que existam evidências locais |
| `personal-failure-recovery`                | Recuperação de falhas que relata o status parcial e mantém claros os limites de nova tentativa             |

Os metadados legíveis por máquina do pacote (lista de IDs, título e descrição) ficam em
`extensions/qa-lab/src/scenario-packs.ts` como `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Execute o pacote com `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` é aditivo com flags `--scenario` repetidas. Os cenários explícitos são executados
primeiro; em seguida, os cenários do pacote são executados na ordem de `QA_PERSONAL_AGENT_SCENARIO_IDS`,
com as duplicatas removidas.

O pacote tem como destino o `qa-channel` com `mock-openai` ou outra faixa de provedor de QA
local. Não o direcione para serviços de chat ativos nem para contas pessoais reais.

## Modelo de privacidade

Os cenários usam somente usuários fictícios, preferências fictícias, segredos fictícios e o
espaço de trabalho temporário do Gateway de QA criado pela suíte. Eles não devem ler nem
gravar memória de usuários reais do OpenClaw, sessões, credenciais, agentes de inicialização, configurações
globais ou estado ativo do Gateway.

Os artefatos permanecem no diretório de artefatos existente da suíte de QA e são tratados
como saída de teste. As verificações de redação usam marcadores fictícios para que as falhas sejam seguras para
inspeção e registro em issues.

## Extensão do pacote

Adicione novos casos `.yaml` em `qa/scenarios/personal/` e, depois, adicione o ID do cenário
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantenha cada caso pequeno, local, determinístico
em `mock-openai` e concentrado em um comportamento de assistente pessoal.

Bons candidatos para acompanhamento: verificações de exportação de trajetória com redação, verificações de
fluxo de trabalho de Plugin somente local.

Evite adicionar um novo executor, Plugin, dependência, transporte ativo ou avaliador de modelo
até que o catálogo de cenários tenha casos estáveis suficientes para justificar essa superfície.
