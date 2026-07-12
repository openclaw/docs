---
read_when:
    - Você precisa acompanhar os logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log em JSON para ferramentas
summary: Referência da CLI para `openclaw logs` (acompanhar logs do Gateway via RPC)
title: Logs
x-i18n:
    generated_at: "2026-07-12T15:01:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

Acompanhe continuamente os logs de arquivo do Gateway via RPC. Funciona no modo remoto.

## Opções

- `--limit <n>`: número máximo de linhas de log a retornar (padrão: `200`)
- `--max-bytes <n>`: número máximo de bytes a ler do arquivo de log (padrão: `250000`)
- `--follow`: acompanha continuamente o fluxo de logs
- `--interval <ms>`: intervalo de sondagem durante o acompanhamento (padrão: `1000`)
- `--json`: emite eventos JSON delimitados por linha
- `--plain`: saída em texto simples, sem formatação estilizada
- `--no-color`: desativa as cores ANSI
- `--local-time`: exibe os carimbos de data e hora no seu fuso horário local (padrão)
- `--utc`: exibe os carimbos de data e hora em UTC

## Opções compartilhadas de RPC do Gateway

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: tempo limite em ms (padrão: `30000`)
- `--expect-final`: aguarda uma resposta final quando a chamada ao Gateway é processada por um agente

Passar `--url` ignora as credenciais de configuração aplicadas automaticamente; inclua `--token` explicitamente se o Gateway de destino exigir autenticação.

## Exemplos

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## Comportamento de fallback e recuperação

- Se o Gateway implícito no loopback local solicitar pareamento, fechar durante a conexão ou atingir o tempo limite antes de `logs.tail` responder, `openclaw logs` recorrerá automaticamente ao log de arquivo configurado do Gateway. Destinos `--url` explícitos nunca usam esse fallback.
- `--follow` não recorre a esse arquivo configurado após uma falha de RPC do Gateway local implícito — um arquivo paralelo desatualizado poderia tornar enganoso o acompanhamento em tempo real. No Linux, ele usa o diário do Gateway ativo no systemd do usuário, identificado pelo PID, quando disponível (e imprime a fonte selecionada); caso contrário, continua tentando se reconectar ao Gateway ativo.
- Durante `--follow`, desconexões transitórias (fechamento do WebSocket, tempo limite, queda de conexão) acionam a reconexão automática com espera exponencial: até 8 novas tentativas, limitadas a 30s entre as tentativas. Um aviso é impresso em stderr a cada nova tentativa, e uma notificação `[logs] gateway reconnected` é impressa assim que uma sondagem é bem-sucedida. No modo `--json`, ambos são emitidos como registros `{"type":"notice"}` em stderr. Erros irrecuperáveis (falha de autenticação, configuração inválida) ainda causam encerramento imediato.
- No modo `--follow --json`, as transições da fonte de logs são emitidas como registros `{"type":"meta"}`. Acompanhe os cursores por `sourceKind`: um fluxo pode passar da saída do arquivo do Gateway (`sourceKind: "file"`) para o fallback do diário local (`sourceKind: "journal"`, `localFallback: true`, com `service.pid`/`service.unit`) e retornar à saída do arquivo do Gateway após a recuperação. Não presuma uma única fonte ou um único cursor estável durante toda a sessão e aceite linhas sobrepostas quando a recuperação reproduzir o cursor do arquivo do Gateway.

## Relacionado

- [Visão geral dos logs](/pt-BR/logging)
- [CLI do Gateway](/pt-BR/cli/gateway)
- [Referência da CLI](/pt-BR/cli)
- [Logs do Gateway](/pt-BR/gateway/logging)
