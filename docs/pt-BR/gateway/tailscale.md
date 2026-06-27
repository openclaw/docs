---
read_when:
    - Expondo a UI de Controle do Gateway fora do localhost
    - Automatizando o acesso ao tailnet ou ao painel público
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:34:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

O OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o
dashboard do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback enquanto
o Tailscale fornece HTTPS, roteamento e (para Serve) cabeçalhos de identidade.

## Modos

- `serve`: Serve somente na tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`.
- `funnel`: HTTPS público via `tailscale funnel`. O OpenClaw exige uma senha compartilhada.
- `off`: Padrão (sem automação do Tailscale).

A saída de status e auditoria usa **exposição do Tailscale** para este modo Serve/Funnel
do OpenClaw. `off` significa que o OpenClaw não está gerenciando Serve ou Funnel; isso não significa que o
daemon local do Tailscale está parado ou desconectado.

## Autenticação

Defina `gateway.auth.mode` para controlar o handshake:

- `none` (somente ingresso privado)
- `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido)
- `password` (segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração)
- `trusted-proxy` (proxy reverso ciente de identidade; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth))

Quando `tailscale.mode = "serve"` e `gateway.auth.allowTailscale` é `true`,
a autenticação da interface de controle/WebSocket pode usar cabeçalhos de identidade do Tailscale
(`tailscale-user-login`) sem fornecer um token/senha. O OpenClaw verifica
a identidade resolvendo o endereço `x-forwarded-for` via daemon local do Tailscale
(`tailscale whois`) e comparando-o ao cabeçalho antes de aceitá-lo.
O OpenClaw só trata uma solicitação como Serve quando ela chega pelo loopback com
os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host`
do Tailscale.
Para sessões de operador da interface de controle que incluem identidade de dispositivo do navegador, esse
caminho Serve verificado também ignora a viagem de ida e volta de pareamento de dispositivo. Ele não contorna
a identidade de dispositivo do navegador: clientes sem dispositivo ainda são rejeitados, e conexões
WebSocket com função de nó ou fora da interface de controle ainda seguem as verificações normais de pareamento e
autenticação.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o modo
normal de autenticação HTTP do gateway: autenticação por segredo compartilhado por padrão, ou uma configuração
`none` de proxy confiável / ingresso privado configurada intencionalmente.
Esse fluxo sem token pressupõe que o host do gateway é confiável. Se código local não confiável
puder ser executado no mesmo host, desabilite `gateway.auth.allowTailscale` e exija
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

Abra: `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

Para expor a interface de controle por meio de um Serviço Tailscale nomeado em vez do
nome de host do dispositivo, defina `gateway.tailscale.serviceName` para o nome do Serviço:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Com o exemplo acima, a inicialização relata a URL do Serviço como
`https://openclaw.<tailnet-name>.ts.net/` em vez do nome de host do dispositivo.
Os Serviços Tailscale exigem que o host seja um nó marcado aprovado na sua
tailnet. Configure a tag e aprove o Serviço no Tailscale antes de habilitar
esta opção; caso contrário, `tailscale serve --service=...` falhará durante a inicialização do gateway.

### Somente tailnet (vincular ao IP da tailnet)

Use isto quando quiser que o Gateway escute diretamente no IP da tailnet (sem Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte a partir de outro dispositivo da tailnet:

- Interface de controle: `http://<tailscale-ip>:18789/`
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

Prefira `OPENCLAW_GATEWAY_PASSWORD` a fazer commit de uma senha em disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Observações

- Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e conectada.
- `tailscale.mode: "funnel"` se recusa a iniciar, a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- `gateway.tailscale.serviceName` se aplica somente ao modo Serve e é passado para
  `tailscale serve --service=<name>`. O valor deve usar o formato de nome de Serviço
  `svc:<dns-label>` do Tailscale, por exemplo `svc:openclaw`.
  O Tailscale exige que hosts de Serviço sejam nós marcados, e o Serviço pode precisar de
  aprovação no console administrativo antes que o Serve possa publicá-lo.
- Defina `gateway.tailscale.resetOnExit` se quiser que o OpenClaw desfaça a configuração
  `tailscale serve` ou `tailscale funnel` ao encerrar.
- Defina `gateway.tailscale.preserveFunnel: true` para manter uma rota
  `tailscale funnel` configurada externamente ativa entre reinicializações do gateway. Quando habilitado e o
  gateway é executado em `mode: "serve"`, o OpenClaw verifica `tailscale funnel status`
  antes de reaplicar Serve e o ignora quando uma rota Funnel já cobre a
  porta do gateway. A política de Funnel somente com senha gerenciada pelo OpenClaw não muda.
- `gateway.bind: "tailnet"` é um vínculo direto à tailnet (sem HTTPS, sem Serve/Funnel).
- `gateway.bind: "auto"` prefere loopback; use `tailnet` se quiser somente tailnet.
- Serve/Funnel expõem apenas a **interface de controle do Gateway + WS**. Nós se conectam pelo
  mesmo endpoint WS do Gateway, então Serve pode funcionar para acesso de nós.

## Controle de navegador (Gateway remoto + navegador local)

Se você executa o Gateway em uma máquina, mas quer controlar um navegador em outra máquina,
execute um **host de nó** na máquina do navegador e mantenha ambos na mesma tailnet.
O Gateway fará proxy das ações do navegador para o nó; não é necessário um servidor de controle separado nem URL Serve.

Evite Funnel para controle de navegador; trate o pareamento de nós como acesso de operador.

## Pré-requisitos + limites do Tailscale

- Serve exige HTTPS habilitado para sua tailnet; a CLI solicita se isso estiver ausente.
- Serve injeta cabeçalhos de identidade do Tailscale; Funnel não.
- Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de nó funnel.
- Funnel oferece suporte somente às portas `443`, `8443` e `10000` sobre TLS.
- Funnel no macOS exige a variante de app Tailscale de código aberto.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Descoberta](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
