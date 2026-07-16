---
read_when:
    - Você quer emparelhar rapidamente um aplicativo de Node móvel com um Gateway
    - Você precisa da saída do código de configuração para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar QR de pareamento móvel + código de configuração)
title: QR
x-i18n:
    generated_at: "2026-07-16T12:22:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Gere um código QR de pareamento móvel e um código de configuração usando a configuração atual do Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Os aplicativos oficiais do OpenClaw para iOS e Android se conectam automaticamente quando os metadados do código de configuração correspondem. Se uma solicitação permanecer pendente (por exemplo, para um cliente não oficial ou com metadados incompatíveis), revise-a e aprove-a:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opções

- `--remote`: dá preferência a `gateway.remote.url`; usa `gateway.tailscale.mode=serve|funnel` como alternativa se essa URL não estiver definida. Ignora `device-pair` do Plugin `publicUrl`.
- `--url <url>`: substitui a URL do gateway usada na carga útil
- `--public-url <url>`: substitui a URL pública usada na carga útil
- `--token <token>`: substitui o token do gateway no qual o fluxo de bootstrap se autentica
- `--password <password>`: substitui a senha do gateway com a qual o fluxo de bootstrap se autentica
- `--limited`: omite o acesso administrativo ao Gateway do token de operador transferido
- `--setup-code-only`: exibe apenas o código de configuração
- `--no-ascii`: ignora a renderização do código QR em ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` opcional, `auth`, `access`, `accessDowngraded` opcional, `urlSource`)

`--token` e `--password` são mutuamente exclusivos.

## Conteúdo do código de configuração

O código de configuração contém um `bootstrapToken` opaco e de curta duração, não o token/senha compartilhado do gateway. Para um endpoint `wss://` (ou loopback no mesmo host), o fluxo de bootstrap padrão emite:

- um token `node` primário com `scopes: []`
- um token de transferência `operator` completo para dispositivos móveis nativos com `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`

Use `--limited` para manter o mesmo token do nó, omitindo `operator.admin` da transferência para o operador. O escopo de mutação de pareamento nunca é transferido por um código de configuração.

A configuração de `ws://` em texto simples na LAN continua disponível, mas o OpenClaw usa automaticamente
o perfil limitado porque um observador da rede poderia capturar o token de
bootstrap do portador e antecipar seu uso. Configure `wss://` ou o Tailscale Serve e gere um novo código
para obter acesso completo.

## Resolução da URL do Gateway

O pareamento móvel falha de forma segura para URLs de gateway `ws://` públicas/do Tailscale: use o Tailscale Serve/Funnel ou uma URL de gateway `wss://` nesses casos. Endereços privados de LAN e hosts Bonjour `.local` continuam compatíveis por `ws://` simples, com acesso limitado do operador conforme descrito acima.

Quando a URL selecionada do Gateway vem de `gateway.bind=lan`, o OpenClaw também verifica rotas `tailscale serve status --json` persistentes. Qualquer raiz HTTPS do Serve que encaminhe por proxy para a porta de loopback do Gateway ativo é incluída como alternativa. O comando QR adiciona essa alternativa apenas para `lan`; `custom` e `tailnet` mantêm suas rotas anunciadas explicitamente. Os clientes iOS atuais testam as rotas anunciadas na ordem e salvam a primeira que estiver acessível; o campo legado `url` permanece inalterado para clientes mais antigos.

Com `--remote`, é obrigatório fornecer `gateway.remote.url` ou `gateway.tailscale.mode=serve|funnel`.

## Resolução de autenticação (sem `--remote`)

Quando nenhuma substituição de autenticação da CLI é fornecida, as SecretRefs de autenticação do gateway local são resolvidas da seguinte forma:

| Condição                                                                                                                    | Resolve para                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"`, ou modo inferido sem uma fonte de senha prevalecente                                                | `gateway.auth.token`                      |
| `gateway.auth.mode="password"`, ou modo inferido sem um token prevalecente da autenticação/do ambiente                                         | `gateway.auth.password`                   |
| `gateway.auth.token` e `gateway.auth.password` estão configurados (incluindo SecretRefs) e `gateway.auth.mode` não está definido | falha; defina `gateway.auth.mode` explicitamente |

## Resolução de autenticação (`--remote`)

Se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e nem `--token` nem `--password` forem fornecidos, o comando as resolverá a partir do snapshot ativo do gateway. Se o gateway estiver indisponível, o comando falhará imediatamente.

<Note>
Este caminho de comando requer um gateway compatível com o método RPC `secrets.resolve`. Gateways mais antigos retornam um erro de método desconhecido.
</Note>

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Dispositivos](/pt-BR/cli/devices)
- [Pareamento](/pt-BR/cli/pairing)
