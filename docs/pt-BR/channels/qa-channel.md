---
read_when:
    - Você está integrando o transporte sintético de QA a uma execução de teste local ou de CI
    - Você precisa da superfície de configuração do qa-channel incluída
    - Você está fazendo iterações na automação de QA de ponta a ponta
summary: Plugin de canal sintético do tipo Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-05-06T05:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` é um transporte de mensagens sintético incluído para QA automatizado do OpenClaw. Ele não é um canal de produção - existe para exercitar o mesmo limite de Plugin de canal usado por transportes reais, mantendo o estado determinístico e totalmente inspecionável.

## O que ele faz

- Gramática de destino do tipo Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Conversas compartilhadas `channel:` e `group:` são expostas aos agentes como turnos de sala de grupo/canal, então elas exercitam a mesma política de roteamento de resposta visível e ferramenta de mensagem usada pelo Discord, Slack, Telegram e transportes semelhantes.
- Barramento sintético baseado em HTTP para injeção de mensagens de entrada, captura de transcrição de saída, criação de threads, reações, edições, exclusões e ações de pesquisa/leitura.
- Executor de autoverificação no host que grava um relatório Markdown em `.artifacts/qa-e2e/`.

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

- `enabled` - alternância principal para esta conta.
- `name` - rótulo de exibição opcional.
- `baseUrl` - URL do barramento sintético.
- `botUserId` - ID de usuário do bot no estilo Matrix usado na gramática de destino.
- `botDisplayName` - nome de exibição para mensagens de saída.
- `pollTimeoutMs` - janela de espera de long-poll. Inteiro entre 100 e 30000.
- `allowFrom` - lista de remetentes permitidos (IDs de usuário ou `"*"`).
- `defaultTo` - destino de fallback quando nenhum é fornecido.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - controle de ferramentas por ação.

Chaves de múltiplas contas no nível superior:

- `accounts` - registro de substituições nomeadas por conta, indexadas por ID de conta.
- `defaultAccount` - ID da conta preferida quando várias estão configuradas.

## Executores

Autoverificação no host (grava um relatório Markdown em `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Isso roteia por `qa-lab`, inicia o barramento de QA no repositório, inicializa a fatia de runtime `qa-channel` incluída e executa uma autoverificação determinística.

Suíte completa de cenários apoiada pelo repositório:

```bash
pnpm openclaw qa suite
```

Executa cenários em paralelo contra a via do Gateway de QA. Consulte [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) para cenários, perfis e modos de provedor.

Site de QA com suporte do Docker (Gateway + interface de depuração do QA Lab em uma única pilha):

```bash
pnpm qa:lab:up
```

Compila o site de QA, inicia a pilha de Gateway + QA Lab com suporte do Docker e imprime a URL do QA Lab. A partir daí, você pode escolher cenários, escolher a via do modelo, iniciar execuções individuais e acompanhar os resultados ao vivo. O depurador do QA Lab é separado do pacote da Control UI distribuído.

## Relacionados

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - pilha geral, adaptadores de transporte, autoria de cenários
- [QA Matrix](/pt-BR/concepts/qa-matrix) - exemplo de executor de transporte ao vivo que aciona um canal real
- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral de canais](/pt-BR/channels)
