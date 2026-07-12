---
read_when:
    - Expondo a interface de controle do Gateway fora do localhost
    - Automatizando o acesso ao painel pela tailnet ou pela internet pública
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-11T23:59:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

O OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o painel do Gateway e a porta WebSocket. Isso mantém o Gateway vinculado ao loopback, enquanto o Tailscale fornece HTTPS, roteamento e, no caso do Serve, cabeçalhos de identidade.

## Modos

`gateway.tailscale.mode`:

| Modo            | Comportamento                                                                          |
| --------------- | --------------------------------------------------------------------------------------- |
| `serve`         | Serve somente na tailnet via `tailscale serve`. O Gateway permanece em `127.0.0.1`.      |
| `funnel`        | HTTPS público via `tailscale funnel`. Exige uma senha compartilhada.                     |
| `off` (padrão)  | Sem automação do Tailscale.                                                              |

A saída de status e auditoria usa **exposição pelo Tailscale** para esse modo Serve/Funnel do OpenClaw. `off` significa que o OpenClaw não está gerenciando o Serve nem o Funnel; não significa que o daemon local do Tailscale esteja parado ou com a sessão encerrada.

## Exemplos de configuração

### Somente na tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Abra: `https://<magicdns>/` (ou o `gateway.controlUi.basePath` configurado)

Para expor a interface de controle por meio de um Serviço Tailscale nomeado, em vez do nome de host do dispositivo, defina `gateway.tailscale.serviceName` como o nome do Serviço:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

A inicialização passa a informar a URL do Serviço como `https://openclaw.<tailnet-name>.ts.net/`, em vez do nome de host do dispositivo. Os Serviços Tailscale exigem que o host seja um Node com tag aprovado na sua tailnet — configure a tag e aprove o Serviço no Tailscale antes de habilitar essa opção; caso contrário, `tailscale serve --service=...` falhará durante a inicialização do Gateway.

### Somente na tailnet (vinculação ao IP da tailnet)

Use esta opção para fazer o Gateway escutar diretamente no IP da tailnet, sem Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se a partir de outro dispositivo da tailnet:

- Interface de controle: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Quando houver um IPv4 da tailnet disponível para vinculação, o Gateway também exigirá `http://127.0.0.1:18789` para clientes autenticados no mesmo host. Se nenhum endereço da tailnet estiver disponível na inicialização, ele usará somente o loopback como alternativa; reinicie depois que o Tailscale estiver disponível para adicionar acesso direto pela tailnet. Nenhum dos caminhos adiciona exposição à LAN ou à Internet pública.
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

Prefira `OPENCLAW_GATEWAY_PASSWORD` a gravar uma senha no disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Autenticação

`gateway.auth.mode` controla o handshake:

| Modo                                                   | Caso de uso                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `none`                                                 | Somente entrada privada                                                                                 |
| `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido) | Token compartilhado                                                                            |
| `password`                                             | Segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração                                   |
| `trusted-proxy`                                        | Proxy reverso com reconhecimento de identidade; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth) |

### Cabeçalhos de identidade do Tailscale (somente Serve)

Quando `tailscale.mode: "serve"` e `gateway.auth.allowTailscale` for `true`, a autenticação da interface de controle/WebSocket poderá usar cabeçalhos de identidade do Tailscale (`tailscale-user-login`) em vez de um token ou uma senha. O OpenClaw verifica o cabeçalho resolvendo o endereço `x-forwarded-for` da solicitação por meio do daemon local do Tailscale (`tailscale whois`) e comparando-o ao login no cabeçalho antes de aceitá-lo. Uma solicitação só se qualifica para esse caminho quando chega pelo loopback contendo os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.

Esse fluxo sem token pressupõe que o host do Gateway seja confiável. Se código local não confiável puder ser executado no mesmo host, defina `gateway.auth.allowTailscale: false` e exija autenticação por token ou senha.

Escopo da dispensa:

- Aplica-se somente à superfície de autenticação WebSocket da interface de controle. Os endpoints da API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*` etc.) nunca usam autenticação por cabeçalho de identidade do Tailscale; eles sempre seguem o modo normal de autenticação HTTP do Gateway.
- Para sessões de operador da interface de controle que já contenham a identidade do dispositivo no navegador, uma identidade verificada do Tailscale evita a etapa de ida e volta do emparelhamento por token de inicialização/código QR.
- Isso não dispensa a identidade do próprio dispositivo: clientes sem dispositivo ainda são rejeitados, e conexões com função de Node continuam passando pelas verificações normais de emparelhamento e autenticação.

## Observações

- O Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e com uma sessão iniciada.
- `tailscale.mode: "funnel"` se recusará a iniciar, a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- `gateway.tailscale.serviceName` aplica-se somente ao modo Serve e é passado para `tailscale serve --service=<name>`. O valor deve usar o formato `svc:<dns-label>` do Tailscale, por exemplo, `svc:openclaw`. O Tailscale exige que os hosts do Serviço sejam Nodes com tag, e o Serviço pode precisar de aprovação no console de administração antes que o Serve possa publicá-lo.
- `gateway.tailscale.resetOnExit` desfaz a configuração de `tailscale serve`/`tailscale funnel` no encerramento.
- `gateway.tailscale.preserveFunnel: true` mantém ativa entre reinicializações do Gateway uma rota `tailscale funnel` configurada externamente. Com `mode: "serve"`, o OpenClaw verifica `tailscale funnel status` antes de reaplicar o Serve e não o reaplica quando uma rota do Funnel já cobre a porta do Gateway. A política do Funnel gerenciado pelo OpenClaw que permite somente senha permanece inalterada.
- `gateway.bind: "tailnet"` usa uma vinculação direta à tailnet (sem HTTPS e sem Serve/Funnel), além do `127.0.0.1` local obrigatório quando um IPv4 da tailnet está disponível; caso contrário, usa somente o loopback como alternativa.
- `gateway.bind: "auto"` prioriza o loopback; use `tailnet` para limitar a exposição de rede à tailnet, mantendo o acesso por loopback no mesmo host.
- Serve/Funnel expõe somente a **interface de controle do Gateway + WS**. Os Nodes se conectam pelo mesmo endpoint WS do Gateway, portanto o Serve também funciona para o acesso de Nodes.

### Pré-requisitos e limitações do Tailscale

- O Serve exige que HTTPS esteja habilitado para a sua tailnet; a CLI solicitará a habilitação se estiver ausente.
- O Serve injeta cabeçalhos de identidade do Tailscale; o Funnel não.
- O Funnel exige Tailscale v1.38.3 ou posterior, MagicDNS, HTTPS habilitado e um atributo de Node do Funnel.
- O Funnel aceita somente as portas `443`, `8443` e `10000` sobre TLS.
- No macOS, o Funnel exige a variante de código aberto do aplicativo Tailscale.

## Controle do navegador (Gateway remoto + navegador local)

Para executar o Gateway em uma máquina e controlar um navegador em outra, execute um **host de Node** na máquina do navegador e mantenha ambas na mesma tailnet. O Gateway encaminha as ações do navegador ao Node; não é necessário um servidor de controle separado nem uma URL do Serve.

Evite o Funnel para controlar o navegador; trate o emparelhamento do Node como acesso de operador.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Descoberta](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
