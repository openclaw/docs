---
read_when:
    - Você está conectando o transporte de QA sintético a uma execução de teste local ou de CI
    - Você precisa da superfície de configuração do qa-channel empacotado
    - Você está iterando na automação de QA de ponta a ponta
summary: Plugin de canal da classe Slack sintético para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-04-24T05:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` é um transporte de mensagens sintético empacotado para QA automatizado do OpenClaw.

Não é um canal de produção. Ele existe para exercitar o mesmo limite de Plugin de canal
usado por transportes reais, mantendo o estado determinístico e totalmente
inspecionável.

## O que ele faz hoje

- Gramática de destino da classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Barramento sintético com suporte a HTTP para:
  - injeção de mensagens de entrada
  - captura de transcrição de saída
  - criação de thread
  - reações
  - edições
  - exclusões
  - ações de busca e leitura
- Executor de autoverificação empacotado no lado do host que grava um relatório em Markdown

## Configuração

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Chaves de conta compatíveis:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Executor

Recorte vertical atual:

```bash
pnpm qa:e2e
```

Agora isso é roteado pelo Plugin `qa-lab` empacotado. Ele inicia o
barramento de QA no repositório, inicializa o recorte de runtime `qa-channel`
empacotado, executa uma autoverificação determinística e grava um relatório em Markdown
em `.artifacts/qa-e2e/`.

Interface privada de depuração:

```bash
pnpm qa:lab:up
```

Esse único comando compila o site de QA, inicia a pilha do Gateway com suporte a Docker + QA Lab
e imprime a URL do QA Lab. Nesse site, você pode escolher cenários, selecionar
a lane de modelo, iniciar execuções individuais e acompanhar os resultados ao vivo.

Suíte completa de QA com suporte ao repositório:

```bash
pnpm openclaw qa suite
```

Isso inicia o depurador privado de QA em uma URL local, separado do
bundle da Control UI distribuída.

## Escopo

O escopo atual é intencionalmente limitado:

- barramento + transporte de Plugin
- gramática de roteamento com threads
- ações de mensagem pertencentes ao canal
- relatórios em Markdown
- site de QA com suporte a Docker e controles de execução

Trabalhos futuros adicionarão:

- execução de matriz de provedor/modelo
- descoberta de cenários mais rica
- orquestração nativa do OpenClaw posteriormente

## Relacionado

- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral dos canais](/pt-BR/channels)
