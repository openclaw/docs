---
read_when:
    - Expondo a Control UI do Gateway fora do localhost
    - Automatizando o acesso ao painel por tailnet ou público
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:30:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

O OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o
painel do Gateway e a porta do WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto
o Tailscale fornece HTTPS, roteamento e (para Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve apenas para tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: Padrão (sem automação do Tailscale).

A saída de status e auditoria usa **exposição Tailscale** para este modo Serve/Funnel
do OpenClaw. `off` significa que o OpenClaw não está gerenciando Serve nem Funnel; isso não significa que o
daemon local do Tailscale esteja parado ou desconectado.

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (ingresso privado apenas)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso com reconhecimento de identidade; consulte [Autenticação Trusted Proxy](/pt-BR/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`,
a autenticação da Control UI/WebSocket pode usar cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) sem fornecer um token/senha. O OpenClaw verifica
a identidade resolvendo o endereço `x-forwarded-for` via o daemon local do Tailscale
(`tailscale whois`) e comparando-o com o cabeçalho antes de aceitá-lo.
O OpenClaw só trata uma solicitação como Serve quando ela chega a partir do loopback com
os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.
Para sessões de operador da Control UI que incluem identidade do dispositivo do navegador, esse
caminho Serve verificado também ignora o roundtrip de pareamento do dispositivo. Isso não contorna
a identidade do dispositivo do navegador: clientes sem dispositivo ainda são rejeitados, e conexões WebSocket
de função node ou que não sejam da Control UI ainda seguem as verificações normais de pareamento e
autenticação.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o
modo normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão, ou uma
configuração intencional de trusted-proxy / ingresso privado `none`.
Esse fluxo sem token pressupõe que o host do gateway é confiável. Se código local não confiável
puder ser executado no mesmo host, desative `gateway.auth.allowTailscale` e exija
autenticação por token/senha.
Para exigir credenciais explícitas de segredo compartilhado, defina `gateway.auth.allowTailscale: false`
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

Abra: `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Somente tailnet (bind ao IP da Tailnet)

Use isto quando você quiser que o Gateway escute diretamente no IP da Tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se a partir de outro dispositivo da Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Observação: loopback (`http://127.0.0.1:18789`) **não** funcionará neste modo.

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

Prefira `OPENCLAW_GATEWAY_PASSWORD` em vez de gravar uma senha no disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Observações

- Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e autenticada.
- `tailscale.mode: "funnel"` se recusa a iniciar a menos que o modo de autenticação seja `password` para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração de `tailscale serve`
  ou `tailscale funnel` ao encerrar.
- `gateway.bind: "tailnet"` é um bind direto à Tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser somente Tailnet.
- Serve/Funnel expõem apenas a **Control UI + WS do Gateway**. Nodes se conectam pelo
  mesmo endpoint WS do Gateway, então Serve pode funcionar para acesso de node.

## Controle por navegador (Gateway remoto + navegador local)

Se você executa o Gateway em uma máquina, mas quer controlar um navegador em outra máquina,
execute um **node host** na máquina do navegador e mantenha ambos na mesma tailnet.
O Gateway fará proxy das ações do navegador para o node; nenhum servidor de controle separado nem URL Serve são necessários.

Evite Funnel para controle por navegador; trate o pareamento de node como acesso de operador.

## Pré-requisitos e limites do Tailscale

- Serve exige HTTPS ativado para sua tailnet; a CLI solicitará isso se estiver ausente.
- Serve injeta cabeçalhos de identidade do Tailscale; Funnel não.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS ativado e um atributo de node de funnel.
- Funnel só oferece suporte às portas `443`, `8443` e `10000` sobre TLS.
- Funnel no macOS exige a variante open-source do app Tailscale.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Descoberta](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
