---
read_when:
    - Você precisa validar o roteamento de proxy gerenciado pelo operador antes da implantação
    - É necessário capturar o tráfego de transporte do OpenClaw localmente para depuração
    - Você quer inspecionar sessões de proxy de depuração, blobs ou predefinições de consulta integradas
summary: Referência da CLI para `openclaw proxy`, incluindo a validação de proxy gerenciado pelo operador e o inspetor de capturas do proxy de depuração local
title: Proxy
x-i18n:
    generated_at: "2026-05-01T05:55:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0820de861bfe1ec14e0c1624d636d6474b5fedd317e3ba1baaa61f6530e06e9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valide o roteamento de proxy gerenciado pelo operador ou execute o proxy de depuração explícito local
e inspecione o tráfego capturado.

Use `validate` para fazer uma verificação prévia de um proxy de encaminhamento gerenciado pelo operador antes de habilitar
o roteamento de proxy do OpenClaw. Os outros comandos são ferramentas de depuração para
investigação em nível de transporte: eles podem iniciar um proxy local, executar um comando filho
com captura habilitada, listar sessões de captura, consultar padrões comuns de tráfego, ler
blobs capturados e limpar dados de captura locais.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validar

`openclaw proxy validate` verifica a URL efetiva do proxy gerenciado pelo operador a partir de
`--proxy-url`, da configuração ou de `OPENCLAW_PROXY_URL`. Ele relata um problema de configuração quando
nenhum proxy está habilitado e configurado; use `--proxy-url` para uma verificação prévia pontual
antes de alterar a configuração. Por padrão, ele verifica se um destino público tem sucesso
por meio do proxy e se o proxy não consegue acessar um canário temporário de loopback.
Destinos negados personalizados falham fechados: respostas HTTP e falhas de transporte
ambíguas falham, a menos que você consiga verificar separadamente um sinal de negação específico
da implantação.

Opções:

- `--json`: imprime JSON legível por máquina.
- `--proxy-url <url>`: valida esta URL de proxy em vez da configuração ou do env.
- `--allowed-url <url>`: adiciona um destino que deve ter sucesso por meio do proxy. Repita para verificar vários destinos.
- `--denied-url <url>`: adiciona um destino que deve ser bloqueado pelo proxy. Repita para verificar vários destinos.
- `--timeout-ms <ms>`: tempo limite por solicitação em milissegundos.

Consulte [Proxy de rede](/pt-BR/security/network-proxy) para orientação de implantação e semântica de
negação.

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
- `run` inicia um proxy de depuração local e depois executa o comando após `--`.
- `validate` sai com o código 1 quando a configuração do proxy ou as verificações de destino falham.
- As capturas são dados de depuração locais; use `openclaw proxy purge` quando terminar.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Proxy de rede](/pt-BR/security/network-proxy)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
