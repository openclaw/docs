---
read_when:
    - Você quer parear rapidamente um app de nó móvel com um Gateway
    - Você precisa da saída de setup-code para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar código QR de pareamento móvel + código de configuração)
title: QR
x-i18n:
    generated_at: "2026-05-06T05:49:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Gere um QR de pareamento móvel e um código de configuração a partir da configuração atual do seu Gateway.

## Uso

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opções

- `--remote`: prefere `gateway.remote.url`; se não estiver definido, `gateway.tailscale.mode=serve|funnel` ainda pode fornecer a URL pública remota
- `--url <url>`: substitui a URL do gateway usada no payload
- `--public-url <url>`: substitui a URL pública usada no payload
- `--token <token>`: substitui contra qual token do gateway o fluxo de bootstrap autentica
- `--password <password>`: substitui contra qual senha do gateway o fluxo de bootstrap autentica
- `--setup-code-only`: imprime apenas o código de configuração
- `--no-ascii`: ignora a renderização ASCII do QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Notas

- `--token` e `--password` são mutuamente exclusivos.
- O próprio código de configuração agora carrega um `bootstrapToken` opaco e de curta duração, não o token/senha compartilhado do gateway.
- No fluxo de bootstrap integrado de nó/operador, o token principal do nó ainda fica com `scopes: []`.
- Se a transferência de bootstrap também emitir um token de operador, ele permanece limitado à lista de permissões de bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- As verificações de escopo de bootstrap são prefixadas por função. Essa lista de permissões de operador satisfaz apenas solicitações de operador; funções que não são de operador ainda precisam de escopos sob seu próprio prefixo de função.
- O pareamento móvel falha fechado para URLs de gateway `ws://` públicas/Tailscale. Endereços de LAN privada e hosts Bonjour `.local` continuam compatíveis por `ws://`, mas rotas móveis públicas/Tailscale devem usar Tailscale Serve/Funnel ou uma URL de gateway `wss://`.
- Com `--remote`, o OpenClaw exige `gateway.remote.url` ou
  `gateway.tailscale.mode=serve|funnel`.
- Com `--remote`, se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` ou `--password`, o comando as resolve a partir do snapshot ativo do gateway. Se o gateway estiver indisponível, o comando falha rapidamente.
- Sem `--remote`, SecretRefs de autenticação do gateway local são resolvidos quando nenhuma substituição de autenticação da CLI é passada:
  - `gateway.auth.token` é resolvido quando a autenticação por token pode vencer (`gateway.auth.mode="token"` explícito ou modo inferido em que nenhuma fonte de senha vence).
  - `gateway.auth.password` é resolvido quando a autenticação por senha pode vencer (`gateway.auth.mode="password"` explícito ou modo inferido sem token vencedor de auth/env).
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do código de configuração falhará até que o modo seja definido explicitamente.
- Observação sobre divergência de versão do Gateway: este caminho de comando exige um gateway compatível com `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Após escanear, aprove o pareamento do dispositivo com:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Pareamento](/pt-BR/cli/pairing)
