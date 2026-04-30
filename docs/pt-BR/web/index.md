---
read_when:
    - Você quer acessar o Gateway pelo Tailscale
    - Você quer a interface de controle no navegador e edição de configuração
summary: 'Superfícies web do Gateway: interface de controle, modos de bind e segurança'
title: Web
x-i18n:
    generated_at: "2026-04-30T10:14:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

O Gateway serve uma pequena **Interface de Controle no navegador** (Vite + Lit) pela mesma porta que o WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- com `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Os recursos ficam em [Interface de Controle](/pt-BR/web/control-ui). O restante desta página se concentra em modos de bind, segurança e superfícies expostas à web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de webhook no mesmo servidor HTTP.
Consulte [configuração do Gateway](/pt-BR/gateway/configuration) → `hooks` para autenticação + payloads.

## Configuração (ativada por padrão)

A Interface de Controle fica **ativada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la pela configuração:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acesso via Tailscale

### Serve integrado (recomendado)

Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy dele:

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

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Em seguida, inicie o gateway (este exemplo sem loopback usa autenticação por token
de segredo compartilhado):

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

## Notas de segurança

- A autenticação do Gateway é exigida por padrão (token, senha, trusted-proxy ou cabeçalhos de identidade do Tailscale Serve quando ativados).
- Binds sem loopback ainda **exigem** autenticação do gateway. Na prática, isso significa autenticação por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente cria autenticação por segredo compartilhado por padrão e geralmente gera um
  token de gateway (mesmo em loopback).
- No modo de segredo compartilhado, a UI envia `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Quando `gateway.tls.enabled: true`, o dashboard local e os auxiliares de status renderizam
  URLs de dashboard `https://` e URLs de WebSocket `wss://`.
- Em modos com identidade, como Tailscale Serve ou `trusted-proxy`, a
  verificação de autenticação do WebSocket é satisfeita pelos cabeçalhos da solicitação.
- Para implantações da Interface de Controle sem loopback, defina `gateway.controlUi.allowedOrigins`
  explicitamente (origens completas). Sem isso, a inicialização do gateway é recusada por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ativa
  o modo de fallback de origem pelo cabeçalho Host, mas é uma redução perigosa de segurança.
- Com Serve, os cabeçalhos de identidade do Tailscale podem satisfazer a autenticação da Interface de Controle/WebSocket
  quando `gateway.auth.allowTailscale` é `true` (sem necessidade de token/senha).
  Endpoints de API HTTP não usam esses cabeçalhos de identidade do Tailscale; eles seguem
  o modo normal de autenticação HTTP do gateway. Defina
  `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Consulte
  [Tailscale](/pt-BR/gateway/tailscale) e [Segurança](/pt-BR/gateway/security). Este
  fluxo sem token pressupõe que o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (senha compartilhada).

## Construindo a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Construa-os com:

```bash
pnpm ui:build
```
