---
read_when:
    - Você precisa acompanhar os logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log em JSON para ferramentas
summary: Referência da CLI para `openclaw logs` (acompanhar logs do Gateway via RPC)
title: Registros
x-i18n:
    generated_at: "2026-05-03T21:28:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89753a18e31cd643e19db80b6cef4ecac1aae0733e68d6c678e6419e28bd270e
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Acompanhe logs de arquivo do Gateway via RPC (funciona em modo remoto).

Relacionado:

- Visão geral de logging: [Logging](/pt-BR/logging)
- CLI do Gateway: [gateway](/pt-BR/cli/gateway)

## Opções

- `--limit <n>`: número máximo de linhas de log a retornar (padrão `200`)
- `--max-bytes <n>`: número máximo de bytes a ler do arquivo de log (padrão `250000`)
- `--follow`: acompanhar o fluxo de logs
- `--interval <ms>`: intervalo de polling durante o acompanhamento (padrão `1000`)
- `--json`: emitir eventos JSON delimitados por linha
- `--plain`: saída em texto simples sem formatação estilizada
- `--no-color`: desabilitar cores ANSI
- `--local-time`: renderizar timestamps no seu fuso horário local

## Opções RPC compartilhadas do Gateway

`openclaw logs` também aceita as flags padrão do cliente Gateway:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: timeout em ms (padrão `30000`)
- `--expect-final`: aguardar uma resposta final quando a chamada ao Gateway for apoiada por agente

Quando você passa `--url`, a CLI não aplica automaticamente configuração nem credenciais de ambiente. Inclua `--token` explicitamente se o Gateway de destino exigir autenticação.

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
- Se o Gateway local loopback implícito solicitar pareamento, fechar durante a conexão ou atingir timeout antes que `logs.tail` responda, `openclaw logs` recorre automaticamente ao arquivo de log configurado do Gateway. Destinos explícitos com `--url` não usam esse fallback.
- Ao usar `--follow`, desconexões transitórias do Gateway (fechamento do WebSocket, timeout, queda de conexão) acionam reconexão automática com recuo exponencial (até 8 tentativas, limitado a 30 s entre tentativas). Um aviso é impresso em stderr a cada nova tentativa, e um aviso `[logs] gateway reconnected` é impresso quando um polling é bem-sucedido. No modo `--json`, tanto o aviso de nova tentativa quanto a transição de reconexão são emitidos como registros `{"type":"notice"}` em stderr. Erros não recuperáveis (falha de autenticação, configuração incorreta) ainda encerram imediatamente.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Logging do Gateway](/pt-BR/gateway/logging)
