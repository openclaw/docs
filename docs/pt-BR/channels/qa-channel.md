---
read_when:
    - Você está integrando o transporte sintético de QA a uma execução de teste local ou de CI
    - Você precisa da superfície de configuração do qa-channel incluída
    - Você está iterando na automação de QA de ponta a ponta
summary: Plugin sintético de canal do tipo Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-04-30T09:37:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` é um transporte sintético de mensagens incluído para QA automatizado do OpenClaw. Ele não é um canal de produção — existe para exercitar o mesmo limite de Plugin de canal usado por transportes reais, mantendo o estado determinístico e totalmente inspecionável.

## O que ele faz

- Gramática de destino de classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Barramento sintético baseado em HTTP para injeção de mensagens de entrada, captura de transcrições de saída, criação de threads, reações, edições, exclusões e ações de busca/leitura.
- Executor de autoverificação no lado do host que grava um relatório Markdown em `.artifacts/qa-e2e/`.

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
- `botUserId` — ID de usuário do bot no estilo Matrix usado na gramática de destino.
- `botDisplayName` — nome de exibição para mensagens de saída.
- `pollTimeoutMs` — janela de espera de long-poll. Inteiro entre 100 e 30000.
- `allowFrom` — lista de permissões de remetentes (IDs de usuário ou `"*"`).
- `defaultTo` — destino de fallback quando nenhum é fornecido.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — controle de ferramentas por ação.

Chaves de múltiplas contas no nível superior:

- `accounts` — registro de substituições nomeadas por conta, indexadas por ID da conta.
- `defaultAccount` — ID da conta preferida quando várias estão configuradas.

## Executores

Autoverificação no lado do host (grava um relatório Markdown em `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Isso passa pelo `qa-lab`, inicia o barramento de QA dentro do repositório, inicializa a fatia de runtime do `qa-channel` incluído e executa uma autoverificação determinística.

Suíte completa de cenários baseada no repositório:

```bash
pnpm openclaw qa suite
```

Executa cenários em paralelo contra a faixa de Gateway de QA. Consulte [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) para cenários, perfis e modos de provedor.

Site de QA baseado em Docker (Gateway + interface de depuração do QA Lab em uma única pilha):

```bash
pnpm qa:lab:up
```

Compila o site de QA, inicia a pilha de Gateway + QA Lab baseada em Docker e imprime a URL do QA Lab. A partir daí, você pode escolher cenários, selecionar a faixa do modelo, iniciar execuções individuais e acompanhar os resultados ao vivo. O depurador do QA Lab é separado do pacote de Control UI enviado.

## Relacionado

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — pilha geral, adaptadores de transporte, autoria de cenários
- [QA do Matrix](/pt-BR/concepts/qa-matrix) — exemplo de executor de transporte ao vivo que controla um canal real
- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral dos canais](/pt-BR/channels)
