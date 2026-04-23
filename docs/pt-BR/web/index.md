---
read_when:
    - Você quer acessar o Gateway por Tailscale
    - Você quer a Control UI no navegador e edição de configuração
summary: 'Superfícies web do Gateway: Control UI, modos de bind e segurança'
title: Web
x-i18n:
    generated_at: "2026-04-23T14:09:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf1a173143782557ecd2e79b28694308709dc945700a509148856255d5cef773
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

O Gateway serve uma pequena **Control UI no navegador** (Vite + Lit) a partir da mesma porta do WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

As capacidades estão em [Control UI](/pt-BR/web/control-ui).
Esta página se concentra em modos de bind, segurança e superfícies voltadas para a web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de webhook no mesmo servidor HTTP.
Consulte [configuração do Gateway](/pt-BR/gateway/configuration) → `hooks` para autenticação + payloads.

## Configuração (ativado por padrão)

A Control UI fica **ativada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la via configuração:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acesso por Tailscale

### Serve integrado (recomendado)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy para ele:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Em seguida, inicie o gateway:

```bash
openclaw gateway
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

### Bind em tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Em seguida, inicie o gateway (este exemplo sem loopback usa autenticação
por token com segredo compartilhado):

```bash
openclaw gateway
```

Abra:

- `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado)

### Internet pública (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Observações de segurança

- A autenticação do Gateway é exigida por padrão (token, senha, trusted-proxy ou headers de identidade do Tailscale Serve quando ativados).
- Binds fora de loopback ainda **exigem** autenticação do gateway. Na prática, isso significa autenticação por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente cria autenticação por segredo compartilhado por padrão e geralmente gera um
  token de gateway (mesmo em loopback).
- No modo de segredo compartilhado, a UI envia `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Em modos com identidade, como Tailscale Serve ou `trusted-proxy`, a
  verificação de autenticação do WebSocket é satisfeita pelos headers da requisição.
- Para implantações da Control UI sem loopback, defina `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Sem isso, a inicialização do gateway é recusada por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem por cabeçalho Host, mas isso representa um rebaixamento perigoso de segurança.
- Com Serve, headers de identidade do Tailscale podem satisfazer a autenticação da Control UI/WebSocket
  quando `gateway.auth.allowTailscale` for `true` (sem necessidade de token/senha).
  Endpoints da API HTTP não usam esses headers de identidade do Tailscale; eles seguem
  o modo normal de autenticação HTTP do gateway. Defina
  `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Consulte
  [Tailscale](/pt-BR/gateway/tailscale) e [Security](/pt-BR/gateway/security). Esse
  fluxo sem token pressupõe que o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (senha compartilhada).

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```
