---
read_when:
    - Você quer parear rapidamente um aplicativo Node móvel com um gateway
    - Você precisa da saída de código de configuração para compartilhamento remoto/manual
summary: Referência da CLI para `openclaw qr` (gerar QR de pareamento móvel + código de configuração)
title: QR
x-i18n:
    generated_at: "2026-04-24T05:46:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
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

- `--remote`: prefere `gateway.remote.url`; se ele não estiver definido, `gateway.tailscale.mode=serve|funnel` ainda poderá fornecer a URL pública remota
- `--url <url>`: sobrescreve a URL do gateway usada na carga útil
- `--public-url <url>`: sobrescreve a URL pública usada na carga útil
- `--token <token>`: sobrescreve contra qual token do gateway o fluxo de bootstrap autentica
- `--password <password>`: sobrescreve contra qual senha do gateway o fluxo de bootstrap autentica
- `--setup-code-only`: imprime apenas o código de configuração
- `--no-ascii`: ignora a renderização ASCII do QR
- `--json`: emite JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Observações

- `--token` e `--password` são mutuamente exclusivos.
- O próprio código de configuração agora carrega um `bootstrapToken` opaco e de curta duração, não o token/senha compartilhado do gateway.
- No fluxo de bootstrap interno de node/operator, o token principal do Node ainda chega com `scopes: []`.
- Se a transferência de bootstrap também emitir um token de operador, ele permanece limitado à allowlist de bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Verificações de escopo de bootstrap usam prefixo de papel. Essa allowlist de operador só satisfaz solicitações de operador; papéis que não sejam de operador ainda precisam de escopos sob o próprio prefixo de papel.
- O pareamento móvel falha em modo fail-closed para URLs de gateway `ws://` em Tailscale/públicas. `ws://` de LAN privada continua compatível, mas rotas móveis Tailscale/públicas devem usar Tailscale Serve/Funnel ou uma URL de gateway `wss://`.
- Com `--remote`, o OpenClaw exige `gateway.remote.url` ou
  `gateway.tailscale.mode=serve|funnel`.
- Com `--remote`, se credenciais remotas efetivamente ativas estiverem configuradas como SecretRefs e você não passar `--token` ou `--password`, o comando as resolve a partir do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falha rapidamente.
- Sem `--remote`, SecretRefs locais de autenticação do gateway são resolvidos quando nenhuma sobrescrita de autenticação via CLI é passada:
  - `gateway.auth.token` é resolvido quando a autenticação por token pode prevalecer (modo explícito `gateway.auth.mode="token"` ou modo inferido em que nenhuma fonte de senha prevalece).
  - `gateway.auth.password` é resolvido quando a autenticação por senha pode prevalecer (modo explícito `gateway.auth.mode="password"` ou modo inferido sem token vencedor de auth/env).
- Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados (incluindo SecretRefs) e `gateway.auth.mode` não estiver definido, a resolução do código de configuração falha até que o modo seja definido explicitamente.
- Observação sobre diferença de versão do Gateway: este caminho de comando exige um gateway que ofereça suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- Após escanear, aprove o pareamento do dispositivo com:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Pareamento](/pt-BR/cli/pairing)
