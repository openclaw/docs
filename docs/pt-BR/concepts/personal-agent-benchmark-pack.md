---
read_when:
    - Executando verificações locais de confiabilidade do agente pessoal
    - Ampliação do catálogo de cenários de QA mantido no repositório
    - Verificação de lembretes, respostas, memória, redação, continuidade segura do uso de ferramentas, status de tarefas, diagnósticos seguros para compartilhamento, alegações de conclusão baseadas em evidências e recuperação de falhas
summary: Cenários locais do qa-channel para verificações de fluxos de trabalho de assistente pessoal com preservação da privacidade.
title: Pacote de benchmarks para agentes pessoais
x-i18n:
    generated_at: "2026-07-11T23:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

O Pacote de Benchmark de Agente Pessoal é um pequeno pacote de cenários de QA baseado em repositório para
fluxos de trabalho locais de assistente pessoal. Ele não é um benchmark genérico de modelos e
não precisa de um novo executor: reutiliza a pilha privada de QA ([visão geral de QA](/pt-BR/concepts/qa-e2e-automation)),
o [canal de QA](/pt-BR/channels/qa-channel) sintético e o catálogo YAML
`qa/scenarios` existente.

## Cenários

Dez cenários, definidos em `qa/scenarios/personal/*.yaml`:

| ID do cenário                             | Verificações                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`             | Lembretes pessoais fictícios por meio de entrega via cron local                                                   |
| `personal-channel-thread-reply`           | Roteamento de DM fictícia e resposta em thread por meio de `qa-channel`                                           |
| `personal-memory-preference-recall`       | Recuperação de preferências fictícias dos arquivos temporários de memória do espaço de trabalho de QA             |
| `personal-redaction-no-secret-leak`       | Verificações fictícias para impedir a repetição de segredos                                                       |
| `personal-tool-safety-followthrough`      | Continuidade segura de uso da ferramenta com base em leitura após uma breve interação semelhante a uma aprovação |
| `personal-approval-denial-stop`           | Comportamento de interrupção após a negação de aprovação para uma solicitação confidencial de leitura local       |
| `personal-task-followthrough-status`      | Relatório do status da tarefa baseado em evidências que mantém pendente, bloqueado e concluído separados          |
| `personal-share-safe-diagnostics-artifact` | Artefatos de diagnóstico seguros para compartilhamento que mantêm o status útil e omitem conteúdo pessoal bruto  |
| `personal-no-fake-progress`               | Alegações de conclusão baseadas em evidências que evitam progresso falso antes da existência de evidências locais |
| `personal-failure-recovery`               | Recuperação de falhas que relata o status parcial e mantém claros os limites de novas tentativas                  |

Os metadados do pacote legíveis por máquina (lista de IDs, título e descrição) ficam em
`extensions/qa-lab/src/scenario-packs.ts` como `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Execute o pacote com `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` é aditivo com flags `--scenario` repetidas. Os cenários explícitos são executados
primeiro; depois, os cenários do pacote são executados na ordem de `QA_PERSONAL_AGENT_SCENARIO_IDS`,
com as duplicatas removidas.

O pacote tem como alvo o `qa-channel` com `mock-openai` ou outra modalidade de provedor
de QA local. Não o direcione a serviços de chat ativos nem a contas pessoais reais.

## Modelo de privacidade

Os cenários usam apenas usuários fictícios, preferências fictícias, segredos fictícios e o
espaço de trabalho temporário do Gateway de QA criado pela suíte. Eles não devem ler nem
gravar memória de usuários reais do OpenClaw, sessões, credenciais, agentes de inicialização, configurações
globais ou o estado ativo do Gateway.

Os artefatos permanecem no diretório de artefatos existente da suíte de QA e são tratados
como saída de teste. As verificações de ocultação usam marcadores fictícios para que as falhas sejam seguras
para inspecionar e registrar em issues.

## Como estender o pacote

Adicione novos casos `.yaml` em `qa/scenarios/personal/` e depois adicione o ID do cenário
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantenha cada caso pequeno, local, determinístico
em `mock-openai` e concentrado em um comportamento de assistente pessoal.

Bons candidatos para acompanhamento: verificações de exportação de trajetórias com dados ocultados e verificações de fluxos de trabalho
de Plugin exclusivamente locais.

Evite adicionar um novo executor, Plugin, dependência, transporte ativo ou avaliador de modelo
até que o catálogo de cenários tenha casos estáveis suficientes para justificar essa superfície.
