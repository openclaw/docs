---
read_when:
    - Você precisa validar o roteamento de proxy gerenciado pelo operador antes da implantação
    - Você precisa capturar localmente o tráfego de transporte do OpenClaw para depuração
    - Você quer inspecionar sessões de proxy de depuração, blobs ou predefinições de consulta integradas
summary: Referência da CLI para `openclaw proxy`, incluindo validação de proxy gerenciado pelo operador e o inspetor de captura do proxy de depuração local
title: Proxy
x-i18n:
    generated_at: "2026-05-04T18:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 092c4e946dcab5e78e37d6fc77bb067b7a649368f8571fa127e462a85fa14ce5
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valide o roteamento de proxy gerenciado pelo operador, ou execute o proxy de depuração explícito local
e inspecione o tráfego capturado.

Use `validate` para fazer uma pré-verificação de um proxy de encaminhamento gerenciado pelo operador antes de habilitar
o roteamento de proxy do OpenClaw. Os outros comandos são ferramentas de depuração para
investigação em nível de transporte: eles podem iniciar um proxy local, executar um comando filho
com captura habilitada, listar sessões de captura, consultar padrões comuns de tráfego, ler
blobs capturados e limpar dados de captura locais.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validação

`openclaw proxy validate` verifica a URL efetiva do proxy gerenciado pelo operador a partir de
`--proxy-url`, da configuração ou de `OPENCLAW_PROXY_URL`. Ele relata um problema de configuração quando
nenhum proxy está habilitado e configurado; use `--proxy-url` para uma pré-verificação pontual
antes de alterar a configuração. Por padrão, ele verifica que um destino público tem êxito
por meio do proxy e que o proxy não consegue alcançar um canário temporário de loopback.
Destinos negados personalizados falham de modo fechado: respostas HTTP e falhas de
transporte ambíguas falham, a menos que você consiga verificar separadamente um sinal de negação
específico da implantação. Adicione `--apns-reachable` para também abrir um túnel CONNECT
HTTP/2 de APNs por meio do proxy e confirmar que o APNs de sandbox responde; a sondagem usa um
token de provedor intencionalmente inválido, portanto uma resposta APNs `403 InvalidProviderToken`
é um sinal de acessibilidade bem-sucedido.

Opções:

- `--json`: imprime JSON legível por máquina.
- `--proxy-url <url>`: valida esta URL de proxy em vez da configuração ou do ambiente.
- `--allowed-url <url>`: adiciona um destino que deve ter êxito por meio do proxy. Repita para verificar vários destinos.
- `--denied-url <url>`: adiciona um destino que deve ser bloqueado pelo proxy. Repita para verificar vários destinos.
- `--apns-reachable`: também verifica se o HTTP/2 de APNs de sandbox é acessível por meio do proxy.
- `--apns-authority <url>`: autoridade de APNs a sondar com `--apns-reachable` (`https://api.sandbox.push.apple.com` por padrão; produção é `https://api.push.apple.com`).
- `--timeout-ms <ms>`: tempo limite por requisição em milissegundos.

Consulte [Proxy de rede](/pt-BR/security/network-proxy) para obter orientação de implantação e semântica
de negação.

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
- O encaminhamento direto upstream do proxy de depuração abre sockets upstream para diagnóstico. Quando o modo de proxy gerenciado do OpenClaw está ativo, o encaminhamento direto para requisições de proxy e túneis CONNECT é desabilitado por padrão; defina `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` apenas para diagnósticos locais aprovados.
- `validate` sai com código 1 quando a configuração do proxy ou as verificações de destino falham.
- Capturas são dados de depuração locais; use `openclaw proxy purge` ao terminar.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Proxy de rede](/pt-BR/security/network-proxy)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
