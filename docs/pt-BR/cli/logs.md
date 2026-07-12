---
read_when:
    - Você precisa acompanhar os logs do Gateway remotamente (sem SSH)
    - Você quer linhas de log em JSON para ferramentas
summary: Referência da CLI para `openclaw logs` (acompanhe os logs do Gateway via RPC)
title: Logs
x-i18n:
    generated_at: "2026-07-11T23:49:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
- `--follow`: acompanhar continuamente o fluxo de logs
- `--interval <ms>`: intervalo de sondagem durante o acompanhamento (padrão: `1000`)
- `--json`: emitir eventos JSON delimitados por linha
- `--plain`: saída em texto simples, sem formatação estilizada
- `--no-color`: desativar cores ANSI
- `--local-time`: exibir carimbos de data e hora no seu fuso horário local (padrão)
- `--utc`: exibir carimbos de data e hora em UTC

## Opções compartilhadas de RPC do Gateway

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--timeout <ms>`: tempo limite em ms (padrão: `30000`)
- `--expect-final`: aguardar uma resposta final quando a chamada ao Gateway tiver um agente como backend

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

- Se o Gateway de local loopback implícito solicitar pareamento, fechar durante a conexão ou atingir o tempo limite antes que `logs.tail` responda, `openclaw logs` usará automaticamente como fallback o log de arquivo do Gateway configurado. Destinos `--url` explícitos nunca usam esse fallback.
- `--follow` não usa esse arquivo configurado como fallback após uma falha implícita de RPC do Gateway local — um arquivo paralelo desatualizado poderia induzir a uma interpretação incorreta de um acompanhamento em tempo real. No Linux, em vez disso, ele usa o diário do Gateway no systemd do usuário ativo, identificado pelo PID, quando disponível (e imprime a fonte selecionada); caso contrário, continua tentando se reconectar ao Gateway em tempo real.
- Durante `--follow`, desconexões transitórias (fechamento do WebSocket, tempo limite, queda da conexão) acionam uma reconexão automática com recuo exponencial: até 8 tentativas, com limite de 30 s entre elas. Um aviso é impresso em stderr a cada nova tentativa, e uma notificação `[logs] gateway reconnected` é impressa assim que uma sondagem é bem-sucedida. No modo `--json`, ambos são emitidos como registros `{"type":"notice"}` em stderr. Erros irrecuperáveis (falha de autenticação, configuração inválida) ainda encerram imediatamente.
- No modo `--follow --json`, as transições da fonte de logs são emitidas como registros `{"type":"meta"}`. Acompanhe os cursores por `sourceKind`: um fluxo pode passar da saída do arquivo do Gateway (`sourceKind: "file"`) para o fallback do diário local (`sourceKind: "journal"`, `localFallback: true`, com `service.pid`/`service.unit`) e retornar à saída do arquivo do Gateway após a recuperação. Não pressuponha uma única fonte ou um único cursor estável durante toda a sessão e aceite linhas sobrepostas quando a recuperação reproduzir novamente o cursor do arquivo do Gateway.

## Conteúdo relacionado

- [Visão geral dos logs](/pt-BR/logging)
- [CLI do Gateway](/pt-BR/cli/gateway)
- [Referência da CLI](/pt-BR/cli)
- [Logs do Gateway](/pt-BR/gateway/logging)
