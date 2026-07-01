---
read_when:
    - Você precisa acompanhar os logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log JSON para ferramentas
summary: Referência da CLI para `openclaw logs` (acompanhar logs do gateway via RPC)
title: Registros
x-i18n:
    generated_at: "2026-07-01T15:21:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Acompanhe logs de arquivo do Gateway por RPC (funciona em modo remoto).

Relacionado:

- Visão geral de logs: [Logs](/pt-BR/logging)
- CLI do Gateway: [gateway](/pt-BR/cli/gateway)

## Opções

- `--limit <n>`: número máximo de linhas de log a retornar (padrão `200`)
- `--max-bytes <n>`: máximo de bytes a ler do arquivo de log (padrão `250000`)
- `--follow`: acompanhar o fluxo de logs
- `--interval <ms>`: intervalo de polling ao acompanhar (padrão `1000`)
- `--json`: emitir eventos JSON delimitados por linha
- `--plain`: saída em texto simples sem formatação estilizada
- `--no-color`: desativar cores ANSI
- `--local-time`: renderizar timestamps no seu fuso horário local (padrão)
- `--utc`: renderizar timestamps em UTC

## Opções RPC compartilhadas do Gateway

`openclaw logs` também aceita as flags padrão do cliente Gateway:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: timeout em ms (padrão `30000`)
- `--expect-final`: aguardar uma resposta final quando a chamada ao Gateway tiver respaldo de agente

Quando você passa `--url`, a CLI não aplica automaticamente credenciais de configuração ou ambiente. Inclua `--token` explicitamente se o Gateway de destino exigir autenticação.

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
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Observações

- Por padrão, os timestamps são renderizados no seu fuso horário local. Use `--utc` para saída em UTC.
- Se o Gateway local loopback implícito solicitar pareamento, fechar durante a conexão ou atingir timeout antes de `logs.tail` responder, `openclaw logs` recorre automaticamente ao log de arquivo configurado do Gateway. Destinos `--url` explícitos não usam esse fallback.
- `openclaw logs --follow` não acompanha fallbacks de arquivo configurado após falhas de RPC do Gateway local implícito. No Linux, ele usa o journal ativo do Gateway de user-systemd por PID quando disponível e imprime a fonte de log selecionada; caso contrário, continua tentando novamente o Gateway ativo em vez de acompanhar um arquivo lado a lado potencialmente obsoleto.
- Ao usar `--follow`, desconexões transitórias do gateway (fechamento de WebSocket, timeout, queda de conexão) acionam reconexão automática com backoff exponencial (até 8 tentativas, limitado a 30 s entre tentativas). Um aviso é impresso em stderr a cada nova tentativa, e um aviso `[logs] gateway reconnected` é impresso assim que um polling tem sucesso. No modo `--json`, tanto o aviso de nova tentativa quanto a transição de reconexão são emitidos como registros `{"type":"notice"}` em stderr. Erros não recuperáveis (falha de autenticação, configuração inválida) ainda encerram imediatamente.
- No modo `--follow --json`, transições da fonte de log são emitidas como registros `{"type":"meta"}`. Consumidores devem rastrear cursores por `sourceKind`: um fluxo pode passar da saída de arquivo do Gateway (`sourceKind: "file"`) para o fallback de journal local (`sourceKind: "journal"`, `localFallback: true`, com `service.pid`/`service.unit`) e voltar para a saída de arquivo do Gateway após a recuperação. Não presuma uma única fonte ou cursor estável para toda a sessão de acompanhamento, e tolere linhas sobrepostas quando a recuperação reproduzir novamente o cursor do arquivo do Gateway.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Logs do Gateway](/pt-BR/gateway/logging)
