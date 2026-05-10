---
read_when:
    - Expondo a interface de controle do Gateway fora do localhost
    - Automatizando o acesso à tailnet ou ao painel público
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:36:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o painel do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto o Tailscale fornece HTTPS, roteamento e (para Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve somente para Tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: Padrão (sem automação do Tailscale).

A saída de status e auditoria usa **exposição do Tailscale** para este modo Serve/Funnel do OpenClaw. `off` significa que o OpenClaw não está gerenciando Serve nem Funnel; não significa que o daemon local do Tailscale esteja parado ou desconectado.

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (somente ingresso privado)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso com reconhecimento de identidade; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`, a autenticação da UI de controle/WebSocket pode usar cabeçalhos de identidade do Tailscale (`tailscale-user-login`) sem fornecer token/senha. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` via daemon local do Tailscale (`tailscale whois`) e comparando-o com o cabeçalho antes de aceitá-lo. O OpenClaw só trata uma solicitação como Serve quando ela chega de loopback com os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.
Para sessões de operador da UI de controle que incluem identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a ida e volta de pareamento do dispositivo. Ele não contorna a identidade de dispositivo do navegador: clientes sem dispositivo ainda são rejeitados, e conexões WebSocket de função de Node ou que não sejam da UI de controle ainda seguem as verificações normais de pareamento e autenticação.
Endpoints da API HTTP (por exemplo, `/v1/*`, `/tools/invoke` e `/api/channels/*`) **não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o modo normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão, ou uma configuração `none` de proxy confiável / ingresso privado configurada intencionalmente.
Esse fluxo sem token pressupõe que o host do gateway seja confiável. Se código local não confiável puder ser executado no mesmo host, desative `gateway.auth.allowTailscale` e exija autenticação por token/senha.
Para exigir credenciais explícitas de segredo compartilhado, defina `gateway.auth.allowTailscale: false` e use `gateway.auth.mode: "token"` ou `"password"`.

## Exemplos de configuração

### Somente Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abra: `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

### Somente Tailnet (vincular ao IP da Tailnet)

Use isto quando quiser que o Gateway escute diretamente no IP da Tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se de outro dispositivo da Tailnet:

- UI de controle: `http://<tailscale-ip>:18789/`
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

Prefira `OPENCLAW_GATEWAY_PASSWORD` em vez de confirmar uma senha no disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Observações

- Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e conectada.
- `tailscale.mode: "funnel"` se recusa a iniciar a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração de `tailscale serve` ou `tailscale funnel` no desligamento.
- Defina `gateway.tailscale.preserveFunnel: true` para manter uma rota `tailscale funnel` configurada externamente ativa entre reinicializações do gateway. Quando habilitado e o gateway é executado em `mode: "serve"`, o OpenClaw verifica `tailscale funnel status` antes de reaplicar Serve e ignora isso quando uma rota Funnel já cobre a porta do gateway. A política de Funnel gerenciado pelo OpenClaw somente com senha permanece inalterada.
- `gateway.bind: "tailnet"` é uma vinculação direta à Tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser somente Tailnet.
- Serve/Funnel expõem apenas a **UI de controle do Gateway + WS**. Nodes se conectam pelo mesmo endpoint WS do Gateway, então Serve pode funcionar para acesso de Node.

## Controle de navegador (Gateway remoto + navegador local)

Se você executa o Gateway em uma máquina, mas quer controlar um navegador em outra máquina, execute um **host de Node** na máquina do navegador e mantenha ambos na mesma tailnet.
O Gateway fará proxy das ações do navegador para o Node; nenhum servidor de controle separado ou URL Serve é necessário.

Evite Funnel para controle de navegador; trate o pareamento de Node como acesso de operador.

## Pré-requisitos + limites do Tailscale

- Serve exige HTTPS habilitado para sua tailnet; a CLI solicita isso se estiver ausente.
- Serve injeta cabeçalhos de identidade do Tailscale; Funnel não.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de Node de funnel.
- Funnel só é compatível com as portas `443`, `8443` e `10000` sobre TLS.
- Funnel no macOS exige a variante de código aberto do app Tailscale.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Descoberta](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
