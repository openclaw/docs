---
read_when:
    - Estender qa-lab ou qa-channel
    - Adicionar cenários de QA com suporte do repositório
    - Criar uma automação de QA mais realista em torno do dashboard do Gateway
summary: Formato da automação privada de QA para qa-lab, qa-channel, cenários com seeds e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-07T05:26:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 113e89d8d3ee8ef3058d95b9aea9a1c2335b07794446be2d231c0faeb044b23b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A pilha privada de QA foi pensada para exercitar o OpenClaw de uma forma mais realista,
com formato de canal, do que um único teste unitário consegue.

Peças atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens recebidas e exportar um relatório em Markdown.
- `qa/`: recursos seed com suporte do repositório para a tarefa inicial e cenários
  básicos de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: dashboard do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição em estilo Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso cria o site de QA, inicia a faixa do gateway com suporte do Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou,
falhou ou permaneceu bloqueado.

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
- handoff para subagente
- leitura de repositório e leitura de documentação
- uma pequena tarefa de build, como Lobster Invaders

## Relatórios

`qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

## Documentação relacionada

- [Testes](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
