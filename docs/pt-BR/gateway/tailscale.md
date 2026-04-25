---
read_when:
    - Expondo a Control UI do Gateway fora do localhost
    - Automatizando o acesso ao painel pela tailnet ou público
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:48:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

O OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para a
dashboard do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto o
Tailscale fornece HTTPS, roteamento e (para Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve somente para a tailnet via `tailscale serve`. O gateway continua em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: padrão (sem automação do Tailscale).

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (somente ingresso privado)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso com reconhecimento de identidade; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`,
a autenticação da Control UI/WebSocket pode usar cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) sem fornecer token/senha. O OpenClaw verifica
a identidade resolvendo o endereço `x-forwarded-for` por meio do daemon local do Tailscale
(`tailscale whois`) e comparando-o com o cabeçalho antes de aceitá-lo.
O OpenClaw só trata uma solicitação como Serve quando ela chega por loopback com
os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.
Endpoints de API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles continuam seguindo o
modo normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão, ou uma configuração
intencional de `trusted-proxy` / `none` com ingresso privado.
Esse fluxo sem token pressupõe que o host do gateway é confiável. Se código local não confiável
puder ser executado no mesmo host, desabilite `gateway.auth.allowTailscale` e exija
autenticação por token/senha em vez disso.
Para exigir credenciais explícitas por segredo compartilhado, defina `gateway.auth.allowTailscale: false`
e use `gateway.auth.mode: "token"` ou `"password"`.

## Exemplos de configuração

### Somente tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abra: `https://<magicdns>/` (ou o seu `gateway.controlUi.basePath` configurado)

### Somente tailnet (bind no IP da tailnet)

Use isso quando quiser que o Gateway escute diretamente no IP da tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se a partir de outro dispositivo da tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Observação: loopback (`http://127.0.0.1:18789`) **não** funcionará nesse modo.

### Internet pública (Funnel + senha compartilhada)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Prefira `OPENCLAW_GATEWAY_PASSWORD` a gravar uma senha no disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Observações

- Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e autenticada.
- `tailscale.mode: "funnel"` se recusa a iniciar a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração de `tailscale serve`
  ou `tailscale funnel` ao encerrar.
- `gateway.bind: "tailnet"` é um bind direto na tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser somente tailnet.
- Serve/Funnel expõem apenas a **Control UI + WS** do Gateway. Nós se conectam pelo
  mesmo endpoint WS do Gateway, então o Serve pode funcionar para acesso de nós.

## Controle de navegador (Gateway remoto + navegador local)

Se você executa o Gateway em uma máquina, mas quer controlar um navegador em outra máquina,
execute um **host Node** na máquina do navegador e mantenha ambos na mesma tailnet.
O Gateway encaminhará ações do navegador para o nó; não é necessário servidor de controle separado nem URL de Serve.

Evite Funnel para controle de navegador; trate o pareamento de nós como acesso de operador.

## Pré-requisitos + limites do Tailscale

- Serve exige HTTPS habilitado para sua tailnet; a CLI solicita isso se estiver ausente.
- Serve injeta cabeçalhos de identidade do Tailscale; Funnel não.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de nó funnel.
- Funnel oferece suporte apenas às portas `443`, `8443` e `10000` sobre TLS.
- Funnel no macOS exige a variante de app Tailscale de código aberto.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Discovery](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
