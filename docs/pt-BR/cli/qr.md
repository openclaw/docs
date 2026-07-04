---
read_when:
    - Você quer parear rapidamente um app de nó móvel com um gateway
    - Você precisa da saída de código de configuração para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar QR de pareamento móvel + código de configuração)
title: QR
x-i18n:
    generated_at: "2026-07-04T17:53:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
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

- `--remote`: prefere `gateway.remote.url`; se ele não estiver definido, `gateway.tailscale.mode=serve|funnel` ainda pode fornecer a URL pública remota
- `--url <url>`: substitui a URL do gateway usada no payload
- `--public-url <url>`: substitui a URL pública usada no payload
- `--token <token>`: substitui qual token do gateway o fluxo de bootstrap autentica
- `--password <password>`: substitui qual senha do gateway o fluxo de bootstrap autentica
- `--setup-code-only`: imprime apenas o código de configuração
- `--no-ascii`: ignora a renderização de QR em ASCII
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Observações

- `--token` e `--password` são mutuamente exclusivos.
- O próprio código de configuração agora carrega um `bootstrapToken` opaco e de curta duração, não o token/senha compartilhado do gateway.
- O bootstrap de código de configuração integrado retorna um token `node` primário com `scopes: []`, além de um token de repasse `operator` limitado para onboarding móvel confiável.
- O token de operador repassado é limitado a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`; escopos de mutação de pareamento e `operator.admin` ainda exigem um pareamento de operador aprovado separado ou fluxo de token.
- O pareamento móvel falha de forma fechada para URLs de gateway `ws://` públicas/Tailscale. Endereços de LAN privada e hosts Bonjour `.local` continuam compatíveis por `ws://`, mas rotas móveis públicas/Tailscale devem usar Tailscale Serve/Funnel ou uma URL de gateway `wss://`.
- Com `--remote`, o OpenClaw exige `gateway.remote.url` ou
  `gateway.tailscale.mode=serve|funnel`.
- Com `--remote`, se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` ou `--password`, o comando as resolve a partir do snapshot ativo do gateway. Se o gateway estiver indisponível, o comando falha rapidamente.
- Sem `--remote`, SecretRefs de autenticação do gateway local são resolvidas quando nenhuma substituição de autenticação da CLI é passada:
  - `gateway.auth.token` é resolvido quando a autenticação por token pode vencer (`gateway.auth.mode="token"` explícito ou modo inferido em que nenhuma fonte de senha vence).
  - `gateway.auth.password` é resolvido quando a autenticação por senha pode vencer (`gateway.auth.mode="password"` explícito ou modo inferido sem token vencedor vindo de auth/env).
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do código de configuração falha até que o modo seja definido explicitamente.
- Observação sobre divergência de versão do Gateway: este caminho de comando exige um gateway compatível com `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Os apps oficiais do OpenClaw para iOS e Android se conectam automaticamente quando seus
  metadados de código de configuração correspondem. Se uma solicitação permanecer pendente (por exemplo, para um
  cliente não oficial ou metadados incompatíveis), revise e aprove-a com:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Pareamento](/pt-BR/cli/pairing)
