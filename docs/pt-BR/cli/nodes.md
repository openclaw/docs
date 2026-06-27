---
read_when:
    - Você está gerenciando nós pareados (câmeras, tela, tela de desenho)
    - Você precisa aprovar solicitações ou invocar comandos node
summary: Referência da CLI para `openclaw nodes` (status, pareamento, invocação, câmera/canvas/tela)
title: Nodes
x-i18n:
    generated_at: "2026-06-27T17:20:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gerencie nós (dispositivos) pareados e invoque capacidades de nós.

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

`nodes list` imprime tabelas de pendentes/pareados. As linhas pareadas incluem a idade da conexão mais recente (Última conexão).
Use `--connected` para mostrar apenas nós conectados no momento. Use `--last-connected <duration>` para
filtrar nós que se conectaram dentro de uma duração (por exemplo, `24h`, `7d`).
Use `nodes remove --node <id|name|ip>` para remover o pareamento de um nó. Para um
nó respaldado por dispositivo, isso revoga o papel `node` do dispositivo em `devices/paired.json`
e desconecta suas sessões com papel de nó (um dispositivo com papéis mistos mantém sua linha e
perde apenas o papel `node`; um dispositivo somente de nó é excluído); também limpa qualquer
registro de pareamento de nó legado correspondente pertencente ao gateway. `operator.pairing` pode remover
linhas de nó não operadoras; um chamador com token de dispositivo que revoga seu próprio papel de nó em um
dispositivo com papéis mistos também precisa de `operator.admin`.

Observação de aprovação:

- `openclaw nodes pending` precisa apenas do escopo de pareamento.
- `gateway.nodes.pairing.autoApproveCidrs` pode pular a etapa de pendência apenas para
  pareamento de dispositivo `role: node` explicitamente confiável e de primeira vez. Ele fica desativado por
  padrão e não aprova upgrades.
- `openclaw nodes approve <requestId>` herda requisitos extras de escopo da
  solicitação pendente:
  - solicitação sem comando: apenas pareamento
  - comandos de nó não exec: pareamento + escrita
  - `system.run` / `system.run.prepare` / `system.which`: pareamento + admin

## Invocar

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Flags de invocação:

- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: timeout de invocação de nó (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.
- `system.run` e `system.run.prepare` são bloqueados aqui; use a ferramenta `exec` com `host=node` para execução de shell.

Para execução de shell em um nó, use a ferramenta `exec` com `host=node` em vez de `openclaw nodes run`.
A CLI `nodes` agora é focada em capacidades: RPC direto via `nodes invoke`, além de pareamento, câmera,
tela, localização, Canvas e notificações. Os comandos Canvas são implementados pelo Plugin Canvas experimental incluído; o core mantém um hook de compatibilidade para que eles permaneçam em `openclaw nodes canvas`.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nós](/pt-BR/nodes)
