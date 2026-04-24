---
read_when:
    - Você precisa acompanhar os logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log em JSON para ferramentas
summary: Referência da CLI para `openclaw logs` (acompanhar logs do Gateway via RPC)
title: Logs
x-i18n:
    generated_at: "2026-04-24T05:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

Acompanhe logs de arquivo do Gateway via RPC (funciona no modo remoto).

Relacionado:

- Visão geral de logs: [Logging](/pt-BR/logging)
- CLI do Gateway: [gateway](/pt-BR/cli/gateway)

## Opções

- `--limit <n>`: número máximo de linhas de log a retornar (padrão `200`)
- `--max-bytes <n>`: máximo de bytes a ler do arquivo de log (padrão `250000`)
- `--follow`: acompanhar o fluxo de logs
- `--interval <ms>`: intervalo de polling durante o acompanhamento (padrão `1000`)
- `--json`: emitir eventos JSON delimitados por linha
- `--plain`: saída em texto simples sem formatação estilizada
- `--no-color`: desativar cores ANSI
- `--local-time`: renderizar timestamps no seu fuso horário local

## Opções compartilhadas de RPC do Gateway

`openclaw logs` também aceita as flags padrão do cliente do Gateway:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: tempo limite em ms (padrão `30000`)
- `--expect-final`: aguardar uma resposta final quando a chamada do Gateway for apoiada por agente

Quando você passa `--url`, a CLI não aplica automaticamente credenciais de configuração nem do ambiente. Inclua `--token` explicitamente se o Gateway de destino exigir autenticação.

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

- Use `--local-time` para renderizar timestamps no seu fuso horário local.
- Se o Gateway local loopback solicitar pareamento, `openclaw logs` recorre automaticamente ao arquivo de log local configurado. Destinos explícitos com `--url` não usam esse fallback.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Logging do Gateway](/pt-BR/gateway/logging)
