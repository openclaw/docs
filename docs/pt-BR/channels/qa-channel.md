---
read_when:
    - Você está conectando o transporte sintético de QA a uma execução de teste local ou em CI
    - Você precisa da superfície de configuração do `qa-channel` empacotado
    - Você está iterando na automação de QA de ponta a ponta
summary: Plugin de canal sintético da classe Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-04-07T05:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# Canal de QA

`qa-channel` é um transporte de mensagens sintético empacotado para QA automatizado do OpenClaw.

Não é um canal de produção. Ele existe para exercitar o mesmo limite de plugin
de canal usado por transportes reais, mantendo o estado determinístico e
totalmente inspecionável.

## O que ele faz hoje

- Gramática de destino da classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Barramento sintético com HTTP para:
  - injeção de mensagens de entrada
  - captura de transcrição de saída
  - criação de threads
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

Fatia vertical atual:

```bash
pnpm qa:e2e
```

Agora isso é roteado por meio da extensão empacotada `qa-lab`. Ela inicia o
barramento de QA no repositório, inicializa a fatia de runtime empacotada de
`qa-channel`, executa uma autoverificação determinística e grava um relatório em
Markdown em `.artifacts/qa-e2e/`.

UI privada de depuração:

```bash
pnpm qa:lab:up
```

Esse único comando compila o site de QA, inicia a pilha do gateway + QA Lab com
Docker e imprime a URL do QA Lab. Nesse site, você pode escolher cenários,
selecionar a trilha de modelo, iniciar execuções individuais e acompanhar os
resultados ao vivo.

Suíte completa de QA com respaldo no repositório:

```bash
pnpm openclaw qa suite
```

Isso inicia o depurador privado de QA em uma URL local, separado do bundle
entregue da Control UI.

## Escopo

O escopo atual é intencionalmente limitado:

- barramento + transporte do plugin
- gramática de roteamento com threads
- ações de mensagens de posse do canal
- relatórios em Markdown
- site de QA com respaldo em Docker e controles de execução

Trabalhos futuros adicionarão:

- execução de matriz de provedor/modelo
- descoberta de cenários mais rica
- orquestração nativa do OpenClaw posteriormente
