---
read_when:
    - Você quer acessar o Gateway pelo Tailscale
    - Você quer a interface de controle no navegador e a edição de configurações
summary: 'Superfícies web do Gateway: interface de controle, modos de vinculação e segurança'
title: Web
x-i18n:
    generated_at: "2026-07-12T15:44:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

O Gateway disponibiliza uma pequena **interface de controle no navegador** (Vite + Lit) na mesma porta que o WebSocket do Gateway:

- padrão: `http://<host>:18789/`
- com `gateway.tls.enabled: true`: `https://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Os recursos estão descritos em [Interface de controle](/pt-BR/web/control-ui). Esta página aborda modos de vinculação, segurança e outras superfícies voltadas para a web.

## Configuração (ativada por padrão)

A interface de controle é **ativada por padrão** quando os ativos estão presentes (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcional
  },
}
```

## Webhooks

Quando `hooks.enabled=true`, o Gateway também expõe um endpoint de Webhook no mesmo servidor HTTP. Consulte `hooks` na [referência de configuração do Gateway](/pt-BR/gateway/configuration-reference#hooks) para obter informações sobre autenticação e cargas úteis.

## RPC HTTP administrativo

`POST /api/v1/admin/rpc` expõe métodos selecionados do plano de controle do Gateway por HTTP. Desativado por padrão; é registrado somente quando o plugin `admin-http-rpc` está ativado. Consulte [RPC HTTP administrativo](/pt-BR/plugins/admin-http-rpc) para conhecer o modelo de autenticação, os métodos permitidos e a comparação com a API WebSocket.

## Acesso pelo Tailscale

<Tabs>
  <Tab title="Serve integrado (recomendado)">
    Mantenha o Gateway em loopback e permita que o Tailscale Serve faça o proxy:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Inicie o Gateway:

    ```bash
    openclaw gateway
    ```

    Abra `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado).

  </Tab>
  <Tab title="Vinculação à tailnet + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Inicie o Gateway (este exemplo sem loopback usa autenticação por token de segredo compartilhado):

    ```bash
    openclaw gateway
    ```

    Abra `http://<tailscale-ip>:18789/` (ou o `gateway.controlUi.basePath` configurado).

  </Tab>
  <Tab title="Internet pública (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // ou OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` requer `gateway.auth.mode: "password"`; tanto o Serve quanto o Funnel requerem `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Observações de segurança

- A autenticação do Gateway é obrigatória por padrão: token, senha, proxy confiável ou, quando ativados, cabeçalhos de identidade do Tailscale Serve.
- Vinculações que não sejam de loopback ainda **exigem** autenticação do Gateway: autenticação por token/senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- O assistente de integração cria autenticação por segredo compartilhado por padrão e geralmente gera um token do Gateway, mesmo em loopback.
- No modo de segredo compartilhado, a interface envia `connect.params.auth.token` ou `connect.params.auth.password` durante o handshake do WebSocket.
- Com `gateway.tls.enabled: true`, os auxiliares locais de painel/status renderizam URLs `https://` e URLs de WebSocket `wss://`.
- Em modos que fornecem identidade (Tailscale Serve, `trusted-proxy`), a verificação de autenticação do WebSocket é satisfeita pelos cabeçalhos da solicitação, em vez de um segredo compartilhado.
- Para implantações públicas da interface de controle que não sejam de loopback, defina `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de mesma origem são aceitos sem essa opção para hosts de loopback, RFC1918/link-local, `.local`, `.ts.net` e CGNAT do Tailscale.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` ativa o fallback de origem pelo cabeçalho Host; isso representa uma redução perigosa da segurança.
- Com o Serve, os cabeçalhos de identidade do Tailscale satisfazem a autenticação da interface de controle/WebSocket quando `gateway.auth.allowTailscale: true` (nenhum token ou senha é necessário). Os endpoints da API HTTP não usam os cabeçalhos de identidade do Tailscale; eles sempre seguem o modo normal de autenticação HTTP do Gateway. Defina `gateway.auth.allowTailscale: false` para exigir credenciais explícitas mesmo pelo Serve. Esse fluxo sem token pressupõe que o próprio host do Gateway seja confiável. Consulte [Tailscale](/pt-BR/gateway/tailscale) e [Segurança](/pt-BR/gateway/security).

## Compilação da interface

O Gateway disponibiliza arquivos estáticos de `dist/control-ui`:

```bash
pnpm ui:build
```
