---
read_when:
    - Expondo a UI de controle do Gateway fora do localhost
    - Automatizando o acesso à tailnet ou ao painel público
summary: Serve/Funnel do Tailscale integrado ao painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T09:51:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

O OpenClaw pode configurar automaticamente o **Serve** (tailnet) ou o **Funnel** (público) do Tailscale para o painel do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto o Tailscale fornece HTTPS, roteamento e (para Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve somente para tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: Padrão (sem automação do Tailscale).

A saída de status e auditoria usa **exposição do Tailscale** para este modo Serve/Funnel do OpenClaw. `off` significa que o OpenClaw não está gerenciando Serve nem Funnel; isso não significa que o daemon local do Tailscale está parado ou desconectado.

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (entrada privada somente)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso com reconhecimento de identidade; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`, a autenticação da UI de Controle/WebSocket pode usar cabeçalhos de identidade do Tailscale (`tailscale-user-login`) sem fornecer token/senha. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` via daemon local do Tailscale (`tailscale whois`) e comparando-o ao cabeçalho antes de aceitá-lo. O OpenClaw só trata uma solicitação como Serve quando ela chega do loopback com os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.
Para sessões de operador da UI de Controle que incluem identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a ida e volta do pareamento de dispositivo. Ele não ignora a identidade de dispositivo do navegador: clientes sem dispositivo ainda são rejeitados, e conexões WebSocket de função de nó ou que não sejam da UI de Controle ainda seguem as verificações normais de pareamento e autenticação.
Endpoints da API HTTP (por exemplo, `/v1/*`, `/tools/invoke` e `/api/channels/*`) **não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o modo normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão, ou uma configuração `none` de proxy confiável / entrada privada configurada intencionalmente.
Esse fluxo sem token pressupõe que o host do gateway é confiável. Se código local não confiável puder ser executado no mesmo host, desative `gateway.auth.allowTailscale` e exija autenticação por token/senha em vez disso.
Para exigir credenciais explícitas de segredo compartilhado, defina `gateway.auth.allowTailscale: false` e use `gateway.auth.mode: "token"` ou `"password"`.

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

Abra: `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Somente tailnet (vincular ao IP da Tailnet)

Use isto quando quiser que o Gateway escute diretamente no IP da Tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte a partir de outro dispositivo da Tailnet:

- UI de Controle: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) **não** funcionará neste modo.
</Note>

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

- Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e conectada.
- `tailscale.mode: "funnel"` se recusa a iniciar a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração de `tailscale serve` ou `tailscale funnel` no encerramento.
- `gateway.bind: "tailnet"` é uma vinculação direta à Tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser apenas Tailnet.
- Serve/Funnel expõem apenas a **UI de controle do Gateway + WS**. Nós se conectam pelo mesmo endpoint WS do Gateway, portanto o Serve pode funcionar para acesso de nós.

## Controle de navegador (Gateway remoto + navegador local)

Se você executar o Gateway em uma máquina, mas quiser controlar um navegador em outra máquina, execute um **host de nó** na máquina do navegador e mantenha ambos na mesma tailnet.
O Gateway encaminhará ações do navegador para o nó; não é necessário servidor de controle separado nem URL do Serve.

Evite Funnel para controle de navegador; trate o pareamento de nós como acesso de operador.

## Pré-requisitos + limites do Tailscale

- Serve exige HTTPS habilitado para sua tailnet; a CLI solicita isso se estiver ausente.
- Serve injeta cabeçalhos de identidade do Tailscale; Funnel não.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de nó funnel.
- Funnel oferece suporte apenas às portas `443`, `8443` e `10000` via TLS.
- Funnel no macOS exige a variante de código aberto do aplicativo Tailscale.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Descoberta](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
