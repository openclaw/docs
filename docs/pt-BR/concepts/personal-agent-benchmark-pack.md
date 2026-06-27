---
read_when:
    - Executando verificações de confiabilidade do agente pessoal local
    - Estendendo o catálogo de cenários de QA respaldado pelo repositório
    - Verificando lembrete, resposta, memória, ocultação, acompanhamento seguro de ferramentas, status da tarefa, diagnósticos seguros para compartilhamento, declarações de conclusão respaldadas por provas e recuperação de falhas
summary: Cenários locais de qa-channel para verificações de fluxos de trabalho de assistente pessoal com preservação de privacidade.
title: Pacote de benchmarks de agente pessoal
x-i18n:
    generated_at: "2026-06-27T17:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

O Pacote de benchmark de agente pessoal é um pequeno pacote de cenários de QA mantido em repositório para fluxos de trabalho de assistente pessoal local. Ele não é um benchmark genérico de modelos e não exige um novo executor. O pacote reutiliza a pilha privada de QA descrita na
[visão geral de QA](/pt-BR/concepts/qa-e2e-automation), o
[canal de QA](/pt-BR/channels/qa-channel) sintético e o catálogo YAML `qa/scenarios` existente.

O primeiro pacote é intencionalmente restrito:

- lembretes pessoais falsos por entrega via cron local
- roteamento falso de DMs e respostas em threads por meio de `qa-channel`
- recordação falsa de preferências a partir dos arquivos temporários de memória do espaço de trabalho de QA
- verificações falsas de segredo sem eco
- continuidade de ferramenta baseada em leitura segura após uma interação curta em estilo de aprovação
- comportamento de parada por negação de aprovação para uma solicitação sensível de leitura local
- relatório de status de tarefa respaldado por prova que mantém pendente, bloqueado e concluído separados
- artefatos de diagnóstico seguros para compartilhamento que mantêm status útil sem incluir conteúdo pessoal bruto
- alegações de conclusão respaldadas por prova que evitam progresso falso antes que evidências locais existam
- recuperação de falhas que relata status parcial e mantém claros os limites de nova tentativa

## Cenários

Os metadados legíveis por máquina do pacote ficam em
`extensions/qa-lab/src/scenario-packs.ts`. Execute o pacote com
`--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` é aditivo com flags `--scenario` repetidas. Cenários explícitos são executados
primeiro; em seguida, os cenários do pacote são executados na ordem de `QA_PERSONAL_AGENT_SCENARIO_IDS`, com
duplicatas removidas.

O pacote foi projetado para `qa-channel` com `mock-openai` ou outra faixa local de provedor de QA. Ele não deve ser apontado para serviços de chat ao vivo nem para contas pessoais reais.

## Modelo de privacidade

Os cenários usam apenas usuários falsos, preferências falsas, segredos falsos e o
espaço de trabalho temporário do Gateway de QA criado pela suíte. Eles não devem ler nem gravar
memória, sessões, credenciais, agentes de inicialização, configurações globais
ou estado de Gateway ativo de usuários reais do OpenClaw.

Os artefatos permanecem no diretório de artefatos existente da suíte de QA e devem ser
tratados como saída de teste. As verificações de redação usam marcadores falsos, para que falhas sejam seguras
de inspecionar e registrar em issues.

## Como estender o pacote

Adicione novos casos `.yaml` em `qa/scenarios/personal/` e, depois, adicione o ID do cenário
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantenha cada caso pequeno, local, determinístico
em `mock-openai` e focado em um comportamento de assistente pessoal.

Bons candidatos de acompanhamento:

- verificações de exportação de trajetória redigida
- verificações de fluxo de trabalho de Plugin somente local

Evite adicionar um novo executor, Plugin, dependência, transporte ao vivo ou avaliador de modelo
até que o catálogo de cenários tenha casos estáveis suficientes para justificar essa superfície.
