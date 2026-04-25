---
read_when:
    - Você está gerenciando Nodes pareados (câmeras, tela, canvas)
    - Você precisa aprovar solicitações ou invocar comandos de Node
summary: Referência da CLI para `openclaw nodes` (status, pareamento, invoke, camera/canvas/tela)
title: Nodes
x-i18n:
    generated_at: "2026-04-25T13:44:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gerencie Nodes pareados (dispositivos) e invoque capacidades de Node.

Relacionado:

- Visão geral de Nodes: [Nodes](/pt-BR/nodes)
- Câmera: [Camera nodes](/pt-BR/nodes/camera)
- Imagens: [Image nodes](/pt-BR/nodes/images)

Opções comuns:

- `--url`, `--token`, `--timeout`, `--json`

## Comandos comuns

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` imprime tabelas de pendentes/pareados. As linhas pareadas incluem a idade da conexão mais recente (Última conexão).
Use `--connected` para mostrar apenas os Nodes conectados no momento. Use `--last-connected <duration>` para
filtrar para Nodes que se conectaram dentro de uma duração (por exemplo, `24h`, `7d`).

Observação sobre aprovação:

- `openclaw nodes pending` precisa apenas do escopo de pareamento.
- `gateway.nodes.pairing.autoApproveCidrs` pode pular a etapa de pendência apenas para
  o primeiro pareamento de dispositivo `role: node` explicitamente confiável. Isso fica desativado por
  padrão e não aprova upgrades.
- `openclaw nodes approve <requestId>` herda requisitos extras de escopo da
  solicitação pendente:
  - solicitação sem comando: apenas pareamento
  - comandos de Node sem execução: pareamento + gravação
  - `system.run` / `system.run.prepare` / `system.which`: pareamento + admin

## Invoke

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags de invoke:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: tempo limite de invoke do Node (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.
- `system.run` e `system.run.prepare` são bloqueados aqui; use a ferramenta `exec` com `host=node` para execução de shell.

Para execução de shell em um Node, use a ferramenta `exec` com `host=node` em vez de `openclaw nodes run`.
A CLI `nodes` agora é focada em capacidades: RPC direto via `nodes invoke`, além de pareamento, câmera,
tela, localização, canvas e notificações.

## Relacionado

- [referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
