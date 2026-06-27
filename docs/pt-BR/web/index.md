---
read_when:
    - Você quer acessar o Gateway pelo Tailscale
    - Você quer a UI de Controle no navegador e a edição de configuração
summary: 'Superfícies web do Gateway: UI de Controle, modos de vinculação e segurança'
title: Web
x-i18n:
    generated_at: "2026-06-27T18:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

O Gateway serve uma pequena **UI de controle no navegador** (Vite + Lit) na mesma porta que o WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- com `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Os recursos estão em [UI de controle](/pt-BR/web/control-ui). O restante desta página se concentra em modos de vinculação, segurança e superfícies expostas à web.

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um pequeno endpoint de webhook no mesmo servidor HTTP.
Consulte [Configuração do Gateway](/pt-BR/gateway/configuration) → `hooks` para autenticação + payloads.

## RPC HTTP de administração

O RPC HTTP de administração expõe métodos selecionados do plano de controle do Gateway em `POST /api/v1/admin/rpc`.
Ele fica desativado por padrão e é registrado somente quando o plugin `admin-http-rpc` está habilitado.
Consulte [RPC HTTP de administração](/pt-BR/plugins/admin-http-rpc) para o modelo de autenticação, os métodos permitidos e a comparação com WebSocket.

## Configuração (ativada por padrão)

A UI de controle é **habilitada por padrão** quando os assets estão presentes (`dist/control-ui`).
Você pode controlá-la via configuração:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Acesso via Tailscale

### Serve integrado (recomendado)

Mantenha o Gateway no loopback e deixe o Tailscale Serve fazer proxy dele:

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

- `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Vínculo de Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Depois inicie o gateway (este exemplo sem loopback usa autenticação por token de segredo compartilhado):

```bash
openclaw gateway
```

Abra:

- `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

### Internet pública (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Observações de segurança

- A autenticação do Gateway é exigida por padrão (token, senha, proxy confiável ou cabeçalhos de identidade do Tailscale Serve quando habilitados).
- Vínculos sem loopback ainda **exigem** autenticação do gateway. Na prática, isso significa autenticação por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente cria autenticação por segredo compartilhado por padrão e geralmente gera um token do gateway (mesmo em loopback).
- No modo de segredo compartilhado, a UI envia `connect.params.auth.token` ou `connect.params.auth.password`.
- Quando `gateway.tls.enabled: true`, o dashboard local e os auxiliares de status renderizam URLs do dashboard com `https://` e URLs de WebSocket com `wss://`.
- Em modos com identidade, como Tailscale Serve ou `trusted-proxy`, a verificação de autenticação do WebSocket é satisfeita pelos cabeçalhos da requisição.
- Para implantações públicas sem loopback da UI de controle, defina `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de LAN/Tailnet na mesma origem são aceitos para loopback, RFC1918/link-local, `.local`, `.ts.net` e hosts CGNAT do Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem por cabeçalho Host, mas é uma degradação de segurança perigosa.
- Com Serve, os cabeçalhos de identidade do Tailscale podem satisfazer a autenticação da UI de controle/WebSocket quando `gateway.auth.allowTailscale` é `true` (sem necessidade de token/senha). Endpoints de API HTTP não usam esses cabeçalhos de identidade do Tailscale; eles seguem o modo normal de autenticação HTTP do gateway. Defina `gateway.auth.allowTailscale: false` para exigir credenciais explícitas. Consulte [Tailscale](/pt-BR/gateway/tailscale) e [Segurança](/pt-BR/gateway/security). Este fluxo sem token pressupõe que o host do gateway é confiável.
- `gateway.tailscale.mode: "funnel"` exige `gateway.auth.mode: "password"` (senha compartilhada).

## Como criar a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Crie-os com:

```bash
pnpm ui:build
```
