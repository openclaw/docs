---
read_when:
    - Você está gerenciando nós pareados (câmeras, tela, área de desenho)
    - É necessário aprovar solicitações ou executar comandos Node
summary: Referência da CLI para `openclaw nodes` (status, pareamento, invoke, câmera/canvas/tela)
title: Nodes
x-i18n:
    generated_at: "2026-04-30T09:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gerencie nós pareados (dispositivos) e invoque capacidades de nós.

Relacionado:

- Visão geral de nós: [Nós](/pt-BR/nodes)
- Câmera: [Nós de câmera](/pt-BR/nodes/camera)
- Imagens: [Nós de imagem](/pt-BR/nodes/images)

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` imprime tabelas pendentes/pareadas. As linhas pareadas incluem a idade da conexão mais recente (Última conexão).
Use `--connected` para mostrar apenas os nós conectados no momento. Use `--last-connected <duration>` para
filtrar para nós que se conectaram dentro de uma duração (por exemplo, `24h`, `7d`).
Use `nodes remove --node <id|name|ip>` para excluir um registro obsoleto de pareamento de nó pertencente ao Gateway.

Observação sobre aprovação:

- `openclaw nodes pending` precisa apenas do escopo de pareamento.
- `gateway.nodes.pairing.autoApproveCidrs` pode ignorar a etapa pendente apenas para
  pareamento de dispositivo `role: node` explicitamente confiável e inicial. Ele fica desativado
  por padrão e não aprova upgrades.
- `openclaw nodes approve <requestId>` herda requisitos de escopo extras da
  solicitação pendente:
  - solicitação sem comando: apenas pareamento
  - comandos de nó que não são exec: pareamento + gravação
  - `system.run` / `system.run.prepare` / `system.which`: pareamento + admin

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags de invocação:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: tempo limite de invocação do nó (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.
- `system.run` e `system.run.prepare` são bloqueados aqui; use a ferramenta `exec` com `host=node` para execução de shell.

Para execução de shell em um nó, use a ferramenta `exec` com `host=node` em vez de `openclaw nodes run`.
A CLI `nodes` agora é focada em capacidades: RPC direto via `nodes invoke`, além de pareamento, câmera,
tela, localização, canvas e notificações.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
