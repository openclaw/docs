---
read_when:
    - Você está integrando o transporte de QA sintético a uma execução de teste local ou de CI
    - Você precisa da superfície de configuração do qa-channel incluído no pacote
    - Você está aprimorando a automação de QA de ponta a ponta
summary: Plugin de canal sintético semelhante ao Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-07-16T12:12:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` é um transporte sintético de mensagens local ao repositório para QA automatizado do OpenClaw (`extensions/qa-channel`, pacote privado, excluído das instalações empacotadas). Não é um canal de produção — existe para exercitar o mesmo limite de Plugin de canal usado por transportes reais, mantendo o estado determinístico e totalmente inspecionável.

## O que ele faz

- Gramática de destino da classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Conversas compartilhadas `channel:` e `group:` são apresentadas aos agentes como turnos de salas de grupo/canal, portanto exercitam a mesma política de roteamento de respostas visíveis e ferramentas de mensagens usada pelo Discord, Slack, Telegram e transportes semelhantes.
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

- `enabled` — chave geral de ativação desta conta.
- `name` — rótulo de exibição opcional.
- `baseUrl` — URL do barramento sintético. A conta é considerada configurada assim que isso é definido.
- `botUserId` — ID sintético do usuário bot usado na gramática de destino (padrão: `openclaw`).
- `botDisplayName` — nome de exibição para mensagens de saída (padrão: `OpenClaw QA`).
- `pollTimeoutMs` — janela de espera de sondagem longa. Número inteiro entre 100 e 30000 (padrão: 1000).
- `allowFrom` — lista de remetentes permitidos (IDs de usuário ou `"*"`; padrão: `["*"]`). As mensagens diretas sempre usam a política `open`; a política de grupos com lista de permissões também usa esses IDs sintéticos
  de remetentes.
- `groupPolicy` — política de salas compartilhadas: `"open"` (padrão), `"allowlist"` ou
  `"disabled"`.
- `groupAllowFrom` — lista opcional de remetentes permitidos em salas compartilhadas. Quando omitida sob
  `"allowlist"`, o Canal de QA recorre a `allowFrom`.
- `groups.<room>.requireMention` — exige uma menção ao bot antes de responder em uma
  sala específica de grupo/canal (padrão: false). `groups."*"` define o padrão;
  `tools` / `toolsBySender` por sala definem substituições da política de ferramentas.
- `defaultTo` — destino de fallback quando nenhum é fornecido.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — controle de acesso às ferramentas por ação.

Chaves de várias contas no nível superior:

- `accounts` — registro de substituições nomeadas por conta, indexadas pelo ID da conta.
- `defaultAccount` — ID da conta preferencial quando várias estão configuradas.

## Executores

Autoverificação no lado do host (grava um relatório Markdown em `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Isso passa por `qa-lab`, inicia o barramento de QA no repositório, inicializa o segmento de runtime `qa-channel` e executa uma autoverificação determinística.

Suíte completa de cenários baseada no repositório:

```bash
pnpm openclaw qa suite
```

Executa cenários em paralelo na faixa de Gateway de QA. Consulte a [visão geral de QA](/pt-BR/concepts/qa-e2e-automation) para ver cenários, perfis e modos de provedor.

Site de QA baseado em Docker (Gateway + interface do depurador QA Lab em uma única pilha):

```bash
pnpm qa:lab:up
```

Compila o site de QA, inicia a pilha do Gateway + QA Lab baseada em Docker e exibe a URL do QA Lab. A partir daí, é possível selecionar cenários, escolher a faixa de modelo, iniciar execuções individuais e acompanhar os resultados ao vivo. O depurador QA Lab é separado do pacote da interface de controle distribuído.

## Relacionado

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) — pilha geral, adaptadores de transporte, perfis do Matrix e criação de cenários
- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral dos canais](/pt-BR/channels)
