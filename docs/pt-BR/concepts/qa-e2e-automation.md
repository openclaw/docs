---
read_when:
    - Expandindo o qa-lab ou o qa-channel
    - Adicionando cenários de QA com suporte do repositório
    - Criando automação de QA com maior realismo em torno do Dashboard do Gateway
summary: Estrutura da automação privada de QA para qa-lab, qa-channel, cenários semeados e relatórios de protocolo
title: Automação E2E de QA
x-i18n:
    generated_at: "2026-04-08T02:14:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4aa5acc8e77303f4045d4f04372494cae21b89d2fdaba856dbb4855ced9d27
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automação E2E de QA

A stack privada de QA foi projetada para exercitar o OpenClaw de uma forma mais
realista, no formato de canal, do que um único teste unitário consegue.

Partes atuais:

- `extensions/qa-channel`: canal de mensagens sintético com superfícies de DM, canal, thread,
  reação, edição e exclusão.
- `extensions/qa-lab`: UI de depuração e barramento de QA para observar a transcrição,
  injetar mensagens de entrada e exportar um relatório em Markdown.
- `qa/`: recursos semeados com suporte do repositório para a tarefa inicial e cenários
  básicos de QA.

O fluxo atual do operador de QA é um site de QA com dois painéis:

- Esquerda: Dashboard do Gateway (Control UI) com o agente.
- Direita: QA Lab, mostrando a transcrição no estilo do Slack e o plano de cenário.

Execute com:

```bash
pnpm qa:lab:up
```

Isso compila o site de QA, inicia a trilha de gateway com suporte do Docker e expõe a
página do QA Lab, onde um operador ou loop de automação pode dar ao agente uma
missão de QA, observar o comportamento real do canal e registrar o que funcionou, falhou ou
permaneceu bloqueado.

Para uma iteração mais rápida da UI do QA Lab sem recompilar a imagem Docker a cada vez,
inicie a stack com um bundle do QA Lab montado por bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantém os serviços Docker em uma imagem pré-compilada e faz bind mount de
`extensions/qa-lab/web/dist` no contêiner `qa-lab`. `qa:lab:watch`
recompila esse bundle quando há mudanças, e o navegador recarrega automaticamente quando o hash
do recurso do QA Lab muda.

## Sementes com suporte do repositório

Os recursos semeados ficam em `qa/`:

- `qa/scenarios.md`

Eles ficam intencionalmente no git para que o plano de QA seja visível tanto para humanos quanto para o
agente. A lista básica deve permanecer ampla o suficiente para cobrir:

- chat por DM e canal
- comportamento de thread
- ciclo de vida de ações de mensagem
- callbacks de cron
- recuperação de memória
- troca de modelo
- handoff para subagente
- leitura do repositório e da documentação
- uma pequena tarefa de build, como Lobster Invaders

## Relatórios

O `qa-lab` exporta um relatório de protocolo em Markdown a partir da linha do tempo observada do barramento.
O relatório deve responder:

- O que funcionou
- O que falhou
- O que permaneceu bloqueado
- Quais cenários de acompanhamento valem a pena adicionar

## Documentação relacionada

- [Testing](/pt-BR/help/testing)
- [QA Channel](/pt-BR/channels/qa-channel)
- [Dashboard](/web/dashboard)
