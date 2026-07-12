---
read_when:
    - Expondo a interface de controle do Gateway fora do localhost
    - Automatizando o acesso ao painel da tailnet ou ao painel público
summary: Tailscale Serve/Funnel integrado para o painel do Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T15:19:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw pode configurar automaticamente o Tailscale **Serve** (tailnet) ou **Funnel** (público) para o painel do Gateway e a porta WebSocket. Isso mantém o gateway vinculado ao loopback enquanto o Tailscale fornece HTTPS, roteamento e, no caso do Serve, cabeçalhos de identidade.

## Modos

`gateway.tailscale.mode`:

| Modo            | Comportamento                                                                    |
| --------------- | ------------------------------------------------------------------------------- |
| `serve`         | Serve somente na tailnet via `tailscale serve`. O gateway permanece em `127.0.0.1`. |
| `funnel`        | HTTPS público via `tailscale funnel`. Exige uma senha compartilhada.            |
| `off` (padrão)  | Sem automação do Tailscale.                                                      |

A saída de status e auditoria usa **exposição do Tailscale** para esse modo Serve/Funnel do OpenClaw. `off` significa que o OpenClaw não está gerenciando o Serve nem o Funnel; não significa que o daemon local do Tailscale esteja parado ou desconectado.

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

Para expor a interface de controle por meio de um Serviço Tailscale nomeado em vez do nome de host do dispositivo, defina `gateway.tailscale.serviceName` como o nome do Serviço:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

A inicialização então informa a URL do Serviço como `https://openclaw.<tailnet-name>.ts.net/` em vez do nome de host do dispositivo. Os Serviços Tailscale exigem que o host seja um Node com tag aprovado na sua tailnet — configure a tag e aprove o Serviço no Tailscale antes de habilitar essa opção; caso contrário, `tailscale serve --service=...` falhará durante a inicialização do gateway.

### Somente na tailnet (vincular ao IP da Tailnet)

Use esta opção para que o gateway escute diretamente no IP da Tailnet, sem Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Conecte-se de outro dispositivo da Tailnet:

- Interface de controle: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Quando um IPv4 da Tailnet que pode ser vinculado está presente, o Gateway também exige `http://127.0.0.1:18789` para clientes autenticados no mesmo host. Se nenhum endereço da Tailnet estiver disponível na inicialização, ele recorrerá somente ao loopback; reinicie após o Tailscale ficar disponível para adicionar acesso direto pela Tailnet. Nenhum dos caminhos adiciona exposição à LAN ou pública.
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

Prefira `OPENCLAW_GATEWAY_PASSWORD` em vez de gravar uma senha no disco.

## Exemplos de CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Autenticação

`gateway.auth.mode` controla o handshake:

| Modo                                                   | Caso de uso                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `none`                                                 | Somente ingresso privado                                                            |
| `token` (padrão quando `OPENCLAW_GATEWAY_TOKEN` está definido) | Token compartilhado                                                        |
| `password`                                             | Segredo compartilhado via `OPENCLAW_GATEWAY_PASSWORD` ou configuração              |
| `trusted-proxy`                                        | Proxy reverso com reconhecimento de identidade; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth) |

### Cabeçalhos de identidade do Tailscale (somente Serve)

Quando `tailscale.mode: "serve"` e `gateway.auth.allowTailscale` é `true`, a autenticação da interface de controle/WebSocket pode usar os cabeçalhos de identidade do Tailscale (`tailscale-user-login`) em vez de um token/senha. O OpenClaw verifica o cabeçalho resolvendo o endereço `x-forwarded-for` da solicitação por meio do daemon local do Tailscale (`tailscale whois`) e comparando-o ao login do cabeçalho antes de aceitá-lo. Uma solicitação só se qualifica para esse caminho quando chega pelo loopback contendo os cabeçalhos `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` do Tailscale.

