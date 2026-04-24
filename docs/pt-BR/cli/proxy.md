---
read_when:
    - Você precisa capturar localmente o tráfego de transporte do OpenClaw para depuração
    - Você quer inspecionar sessões do proxy de depuração, blobs ou predefinições de consulta integradas
summary: Referência da CLI para `openclaw proxy`, o proxy local de depuração e inspetor de capturas
title: Proxy
x-i18n:
    generated_at: "2026-04-24T05:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 15
---

# `openclaw proxy`

Execute o proxy local explícito de depuração e inspecione o tráfego capturado.

Este é um comando de depuração para investigação em nível de transporte. Ele pode iniciar um
proxy local, executar um comando filho com captura ativada, listar sessões de captura,
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

## Predefinições de consulta

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
- Capturas são dados locais de depuração; use `openclaw proxy purge` quando terminar.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
