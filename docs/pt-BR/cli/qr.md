---
read_when:
    - Você quer parear rapidamente um app Node móvel com um Gateway
    - Você precisa da saída de setup-code para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar QR de pareamento móvel + código de configuração)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:21:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Gere um QR de pareamento móvel e um código de configuração a partir da sua configuração atual do Gateway.

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
- `--token <token>`: substitui qual token do gateway o fluxo de bootstrap usa para autenticação
- `--password <password>`: substitui qual senha do gateway o fluxo de bootstrap usa para autenticação
- `--setup-code-only`: imprime apenas o código de configuração
- `--no-ascii`: pula a renderização ASCII do QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Observações

- `--token` e `--password` são mutuamente exclusivos.
- O próprio código de configuração agora carrega um `bootstrapToken` opaco de curta duração, não o token/senha compartilhado do gateway.
- O bootstrap de código de configuração integrado retorna um token primário `node` com `scopes: []`, além de um token limitado de transferência `operator` para integração móvel confiável.
- O token de operador transferido é limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`; `operator.admin` e `operator.pairing` exigem um pareamento de operador aprovado separado ou um fluxo de token.
- O pareamento móvel falha fechado para URLs de gateway Tailscale/públicas `ws://`. Endereços de LAN privada e hosts Bonjour `.local` continuam com suporte por `ws://`, mas rotas móveis Tailscale/públicas devem usar Tailscale Serve/Funnel ou uma URL de gateway `wss://`.
- Com `--remote`, o OpenClaw exige `gateway.remote.url` ou
  `gateway.tailscale.mode=serve|funnel`.
- Com `--remote`, se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` nem `--password`, o comando as resolve a partir do snapshot ativo do gateway. Se o gateway estiver indisponível, o comando falha rapidamente.
- Sem `--remote`, SecretRefs de autenticação do gateway local são resolvidos quando nenhuma substituição de autenticação pela CLI é passada:
  - `gateway.auth.token` é resolvido quando a autenticação por token pode vencer (`gateway.auth.mode="token"` explícito ou modo inferido em que nenhuma fonte de senha vence).
  - `gateway.auth.password` é resolvido quando a autenticação por senha pode vencer (`gateway.auth.mode="password"` explícito ou modo inferido sem token vencedor vindo de auth/env).
- Se tanto `gateway.auth.token` quanto `gateway.auth.password` estiverem configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do código de configuração falhará até que o modo seja definido explicitamente.
- Observação sobre incompatibilidade de versão do Gateway: este caminho de comando exige um gateway com suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Após escanear, aprove o pareamento do dispositivo com:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Pareamento](/pt-BR/cli/pairing)
