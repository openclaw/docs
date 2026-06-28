---
read_when:
    - Você está conectando o transporte sintético de QA a uma execução de teste local ou de CI.
    - Você precisa da superfície de configuração qa-channel incluída
    - Você está iterando na automação de QA de ponta a ponta
summary: Plugin sintético de canal de classe Slack para cenários determinísticos de QA do OpenClaw
title: Canal de QA
x-i18n:
    generated_at: "2026-05-10T19:23:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
    postprocess_version: locale-links-v1
---

`qa-channel` é um transporte de mensagens sintético incluído para QA automatizado do OpenClaw. Ele não é um canal de produção - existe para exercitar o mesmo limite de Plugin de canal usado por transportes reais, mantendo o estado determinístico e totalmente inspecionável.

## O que ele faz

- Gramática de destino da classe Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Conversas compartilhadas `channel:` e `group:` são expostas aos agentes como turnos de sala de grupo/canal, para que exercitem a mesma política de resposta visível e roteamento de ferramentas de mensagem usada por Discord, Slack, Telegram e transportes semelhantes.
- Barramento sintético com suporte HTTP para injeção de mensagens recebidas, captura de transcrições enviadas, criação de threads, reações, edições, exclusões e ações de busca/leitura.
- Executor de autoverificação no lado do host que grava um relatório em Markdown em `.artifacts/qa-e2e/`.

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

Chaves de conta:

- `enabled` - alternância principal para esta conta.
- `name` - rótulo de exibição opcional.
- `baseUrl` - URL do barramento sintético.
- `botUserId` - ID de usuário do bot no estilo Matrix usado na gramática de destino.
- `botDisplayName` - nome de exibição para mensagens de saída.
- `pollTimeoutMs` - janela de espera de long-poll. Inteiro entre 100 e 30000.
- `allowFrom` - lista de remetentes permitidos (IDs de usuário ou `"*"`). Mensagens diretas e
  a política de grupo com lista de permissões usam esses IDs de remetente sintéticos.
- `groupPolicy` - política de sala compartilhada: `"open"` (padrão), `"allowlist"` ou
  `"disabled"`.
- `groupAllowFrom` - lista opcional de remetentes permitidos em sala compartilhada. Quando omitida sob
  `"allowlist"`, o QA Channel recorre a `allowFrom`.
- `groups.<room>.requireMention` - exige uma menção ao bot antes de responder em uma
  sala de grupo/canal específica. `groups."*"` define o padrão.
- `defaultTo` - destino de fallback quando nenhum é fornecido.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - controle de ferramentas por ação.

Chaves de várias contas no nível superior:

- `accounts` - registro de substituições nomeadas por conta, indexadas por ID da conta.
- `defaultAccount` - ID de conta preferido quando várias estão configuradas.

## Executores

Autoverificação no lado do host (grava um relatório em Markdown em `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Isso passa por `qa-lab`, inicia o barramento de QA no repositório, inicializa a fatia de runtime `qa-channel` incluída e executa uma autoverificação determinística.

Suíte completa de cenários com suporte do repositório:

```bash
pnpm openclaw qa suite
```

Executa cenários em paralelo contra a lane de Gateway de QA. Consulte a [visão geral de QA](/pt-BR/concepts/qa-e2e-automation) para cenários, perfis e modos de provedor.

Site de QA com suporte do Docker (Gateway + interface de depuração do QA Lab em uma única stack):

```bash
pnpm qa:lab:up
```

Compila o site de QA, inicia a stack Gateway + QA Lab com suporte do Docker e imprime a URL do QA Lab. A partir daí, você pode escolher cenários, escolher a lane do modelo, iniciar execuções individuais e acompanhar os resultados ao vivo. O depurador do QA Lab é separado do pacote enviado da interface Control.

## Relacionados

- [Visão geral de QA](/pt-BR/concepts/qa-e2e-automation) - stack geral, adaptadores de transporte, autoria de cenários
- [QA do Matrix](/pt-BR/concepts/qa-matrix) - exemplo de executor de transporte ao vivo que aciona um canal real
- [Pareamento](/pt-BR/channels/pairing)
- [Grupos](/pt-BR/channels/groups)
- [Visão geral dos canais](/pt-BR/channels)
