---
read_when:
    - Você está conectando o transporte de QA sintético a uma execução de teste local ou de CI
    - Você precisa da interface de configuração integrada do qa-channel
    - Você está aprimorando a automação de QA de ponta a ponta
summary: Plugin de canal sintético da categoria do Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-07-12T14:54:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` é um transporte sintético de mensagens local ao repositório para QA automatizada do OpenClaw (`extensions/qa-channel`, pacote privado, excluído das instalações empacotadas). Ele não é um canal de produção — existe para exercitar o mesmo limite de Plugin de canal usado por transportes reais, mantendo o estado determinístico e totalmente inspecionável.

## O que ele faz

- Gramática de destino semelhante à do Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Conversas compartilhadas `channel:` e `group:` são apresentadas aos agentes como turnos de sala de grupo/canal, exercitando assim a mesma política de roteamento de respostas visíveis e da ferramenta de mensagens usada pelo Discord, Slack, Telegram e transportes semelhantes.
- Barramento sintético baseado em HTTP para injeção de mensagens recebidas, captura de transcrições de saída, criação de threads, reações, edições, exclusões e ações de pesquisa/leitura.
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

- `enabled` — controle principal para ativar ou desativar esta conta.
- `name` — rótulo de exibição opcional.
- `baseUrl` — URL do barramento sintético. A conta é considerada configurada assim que este valor é definido.
- `botUserId` — ID de usuário do bot sintético usado na gramática de destino (padrão: `openclaw`).
- `botDisplayName` — nome de exibição das mensagens de saída (padrão: `OpenClaw QA`).
- `pollTimeoutMs` — janela de espera da consulta longa. Inteiro entre 100 e 30000 (padrão: 1000).
- `allowFrom` — lista de remetentes permitidos (IDs de usuário ou `"*"`; padrão: `["*"]`). As DMs sempre usam a política `open`; a política de grupo com lista de permissões também usa esses IDs de remetentes sintéticos.
- `groupPolicy` — política de salas compartilhadas: `"open"` (padrão), `"allowlist"` ou `"disabled"`.
- `groupAllowFrom` — lista opcional de remetentes permitidos em salas compartilhadas. Quando omitida sob `"allowlist"`, o Canal de QA recorre a `allowFrom`.
- `groups.<room>.requireMention` — exige uma menção ao bot antes de responder em uma sala específica de grupo/canal (padrão: false). `groups."*"` define o padrão; `tools` / `toolsBySender` por sala definem substituições da política de ferramentas.
- `defaultTo` — destino alternativo quando nenhum é fornecido.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — controle de acesso às ferramentas por ação.

Chaves de múltiplas contas no nível superior:

- `accounts` — registro de substituições nomeadas por conta, indexadas pelo ID da conta.
- `defaultAccount` — ID da conta preferencial quando várias estão configuradas.

## Executores

Autoverificação no lado do host (grava um relatório Markdown em `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Isso encaminha a execução pelo `qa-lab`, inicia o barramento de QA dentro do repositório, inicializa a fatia de runtime do `qa-channel` e executa uma autoverificação determinística.

Suíte completa de cenários baseada no repositório:

```bash
pnpm openclaw qa suite
```

Executa cenários em paralelo na faixa do Gateway de QA. Consulte a [visão geral de QA](/pt-BR/concepts/qa-e2e-automation) para conhecer os cenários, perfis e modos de provedor.

Site de QA baseado em Docker (Gateway + interface de depuração do QA Lab em uma única pilha):

```bash
pnpm qa:lab:up
```

Compila o site de QA, inicia a pilha do Gateway baseada em Docker com o QA Lab e exibe a URL do QA Lab. A partir daí, você pode selecionar cenários, escolher a faixa do modelo, iniciar execuções individuais e acompanhar os resultados em tempo real. O depurador do QA Lab é separado do pacote da interface de controle distribuído.

## Relacionado

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — pilha geral, adaptadores de transporte e criação de cenários
- [QA do Matrix](/pt-BR/concepts/qa-matrix) — exemplo de executor de transporte ativo que controla um canal real
- [Emparelhamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral dos canais](/pt-BR/channels)
