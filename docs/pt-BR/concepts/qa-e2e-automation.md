---
read_when:
    - Expandindo qa-lab ou qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA mais realista em torno do dashboard do Gateway
summary: Estrutura privada de automação de QA para qa-lab, qa-channel, cenários baseados em seed e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-06T03:06:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: df35f353d5ab0e0432e6a828c82772f9a88edb41c20ec5037315b7ba310b28e6
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A stack privada de QA foi projetada para exercitar o OpenClaw de uma forma mais
realista e no formato de canais do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies para DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos seed com suporte do repositório para a tarefa inicial e cenários
  básicos de QA.

O objetivo de longo prazo é um site de QA com dois painéis:

- Esquerda: dashboard do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano do cenário.

Isso permite que um operador ou loop de automação dê ao agente uma missão de QA, observe
o comportamento real do canal e registre o que funcionou, falhou ou permaneceu bloqueado.

## Seeds com suporte do repositório

Os recursos seed ficam em `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente. A lista básica deve permanecer ampla o suficiente para cobrir:

- chat em DM e em canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff de subagente
- leitura de repositório e leitura de documentação
- uma pequena tarefa de build, como Lobster Invaders

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada no barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento vale a pena adicionar

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/channels/qa-channel)
- [Dashboard](/web/dashboard)
