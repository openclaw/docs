---
read_when:
    - Você quer acessar o Gateway via Tailscale
    - Você quer a UI de Controle no navegador e edição de configuração
summary: 'Superfícies web do Gateway: UI de Controle, modos de bind e segurança'
title: Web
x-i18n:
    generated_at: "2026-04-24T06:20:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

O Gateway serve uma pequena **UI de Controle** no navegador (Vite + Lit) pela mesma porta do WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Os recursos ficam em [UI de Controle](/pt-BR/web/control-ui).
Esta página se concentra em modos de bind, segurança e superfícies voltadas para a web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de Webhook no mesmo servidor HTTP.
Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) → `hooks` para autenticação + payloads.

## Configuração (habilitada por padrão)

A UI de Controle fica **habilitada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la via configuração:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Acesso via Tailscale

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

Depois inicie o gateway (este exemplo sem loopback usa autenticação por token
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

## Observações de segurança

- A autenticação do Gateway é exigida por padrão (token, senha, trusted-proxy ou headers de identidade do Tailscale Serve quando habilitados).
- Binds sem loopback ainda **exigem** autenticação do gateway. Na prática, isso significa autenticação por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente cria autenticação por segredo compartilhado por padrão e normalmente gera um
  token do gateway (mesmo em loopback).
- No modo de segredo compartilhado, a UI envia `connect.params.auth.token` ou
  `connect.params.auth.password`.
- Em modos com identidade, como Tailscale Serve ou `trusted-proxy`, a
  verificação de autenticação do WebSocket é satisfeita pelos headers da requisição.
- Para implantações da UI de Controle sem loopback, defina `gateway.controlUi.allowedOrigins`
  explicitamente (origins completos). Sem isso, a inicialização do gateway é recusada por padrão.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita
  o modo de fallback de origin pelo header Host, mas isso é um rebaixamento perigoso de segurança.
- Com Serve, headers de identidade do Tailscale podem satisfazer a autenticação da UI de Controle/WebSocket
  quando `gateway.auth.allowTailscale` for `true` (sem necessidade de token/senha).
  Endpoints da API HTTP não usam esses headers de identidade do Tailscale; eles seguem
  o modo normal de autenticação HTTP do gateway. Defina
  `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Consulte
  [Tailscale](/pt-BR/gateway/tailscale) e [Security](/pt-BR/gateway/security). Esse
  fluxo sem token pressupõe que o host do gateway seja confiável.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (senha compartilhada).

## Construindo a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```
