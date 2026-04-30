---
read_when:
    - Você precisa acompanhar os logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log JSON para ferramentas
summary: Referência de CLI para `openclaw logs` (acompanhar logs do Gateway via RPC)
title: Registros
x-i18n:
    generated_at: "2026-04-30T09:41:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Acompanhe os logs de arquivo do Gateway por RPC (funciona no modo remoto).

Relacionado:

- Visão geral de registro em log: [Registro em log](/pt-BR/logging)
- CLI do Gateway: [gateway](/pt-BR/cli/gateway)

## Opções

- `--limit <n>`: número máximo de linhas de log a retornar (padrão `200`)
- `--max-bytes <n>`: máximo de bytes a ler do arquivo de log (padrão `250000`)
- `--follow`: acompanhar o fluxo de log
- `--interval <ms>`: intervalo de sondagem durante o acompanhamento (padrão `1000`)
- `--json`: emitir eventos JSON delimitados por linha
- `--plain`: saída em texto simples sem formatação estilizada
- `--no-color`: desativar cores ANSI
- `--local-time`: renderizar carimbos de data/hora no seu fuso horário local

## Opções compartilhadas de RPC do Gateway

`openclaw logs` também aceita as flags padrão do cliente Gateway:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: tempo limite em ms (padrão `30000`)
- `--expect-final`: aguardar uma resposta final quando a chamada do Gateway tiver suporte de agente

Quando você passa `--url`, a CLI não aplica automaticamente credenciais de configuração ou de ambiente. Inclua `--token` explicitamente se o Gateway de destino exigir autenticação.

## Exemplos

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Observações

- Use `--local-time` para renderizar carimbos de data/hora no seu fuso horário local.
- Se o Gateway local loopback implícito solicitar pareamento, fechar durante a conexão ou atingir o tempo limite antes de `logs.tail` responder, `openclaw logs` retornará automaticamente ao log de arquivo do Gateway configurado. Destinos `--url` explícitos não usam esse fallback.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Registro em log do Gateway](/pt-BR/gateway/logging)
