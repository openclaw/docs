---
read_when:
    - Você precisa validar o roteamento de proxy gerenciado pelo operador antes da implantação
    - Você precisa capturar localmente o tráfego de transporte do OpenClaw para depuração
    - Você quer inspecionar sessões do proxy de depuração, blobs ou predefinições de consulta integradas
summary: Referência da CLI para `openclaw proxy`, incluindo a validação de proxy gerenciado pelo operador e o inspetor local de capturas do proxy de depuração
title: Proxy
x-i18n:
    generated_at: "2026-07-12T15:06:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 91583f785032bfffe455a1963804108550f6fbb735ac4de1dd91d0ca5ae0df35
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Valide o roteamento de proxy gerenciado pelo operador ou execute o proxy de depuração explícito local e inspecione o tráfego capturado.

```bash
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

`validate` faz uma verificação preliminar de um proxy de encaminhamento gerenciado pelo operador. Os demais são ferramentas de depuração para investigação no nível de transporte: iniciar um proxy local com captura, executar um comando filho por meio dele, listar sessões de captura, consultar padrões de tráfego, ler blobs capturados e excluir os dados de captura locais.

## Validação

Verifica a URL efetiva do proxy gerenciado pelo operador em `--proxy-url`, na configuração (`proxy.proxyUrl`) ou em `OPENCLAW_PROXY_URL`, nessa ordem de precedência. Relata um problema de configuração se nenhum proxy estiver habilitado e configurado; passe `--proxy-url` para uma verificação preliminar pontual sem alterar a configuração.

As URLs de proxy gerenciado usam `http://` para um listener de proxy de encaminhamento sem criptografia ou `https://` quando o OpenClaw precisa abrir uma conexão TLS com o próprio endpoint do proxy antes de enviar solicitações de proxy. Use `--proxy-ca-file` para confiar em uma CA privada nessa conexão TLS.

Por padrão, ele executa:

- uma verificação **permitida** em `https://example.com/` (substitua/adicione com `--allowed-url`, que pode ser repetida)
- uma verificação **negada** em um canário temporário de loopback (substitua com `--denied-url`, que pode ser repetida)

Os destinos personalizados de `--denied-url` adotam falha fechada: tanto respostas HTTP quanto falhas de transporte ambíguas contam como falhas, a menos que você possa verificar de forma independente um sinal de negação específico da implantação. O canário de loopback integrado é o único destino em que um erro de transporte é tratado como prova de bloqueio.

Adicione `--apns-reachable` para também abrir um túnel CONNECT HTTP/2 do APNs por meio do proxy e confirmar que o APNs de sandbox responde. A sondagem envia intencionalmente um token de provedor inválido; portanto, uma resposta `403 InvalidProviderToken` do APNs conta como um sinal de acessibilidade bem-sucedido (não como uma falha).

### Opções

| Sinalizador              | Efeito                                                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `--json`                 | imprime JSON legível por máquina                                                                                                 |
| `--proxy-url <url>`      | valida esta URL de proxy `http://`/`https://` em vez da configuração ou variável de ambiente                                     |
| `--proxy-ca-file <path>` | confia neste arquivo de CA PEM para a verificação TLS de um endpoint de proxy HTTPS                                               |
| `--allowed-url <url>`    | destino que deve ser acessado com sucesso por meio do proxy (pode ser repetida)                                                   |
| `--denied-url <url>`     | destino que deve ser bloqueado pelo proxy (pode ser repetida)                                                                    |
| `--apns-reachable`       | também verifica se o APNs HTTP/2 de sandbox está acessível por meio do proxy                                                      |
| `--apns-authority <url>` | autoridade do APNs a sondar (padrão: `https://api.sandbox.push.apple.com`; produção: `https://api.push.apple.com`)                |
| `--timeout-ms <ms>`      | tempo limite por solicitação                                                                                                     |

Encerra com o código 1 quando a configuração do proxy ou as verificações de destino falham.

Consulte [Proxy de rede](/pt-BR/security/network-proxy) para obter orientações de implantação e informações sobre a semântica de negação.

## Proxy de depuração

`start` inicia um proxy local com captura e imprime sua URL, o caminho do certificado da CA e o caminho do banco de dados de captura; interrompa com Ctrl+C. Por padrão, associa-se a `127.0.0.1`, a menos que `--host` seja definido.

`run` inicia um proxy de depuração local e, em seguida, executa `<cmd...>` (após `--`) com as variáveis de ambiente do proxy aplicadas, em sua própria sessão de captura.

O encaminhamento upstream direto do proxy de depuração abre soquetes upstream para diagnóstico. Quando o modo de proxy gerenciado do OpenClaw está ativo, o encaminhamento direto de solicitações de proxy e túneis CONNECT fica desabilitado por padrão; defina `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1` somente para diagnósticos locais aprovados.

`coverage` imprime um relatório JSON (`summary` + `entries` por transporte) indicando quais transportes são capturados, funcionam somente por proxy ou não têm cobertura.

`sessions` lista as sessões de captura recentes (`--limit`, padrão 20).

`query --preset <name>` executa uma consulta integrada no tráfego capturado, opcionalmente restrita a `--session <id>`. Predefinições:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

`blob --id <blobId>` imprime o conteúdo bruto de um blob de payload capturado.

`purge` exclui todos os metadados e blobs do tráfego capturado. As capturas são dados locais de depuração; exclua-as quando terminar.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Proxy de rede](/pt-BR/security/network-proxy)
- [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
