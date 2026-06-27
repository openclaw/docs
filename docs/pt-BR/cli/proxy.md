---
read_when:
    - Você precisa validar o roteamento de proxy gerenciado pelo operador antes da implantação
    - Você precisa capturar o tráfego de transporte do OpenClaw localmente para depuração
    - Você quer inspecionar sessões do proxy de depuração, blobs ou predefinições de consulta integradas
summary: Referência da CLI para `openclaw proxy`, incluindo validação de proxy gerenciado pelo operador e o inspetor de captura do proxy local de depuração
title: Proxy
x-i18n:
    generated_at: "2026-06-27T17:21:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c3883373f2aa6d365ed93bcb9f7da2bb9281b8bd061d1842bc5bef0f43b7ccb9
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valide o roteamento de proxy gerenciado pelo operador ou execute o proxy explícito local de depuração
e inspecione o tráfego capturado.

Use `validate` para fazer uma verificação preliminar de um proxy de encaminhamento gerenciado pelo operador antes de habilitar
o roteamento de proxy do OpenClaw. Os outros comandos são ferramentas de depuração para
investigação no nível de transporte: eles podem iniciar um proxy local, executar um comando filho
com captura habilitada, listar sessões de captura, consultar padrões comuns de tráfego, ler
blobs capturados e limpar dados de captura locais.

## Comandos

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Validar

`openclaw proxy validate` verifica a URL efetiva do proxy gerenciado pelo operador a partir de
`--proxy-url`, da configuração ou de `OPENCLAW_PROXY_URL`. URLs de proxy gerenciado podem usar
`http://` para um listener de proxy de encaminhamento simples ou `https://` quando o OpenClaw precisa
abrir TLS para o endpoint do proxy antes de enviar solicitações de proxy. Ele relata um
problema de configuração quando nenhum proxy está habilitado e configurado; use `--proxy-url` para uma
verificação preliminar pontual antes de alterar a configuração. Adicione `--proxy-ca-file` para confiar em uma
CA privada para a conexão TLS a um endpoint de proxy HTTPS. Por padrão, ele
verifica que um destino público tem sucesso por meio do proxy e que o proxy
não consegue alcançar um canário temporário de local loopback. Destinos negados personalizados são
fail-closed: respostas HTTP e falhas de transporte ambíguas falham, a menos que
você consiga verificar separadamente um sinal de negação específico da implantação. Adicione
`--apns-reachable` para também abrir um túnel CONNECT HTTP/2 de APNs por meio do proxy
e confirmar que APNs sandbox responde; a sondagem usa um token de provedor intencionalmente inválido,
portanto uma resposta APNs `403 InvalidProviderToken` é um sinal bem-sucedido de
acessibilidade.

Opções:

- `--json`: imprime JSON legível por máquina.
- `--proxy-url <url>`: valida esta URL de proxy `http://` ou `https://` em vez da configuração ou do env.
- `--proxy-ca-file <path>`: confia neste arquivo de CA PEM para verificação TLS de um endpoint de proxy HTTPS.
- `--allowed-url <url>`: adiciona um destino que deve ter sucesso por meio do proxy. Repita para verificar vários destinos.
- `--denied-url <url>`: adiciona um destino que deve ser bloqueado pelo proxy. Repita para verificar vários destinos.
- `--apns-reachable`: também verifica que o HTTP/2 de APNs sandbox é acessível por meio do proxy.
- `--apns-authority <url>`: autoridade de APNs a sondar com `--apns-reachable` (`https://api.sandbox.push.apple.com` por padrão; produção é `https://api.push.apple.com`).
- `--timeout-ms <ms>`: tempo limite por solicitação em milissegundos.

Consulte [Proxy de rede](/pt-BR/security/network-proxy) para orientações de implantação e semântica de negação.

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
- O encaminhamento upstream direto do proxy de depuração abre sockets upstream para diagnóstico. Quando o modo de proxy gerenciado do OpenClaw está ativo, o encaminhamento direto para solicitações de proxy e túneis CONNECT fica desabilitado por padrão; defina `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` somente para diagnósticos locais aprovados.
- `validate` sai com código 1 quando a configuração do proxy ou as verificações de destino falham.
- Capturas são dados locais de depuração; use `openclaw proxy purge` quando terminar.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Proxy de rede](/pt-BR/security/network-proxy)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