Esse fluxo sem token pressupõe que o host do gateway seja confiável. Se código local não confiável puder ser executado no mesmo host, defina `gateway.auth.allowTailscale: false` e exija autenticação por token/senha.

Escopo da dispensa:

- Aplica-se somente à superfície de autenticação WebSocket da interface de controle. Os endpoints da API HTTP (`/v1/*`, `/tools/invoke`, `/api/channels/*` etc.) nunca usam autenticação por cabeçalho de identidade do Tailscale; eles sempre seguem o modo de autenticação HTTP normal do gateway.
- Para sessões de operador da interface de controle que já contêm a identidade do dispositivo do navegador, uma identidade verificada do Tailscale ignora o processo de pareamento por token de bootstrap/código QR.
- Isso não ignora a identidade do próprio dispositivo: clientes sem dispositivo ainda são rejeitados, e conexões com função de Node ainda passam pelas verificações normais de pareamento e autenticação.

## Observações

- O Tailscale Serve/Funnel exige que a CLI `tailscale` esteja instalada e conectada.
- `tailscale.mode: "funnel"` se recusa a iniciar, a menos que o modo de autenticação seja `password`, para evitar exposição pública.
- `gateway.tailscale.serviceName` aplica-se somente ao modo Serve e é passado para `tailscale serve --service=<name>`. O valor deve usar o formato `svc:<dns-label>` do Tailscale, por exemplo, `svc:openclaw`. O Tailscale exige que os hosts do Serviço sejam Nodes com tags, e o Serviço pode precisar de aprovação no console administrativo antes que o Serve possa publicá-lo.
- `gateway.tailscale.resetOnExit` desfaz a configuração de `tailscale serve`/`tailscale funnel` no encerramento.
- `gateway.tailscale.preserveFunnel: true` mantém ativa uma rota `tailscale funnel` configurada externamente entre reinicializações do gateway. Com `mode: "serve"`, o OpenClaw verifica `tailscale funnel status` antes de reaplicar o Serve e não o aplica quando uma rota do Funnel já cobre a porta do gateway. A política somente de senha para o Funnel gerenciado pelo OpenClaw permanece inalterada.
- `gateway.bind: "tailnet"` usa uma vinculação direta à Tailnet (sem HTTPS, sem Serve/Funnel), além do `127.0.0.1` local obrigatório quando um IPv4 da Tailnet está disponível; caso contrário, recorre somente ao loopback.
- `gateway.bind: "auto"` prioriza o loopback; use `tailnet` para limitar a exposição da rede à Tailnet enquanto mantém o acesso por loopback no mesmo host.
- O Serve/Funnel expõe somente a **interface de controle do Gateway + WS**. Os Nodes se conectam pelo mesmo endpoint WS do Gateway, portanto o Serve também funciona para acesso de Nodes.

### Pré-requisitos e limites do Tailscale

- O Serve exige que o HTTPS esteja habilitado para sua tailnet; a CLI solicita a habilitação se estiver ausente.
- O Serve injeta cabeçalhos de identidade do Tailscale; o Funnel não.
- O Funnel exige Tailscale v1.38.3+, MagicDNS, HTTPS habilitado e um atributo de Node do Funnel.
- O Funnel aceita somente as portas `443`, `8443` e `10000` por TLS.
- O Funnel no macOS exige a variante de código aberto do aplicativo Tailscale.

## Controle do navegador (Gateway remoto + navegador local)

Para executar o Gateway em uma máquina, mas controlar um navegador em outra, execute um **host de Node** na máquina do navegador e mantenha ambos na mesma tailnet. O Gateway encaminha as ações do navegador ao Node; nenhum servidor de controle ou URL do Serve separado é necessário.

Evite o Funnel para controlar o navegador; trate o pareamento do Node como acesso de operador.

## Saiba mais

- Visão geral do Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Comando `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Visão geral do Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Comando `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Descoberta](/pt-BR/gateway/discovery)
- [Autenticação](/pt-BR/gateway/authentication)
