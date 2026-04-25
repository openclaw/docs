---
read_when:
    - Você quer acessar o Gateway pelo Tailscale
    - Você quer a Control UI do navegador e edição de configuração
summary: 'Superfícies web do Gateway: Control UI, modos de bind e segurança'
title: Web
x-i18n:
    generated_at: "2026-04-25T13:59:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

O Gateway serve uma pequena **Control UI** de navegador (Vite + Lit) na mesma porta do WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- com `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo `/openclaw`)

Os recursos ficam em [Control UI](/pt-BR/web/control-ui).
Esta página foca em modos de bind, segurança e superfícies voltadas para a web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de webhook no mesmo servidor HTTP.
Consulte [Gateway configuration](/pt-BR/gateway/configuration) → `hooks` para autenticação + payloads.

## Configuração (ativada por padrão)

A Control UI fica **ativada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la por configuração:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acesso pelo Tailscale

### Serve integrado (recomendado)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer o proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Depois inicie o gateway:

```bash
openclaw gateway
```

Abra:

- `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

### Bind no tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Depois inicie o gateway (este exemplo sem loopback usa autenticação por token com segredo compartilhado):

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

- A autenticação do Gateway é exigida por padrão (token, senha, trusted-proxy ou cabeçalhos de identidade do Tailscale Serve quando ativados).
- Binds sem loopback ainda **exigem** autenticação do gateway. Na prática, isso significa autenticação por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente cria autenticação por segredo compartilhado por padrão e normalmente gera um token do gateway (mesmo em loopback).
- No modo de segredo compartilhado, a UI envia `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Quando `gateway.tls.enabled: true`, helpers locais de dashboard e status renderizam URLs do dashboard com `https://` e URLs do WebSocket com `wss://`.
- Em modos com identidade, como Tailscale Serve ou `trusted-proxy`, a
  verificação de autenticação do WebSocket é satisfeita a partir dos cabeçalhos da solicitação.
- Para implantações da Control UI sem loopback, defina `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Sem isso, a inicialização do gateway é recusada por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem por cabeçalho Host, mas é um rebaixamento perigoso de segurança.
- Com Serve, cabeçalhos de identidade do Tailscale podem satisfazer a autenticação da Control UI/WebSocket
  quando `gateway.auth.allowTailscale` é `true` (sem necessidade de token/senha).
  Endpoints da API HTTP não usam esses cabeçalhos de identidade do Tailscale; eles seguem
  o modo normal de autenticação HTTP do gateway. Defina
  `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Consulte
  [Tailscale](/pt-BR/gateway/tailscale) e [Security](/pt-BR/gateway/security). Esse
  fluxo sem token pressupõe que o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (senha compartilhada).

## Construindo a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Construa-os com:

```bash
pnpm ui:build
```
