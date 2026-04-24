---
read_when:
    - Expondo a Control UI do Gateway fora do localhost
    - Automatizando o acesso ao painel na tailnet ou publicamente
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T05:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (painel do Gateway)

O OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o
painel do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto
o Tailscale fornece HTTPS, roteamento e (para Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve apenas para Tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: Padrão (sem automação Tailscale).

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (apenas ingress privado)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso com reconhecimento de identidade; consulte [Autenticação de Trusted Proxy](/pt-BR/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`,
a autenticação da Control UI/WebSocket pode usar cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) sem fornecer token/senha. O OpenClaw verifica
a identidade resolvendo o endereço `x-forwarded-for` via o daemon local do Tailscale
(`tailscale whois`) e comparando-o com o cabeçalho antes de aceitá-lo.
O OpenClaw só trata uma solicitação como Serve quando ela chega do loopback com os
cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o
modo normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão,
ou uma configuração intencional de `trusted-proxy` / `none` com ingress privado.
Esse fluxo sem token pressupõe que o host do gateway é confiável. Se código local não confiável
puder ser executado no mesmo host, desabilite `gateway.auth.allowTailscale` e exija
autenticação por token/senha em vez disso.
Para exigir credenciais explícitas por segredo compartilhado, defina `gateway.auth.allowTailscale: false`
e use `gateway.auth.mode: "token"` ou `"password"`.

## Exemplos de configuração

### Apenas Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abra: `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Apenas Tailnet (bind ao IP da Tailnet)

Use isto quando quiser que o Gateway escute diretamente no IP da Tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se de outro dispositivo na Tailnet:

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

Prefira `OPENCLAW_GATEWAY_PASSWORD` em vez de gravar uma senha em disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Observações

- O Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e com login feito.
- `tailscale.mode: "funnel"` se recusa a iniciar, a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração de `tailscale serve`
  ou `tailscale funnel` no encerramento.
- `gateway.bind: "tailnet"` é um bind direto na Tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser apenas Tailnet.
- Serve/Funnel expõem apenas a **UI + WS do Gateway**. Nodes se conectam pelo
  mesmo endpoint WS do Gateway, então o Serve pode funcionar para acesso de Node.

## Controle de browser (Gateway remoto + browser local)

Se você executa o Gateway em uma máquina, mas quer controlar um browser em outra máquina,
execute um **host de Node** na máquina do browser e mantenha ambas na mesma tailnet.
O Gateway fará proxy das ações do browser para o node; nenhum servidor de controle separado ou URL Serve é necessário.

Evite Funnel para controle de browser; trate o pareamento de Node como acesso de operador.

## Pré-requisitos + limites do Tailscale

- O Serve exige HTTPS habilitado para sua tailnet; a CLI solicita isso se estiver ausente.
- O Serve injeta cabeçalhos de identidade do Tailscale; o Funnel não.
- O Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de node com funnel.
- O Funnel só oferece suporte às portas `443`, `8443` e `10000` sobre TLS.
- O Funnel no macOS exige a variante de app open-source do Tailscale.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Discovery](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
