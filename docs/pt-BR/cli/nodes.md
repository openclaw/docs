---
read_when:
    - Você está gerenciando Nodes pareados (câmeras, tela, canvas)
    - Você precisa aprovar solicitações ou invocar comandos de Node
summary: Referência da CLI para `openclaw nodes` (status, pareamento, invocação, câmera/canvas/tela)
title: Nodes
x-i18n:
    generated_at: "2026-04-24T05:46:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Gerencie Nodes pareados (dispositivos) e invoque recursos de Node.

Relacionado:

- Visão geral de Nodes: [Nodes](/pt-BR/nodes)
- Câmera: [Nodes de câmera](/pt-BR/nodes/camera)
- Imagens: [Nodes de imagem](/pt-BR/nodes/images)

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

`nodes list` imprime tabelas de pendentes/pareados. Linhas de pareados incluem o tempo decorrido desde a conexão mais recente (Última conexão).
Use `--connected` para mostrar apenas Nodes atualmente conectados. Use `--last-connected <duration>` para
filtrar Nodes que se conectaram dentro de um período (por exemplo, `24h`, `7d`).

Observação sobre aprovação:

- `openclaw nodes pending` precisa apenas do escopo de pareamento.
- `openclaw nodes approve <requestId>` herda requisitos extras de escopo da
  solicitação pendente:
  - solicitação sem comando: apenas pareamento
  - comandos de Node sem exec: pareamento + gravação
  - `system.run` / `system.run.prepare` / `system.which`: pareamento + admin

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags de invocação:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: timeout de invocação do node (padrão `15000`).
- `--idempotency-key <key>`: chave opcional de idempotência.
- `system.run` e `system.run.prepare` são bloqueados aqui; use a ferramenta `exec` com `host=node` para execução de shell.

Para execução de shell em um Node, use a ferramenta `exec` com `host=node` em vez de `openclaw nodes run`.
A CLI `nodes` agora é focada em recursos: RPC direto via `nodes invoke`, além de pareamento, câmera,
tela, localização, canvas e notificações.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
