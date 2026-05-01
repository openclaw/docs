---
read_when:
    - Você está integrando o transporte sintético de QA a uma execução de teste local ou de CI
    - Você precisa da superfície de configuração do qa-channel incluída
    - Você está iterando na automação de garantia de qualidade de ponta a ponta
summary: Plugin de canal sintético da classe Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-05-01T05:55:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` é um transporte sintético de mensagens incluído para QA automatizado do OpenClaw. Ele não é um canal de produção — existe para exercitar o mesmo limite de Plugin de canal usado por transportes reais, mantendo o estado determinístico e totalmente inspecionável.

## O que ele faz

- Gramática de destino de classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Conversas compartilhadas de `channel:` e `group:` são apresentadas aos agentes como turnos de sala de grupo/canal, para que exercitem a mesma política de resposta visível e roteamento de ferramentas de mensagem usada por Discord, Slack, Telegram e transportes semelhantes.
- Barramento sintético baseado em HTTP para injeção de mensagens de entrada, captura de transcrições de saída, criação de threads, reações, edições, exclusões e ações de busca/leitura.
- Executor de autoverificação no host que grava um relatório em Markdown em `.artifacts/qa-e2e/`.

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

Chaves da conta:

- `enabled` — alternância principal para esta conta.
- `name` — rótulo de exibição opcional.
- `baseUrl` — URL do barramento sintético.
- `botUserId` — id de usuário do bot em estilo Matrix usado na gramática de destino.
- `botDisplayName` — nome de exibição para mensagens de saída.
- `pollTimeoutMs` — janela de espera de long-poll. Inteiro entre 100 e 30000.
- `allowFrom` — lista de remetentes permitidos (ids de usuário ou `"*"`).
- `defaultTo` — destino de fallback quando nenhum é fornecido.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — controle de ferramentas por ação.

Chaves de múltiplas contas no nível superior:

- `accounts` — registro de substituições nomeadas por conta, indexadas por id da conta.
- `defaultAccount` — id de conta preferido quando múltiplas estão configuradas.

## Executores

Autoverificação no host (grava um relatório em Markdown em `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Isso roteia por `qa-lab`, inicia o barramento de QA dentro do repositório, inicializa a fatia de runtime incluída do `qa-channel` e executa uma autoverificação determinística.

Suíte completa de cenários baseada no repositório:

```bash
pnpm openclaw qa suite
```

Executa cenários em paralelo contra a faixa de Gateway de QA. Veja [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) para cenários, perfis e modos de provedor.

Site de QA baseado em Docker (Gateway + interface de depuração do QA Lab em uma pilha):

```bash
pnpm qa:lab:up
```

Compila o site de QA, inicia a pilha de Gateway + QA Lab baseada em Docker e imprime a URL do QA Lab. A partir daí, você pode escolher cenários, escolher a faixa do modelo, iniciar execuções individuais e acompanhar os resultados ao vivo. O depurador do QA Lab é separado do pacote da Control UI distribuído.

## Relacionado

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — pilha geral, adaptadores de transporte, autoria de cenários
- [QA Matrix](/pt-BR/concepts/qa-matrix) — exemplo de executor de transporte ao vivo que aciona um canal real
- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral dos canais](/pt-BR/channels)
