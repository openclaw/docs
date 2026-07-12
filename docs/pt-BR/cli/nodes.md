---
read_when:
    - Você está gerenciando Nodes pareados (câmeras, tela, canvas)
    - Você precisa aprovar solicitações ou executar comandos de Node
summary: Referência da CLI para `openclaw nodes` (status, emparelhamento, invocação, câmera/canvas/tela/localização/notificação)
title: Nodes
x-i18n:
    generated_at: "2026-07-12T15:01:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f6b80ca2d82e834280943bcde32f6dfab51ce5566e2174f2d0aa1cd58ca39d6a
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Gerencie Nodes (dispositivos) pareados e invoque os recursos dos Nodes.

Relacionado: [Visão geral dos Nodes](/pt-BR/nodes) - [Presença ativa no computador](/nodes/presence) - [Nodes de câmera](/pt-BR/nodes/camera) - [Nodes de imagem](/pt-BR/nodes/images)

Opções comuns a todos os subcomandos: `--url <url>`, `--token <token>`, `--timeout <ms>` (padrão `10000`), `--json`.

## Status

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status` e `list` aceitam `--connected` (somente Nodes conectados) e `--last-connected <duration>` (por exemplo, `24h`, `7d`; somente Nodes que se conectaram dentro desse período). `list` mostra Nodes pendentes e pareados em tabelas separadas, com as linhas dos pareados incluindo o tempo desde a conexão mais recente (Last Connect); `status` mostra uma única tabela combinada com detalhes de recurso, versão e última entrada de cada Node. Um Node macOS conectado informa a última entrada somente enquanto a permissão de Acessibilidade estiver concedida, e a linha mais recente é marcada como `active`; consulte [Presença ativa no computador](/nodes/presence). `describe` exibe os recursos, as permissões, a atividade e os comandos de invocação efetivos/pendentes de um Node.

## Pareamento

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

Esses comandos controlam o armazenamento `node.pair.*` pertencente ao Gateway, separado do pareamento de dispositivos (`openclaw devices approve`), que controla o handshake `connect` via WS do Node. Consulte [Nodes](/pt-BR/nodes) para entender a relação entre os dois.

- `remove` revoga a entrada de função pareada do Node. Para um Node baseado em dispositivo, isso revoga a função `node` no armazenamento de pareamento de dispositivos e desconecta suas sessões com função de Node: um dispositivo com várias funções mantém sua linha e perde apenas a função `node`, enquanto a linha de um dispositivo que tem somente a função de Node é excluída. Isso também remove qualquer registro legado correspondente de pareamento de Node pertencente ao Gateway.
- `pending` precisa apenas do escopo `operator.pairing`.
- `gateway.nodes.pairing.autoApproveCidrs` pode ignorar a etapa pendente para o pareamento inicial de um dispositivo com `role: node` explicitamente confiável. Desativado por padrão; não aprova elevações de função.
- `gateway.nodes.pairing.sshVerify` (ativado por padrão) aprova automaticamente o pareamento inicial de um dispositivo com `role: node` quando o Gateway consegue verificar a chave do dispositivo via SSH no host do Node; a primeira superfície de recursos é aprovada na mesma etapa. Consulte [Pareamento de Nodes](/pt-BR/gateway/pairing#ssh-verified-device-auto-approval-default).
- Os requisitos de escopo de `approve` seguem os comandos declarados na solicitação pendente:
  - solicitação sem comandos: `operator.pairing`
  - comandos de Node que não sejam de execução: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`
- Escopo de `remove`: `operator.pairing` pode remover linhas de Nodes que não sejam operadores; um chamador com token de dispositivo que revogue sua própria função de Node em um dispositivo com várias funções também precisa de `operator.admin`.

## Invocação

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

Opções:

- `--command <command>` (obrigatória): por exemplo, `canvas.eval`.
- `--params <json>`: string de objeto JSON (padrão `{}`).
- `--invoke-timeout <ms>`: tempo limite de invocação do Node (padrão `15000`).
- `--idempotency-key <key>`: chave de idempotência opcional.

`system.run` e `system.run.prepare` são bloqueados aqui; para executar comandos do shell, use a ferramenta `exec` com `host=node`. `system.which` é permitido por meio de `invoke`.

## Notificação, push, localização e tela

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify` envia uma notificação local em um Node que declara `system.notify`, incluindo Nodes macOS, iOS, Android e watchOS diretos. A entrega direta ao watchOS exige que o OpenClaw esteja ativo. Exige `--title` ou `--body`. Opções: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>` (padrão `system`), `--invoke-timeout <ms>` (padrão `15000`).
- `push` envia uma notificação push de teste via APNs para um Node iOS. Opções: `--title <text>` (padrão `OpenClaw`), `--body <text>`, `--environment <sandbox|production>` para substituir o ambiente APNs detectado.
- `location get` obtém a localização atual do Node. Opções: `--max-age <ms>` (reutiliza uma localização armazenada em cache), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>` (padrão `10000`), `--invoke-timeout <ms>` (padrão `20000`).
- `screen record` captura um clipe curto e exibe o caminho salvo (ou gera JSON com `--json`). Opções: `--screen <index>` (padrão `0`), `--duration <ms|10s>` (padrão `10000`), `--fps <fps>` (padrão `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>` (padrão `120000`).

Os comandos de câmera e Canvas têm documentação própria: [Nodes de câmera](/pt-BR/nodes/camera), [Canvas](/pt-BR/platforms/mac/canvas). O Canvas é implementado pelo Plugin experimental Canvas incluído; o núcleo mantém `openclaw nodes canvas` como ponto de montagem para compatibilidade.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Nodes](/pt-BR/nodes)
