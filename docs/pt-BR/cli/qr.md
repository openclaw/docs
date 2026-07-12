---
read_when:
    - Você quer emparelhar rapidamente um aplicativo Node para dispositivos móveis com um Gateway
    - Você precisa da saída do código de configuração para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar QR de pareamento móvel + código de configuração)
title: QR
x-i18n:
    generated_at: "2026-07-12T15:02:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Gere um QR de pareamento para dispositivos móveis e um código de configuração com base na configuração atual do Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Os aplicativos oficiais do OpenClaw para iOS e Android se conectam automaticamente quando os metadados do código de configuração correspondem. Se uma solicitação permanecer pendente (por exemplo, para um cliente não oficial ou devido a metadados incompatíveis), revise-a e aprove-a:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opções

- `--remote`: prioriza `gateway.remote.url`; recorre a `gateway.tailscale.mode=serve|funnel` se essa URL não estiver definida. Ignora `publicUrl` do Plugin `device-pair`.
- `--url <url>`: substitui a URL do gateway usada na carga útil
- `--public-url <url>`: substitui a URL pública usada na carga útil
- `--token <token>`: substitui o token do gateway usado para autenticação pelo fluxo de bootstrap
- `--password <password>`: substitui a senha do gateway usada para autenticação pelo fluxo de bootstrap
- `--setup-code-only`: exibe apenas o código de configuração
- `--no-ascii`: ignora a renderização do QR em ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opcional, `auth`, `urlSource`)

`--token` e `--password` são mutuamente exclusivos.

## Conteúdo do código de configuração

O código de configuração contém um `bootstrapToken` opaco e de curta duração, não o token nem a senha compartilhados do gateway. O fluxo de bootstrap integrado emite:

- um token `node` principal com `scopes: []`
- um token de transferência `operator` com escopo limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`

Os escopos de mutação de pareamento e `operator.admin` ainda exigem um fluxo separado e aprovado de pareamento ou token de operador.

## Resolução da URL do Gateway

O pareamento móvel falha de modo seguro para URLs `ws://` públicas ou do Tailscale: use o Tailscale Serve/Funnel ou uma URL `wss://` do gateway nesses casos. Endereços de LAN privada e hosts Bonjour `.local` continuam sendo compatíveis com `ws://` simples.

Quando a URL selecionada do Gateway vem de `gateway.bind=lan`, o OpenClaw também verifica rotas persistentes de `tailscale serve status --json`. Qualquer raiz HTTPS do Serve que encaminhe para a porta de loopback do Gateway ativo é incluída como alternativa. O comando QR adiciona essa alternativa somente para `lan`; `custom` e `tailnet` mantêm as rotas anunciadas explicitamente. Os clientes iOS atuais testam as rotas anunciadas na ordem e salvam a primeira acessível; o campo legado `url` permanece inalterado para clientes mais antigos.

Com `--remote`, é necessário definir `gateway.remote.url` ou `gateway.tailscale.mode=serve|funnel`.

## Resolução de autenticação (sem `--remote`)

Quando nenhuma substituição de autenticação é fornecida pela CLI, as SecretRefs de autenticação do gateway local são resolvidas da seguinte forma:

| Condição                                                                                                                     | Resolve para                              |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` ou modo inferido sem uma fonte de senha prevalecente                                             | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` ou modo inferido sem um token prevalecente da autenticação/do ambiente                        | `gateway.auth.password`                   |
| Tanto `gateway.auth.token` quanto `gateway.auth.password` estão configurados (incluindo SecretRefs) e `gateway.auth.mode` não está definido | falha; defina `gateway.auth.mode` explicitamente |

## Resolução de autenticação (`--remote`)

Se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e nem `--token` nem `--password` forem fornecidos, o comando as resolverá com base no snapshot ativo do gateway. Se o gateway estiver indisponível, o comando falhará imediatamente.

<Note>
Este caminho de comando requer um gateway compatível com o método RPC `secrets.resolve`. Gateways mais antigos retornam um erro de método desconhecido.
</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Dispositivos](/pt-BR/cli/devices)
- [Pareamento](/pt-BR/cli/pairing)
