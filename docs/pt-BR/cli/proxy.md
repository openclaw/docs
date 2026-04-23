---
read_when:
    - Você precisa capturar o tráfego de transporte do OpenClaw localmente para depuração
    - Você quer inspecionar sessões do proxy de depuração, blobs ou presets de consulta integrados
summary: Referência da CLI para `openclaw proxy`, o proxy local de depuração e o inspetor de capturas
title: proxy
x-i18n:
    generated_at: "2026-04-23T14:01:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 274de676a558153be85e345917c67647eb7e755b01869bc29e1effba66a7e828
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Execute o proxy local explícito de depuração e inspecione o tráfego capturado.

Este é um comando de depuração para investigação no nível de transporte. Ele pode iniciar um
proxy local, executar um comando filho com a captura ativada, listar sessões de captura,
consultar padrões comuns de tráfego, ler blobs capturados e limpar dados locais
de captura.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Presets de consulta

`openclaw proxy query --preset <name>` aceita:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Observações

- `start` usa `127.0.0.1` por padrão, a menos que `--host` seja definido.
- `run` inicia um proxy local de depuração e depois executa o comando após `--`.
- As capturas são dados locais de depuração; use `openclaw proxy purge` quando terminar.
