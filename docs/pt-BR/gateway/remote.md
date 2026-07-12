---
read_when:
    - Execução ou solução de problemas de configurações remotas do Gateway
summary: Acesso remoto usando o WebSocket do Gateway, túneis SSH e tailnets
title: Acesso remoto
x-i18n:
    generated_at: "2026-07-11T23:57:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

O OpenClaw executa um Gateway (o principal) em um host e conecta todos os clientes a ele. O Gateway controla sessões, perfis de autenticação, canais e estado; todo o restante é um cliente.

- **Operadores** (você ou o aplicativo para macOS): o WebSocket direto pela LAN/Tailnet é a opção mais simples quando o Gateway está acessível; o túnel SSH é a alternativa universal.
- **Nodes** (iOS/Android e outros dispositivos): conectam-se ao **WebSocket** do Gateway (LAN/tailnet ou túnel SSH).

## A ideia central

Por padrão, o WebSocket do Gateway é vinculado ao **local loopback**, na porta `18789` (`gateway.port`). Para uso remoto, exponha-o por meio do Tailscale Serve/de uma vinculação LAN-Tailnet confiável ou encaminhe a porta de local loopback por SSH.

## Opções de topologia

| Configuração                              | Onde o Gateway é executado                                                                                       | Mais indicada para                                                                                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway sempre ativo na sua tailnet       | Host persistente (VPS ou servidor doméstico), acessado por Tailscale ou SSH                                      | Notebooks que entram em suspensão com frequência, mas precisam manter o agente sempre ativo. Consulte [exe.dev](/pt-BR/install/exe-dev) (VM simples) ou [Hetzner](/pt-BR/install/hetzner) (VPS de produção). |
| Desktop doméstico                         | Desktop; o notebook se conecta remotamente pelo modo remoto do aplicativo para macOS (Settings → Connection → OpenClaw runs) | Manter o agente em um hardware que permanece ligado. Guia operacional: [acesso remoto no macOS](/pt-BR/platforms/mac/remote).                                           |
| Notebook                                  | Notebook exposto com segurança por túnel SSH ou Tailscale Serve (mantenha `gateway.bind: "loopback"`)            | Configurações de uma única máquina. Consulte [Tailscale](/pt-BR/gateway/tailscale) e [Web](/pt-BR/web).                                                                        |

Para as configurações sempre ativa e de notebook, prefira manter `gateway.bind: "loopback"` e usar o **Tailscale Serve** para a interface de controle, ou uma vinculação LAN/Tailnet confiável com `gateway.remote.transport: "direct"`. O túnel SSH é a alternativa que funciona em qualquer máquina.

## Fluxo de comandos (o que é executado onde)

Um Gateway controla o estado e os canais; os Nodes são periféricos. Exemplo (mensagem do Telegram encaminhada para uma ferramenta de Node):

1. A mensagem do Telegram chega ao **Gateway**.
2. O Gateway executa o **agente**, que decide se deve chamar uma ferramenta de Node.
3. O Gateway chama o **Node** pelo WebSocket do Gateway (RPC `node.invoke`).
4. O Node retorna o resultado; o Gateway responde ao Telegram.

Os Nodes não executam o serviço do Gateway. Apenas um Gateway deve ser executado por host, a menos que você execute intencionalmente perfis isolados (consulte [Vários gateways](/pt-BR/gateway/multiple-gateways)). O "modo Node" do aplicativo para macOS é apenas um cliente Node conectado pelo WebSocket do Gateway.

## Túnel SSH (CLI + ferramentas)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Com o túnel ativo, `openclaw health` e `openclaw status --deep` acessam o Gateway remoto por meio de `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` também podem apontar para uma URL encaminhada por meio de `--url`.

<Note>
Substitua `18789` pelo valor configurado em `gateway.port` (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` nunca recorre às credenciais da configuração ou do ambiente. Informe `--token` ou `--password` explicitamente; sem eles, o cliente não envia credenciais, e a conexão falha se o Gateway de destino exigir autenticação.
</Warning>

## Padrões remotos da CLI

Persista um destino remoto para que os comandos da CLI o utilizem por padrão:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Quando o Gateway estiver restrito ao local loopback, mantenha a URL como `ws://127.0.0.1:18789` e abra primeiro o túnel SSH. No transporte por túnel SSH do aplicativo para macOS, o nome de host do Gateway descoberto é definido em `gateway.remote.sshTarget` (`user@host` ou `user@host:port`); `gateway.remote.url` permanece como a URL do túnel local. Se a porta remota for diferente da local, defina `gateway.remote.remotePort`.

Por padrão, a verificação da chave do host é rigorosa (`gateway.remote.sshHostKeyPolicy: "strict"`). Defina-a como `"openssh"` para delegar essa verificação à sua configuração efetiva do OpenSSH; revise as configurações SSH do usuário e do sistema antes de habilitar essa opção.

Para um Gateway que já esteja acessível em uma LAN ou Tailnet confiável, use o modo direto:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Precedência de credenciais

A resolução de credenciais do Gateway segue um contrato compartilhado entre os fluxos de chamada/sondagem/status e o monitoramento de aprovação de execução do Discord. O host do Node usa o mesmo contrato, com uma exceção para o modo local (ele ignora `gateway.remote.*`).

- Credenciais explícitas (`--token`, `--password` ou o `gatewayToken` de uma ferramenta) sempre têm precedência nos fluxos de chamada que aceitam autenticação explícita.
- Segurança da substituição de URL:
  - O `--url` da CLI nunca reutiliza credenciais implícitas da configuração ou do ambiente.
  - `OPENCLAW_GATEWAY_URL` no ambiente pode usar somente credenciais do ambiente (`OPENCLAW_GATEWAY_TOKEN`/`OPENCLAW_GATEWAY_PASSWORD`).
- Padrões do modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (alternativa remota somente quando o token local não está definido)
  - senha: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (alternativa remota somente quando a senha local não está definida)
- Padrões do modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - senha: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção do modo local do host do Node: `gateway.remote.token`/`gateway.remote.password` são ignorados.
- Por padrão, as verificações de token de sondagem/status remotos são rigorosas: elas usam somente `gateway.remote.token` (sem recorrer ao token local) quando o destino está no modo remoto.
- As substituições do ambiente do Gateway usam somente `OPENCLAW_GATEWAY_*`.

## Acesso remoto à interface de chat

O WebChat não tem uma porta HTTP separada; a interface de chat SwiftUI se conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` por SSH (consulte acima) e conecte os clientes a `ws://127.0.0.1:18789`.
- Para o modo direto por LAN/Tailnet, conecte os clientes à URL privada `ws://` ou segura `wss://` configurada.
- No macOS, o modo remoto do aplicativo gerencia automaticamente o transporte selecionado.

## Modo remoto do aplicativo para macOS

O aplicativo da barra de menus do macOS gerencia a mesma configuração de ponta a ponta: verificações de status remoto, WebChat e encaminhamento do Voice Wake. Guia operacional: [acesso remoto no macOS](/pt-BR/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Mantenha o Gateway **restrito ao local loopback**, a menos que tenha certeza de que precisa de uma vinculação.

- **Local loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` sem criptografia é aceito para hosts de local loopback, privados/LAN (RFC 1918), link-local, CGNAT, `.local` e `.ts.net`. Hosts remotos públicos devem usar `wss://`.
- **Vinculações que não sejam de local loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando o local loopback não estiver disponível) devem usar autenticação do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade e `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token`/`.password` são fontes de credenciais do cliente; por si só, não configuram a autenticação do servidor.
- Os fluxos de chamada locais podem usar `gateway.remote.*` como alternativa somente quando `gateway.auth.*` não está definido.
- Se `gateway.auth.token`/`gateway.auth.password` estiver explicitamente configurado por meio de SecretRef e não puder ser resolvido, a resolução falhará de forma fechada (sem alternativa remota para mascarar a falha).
- `gateway.remote.tlsFingerprint` fixa o certificado TLS remoto para `wss://`, inclusive no modo direto do macOS. Sem uma impressão digital armazenada, o macOS só a fixa no primeiro uso após a validação normal de confiança do sistema; Gateways autoassinados ou com CA privada precisam de uma impressão digital explícita ou do modo Remote over SSH.
- O **Tailscale Serve** pode autenticar o tráfego da interface de controle/do WebSocket por meio de cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`. Os endpoints da API HTTP não usam essa autenticação por cabeçalho e seguem o modo normal de autenticação HTTP do Gateway. Esse fluxo sem token pressupõe que o host do Gateway seja confiável; defina-o como `false` para usar autenticação por segredo compartilhado em todos os lugares.
- A autenticação por **proxy confiável** espera, por padrão, um proxy com reconhecimento de identidade que não seja de local loopback. Proxies reversos de local loopback no mesmo host exigem `gateway.auth.trustedProxy.allowLoopback = true` explicitamente.
- Trate o controle pelo navegador como acesso de operador: somente pela tailnet e com pareamento deliberado de Nodes.

Análise detalhada: [Segurança](/pt-BR/gateway/security).

### macOS: túnel SSH persistente por meio de LaunchAgent

Para clientes macOS, a configuração persistente mais simples usa uma entrada SSH `LocalForward` e um LaunchAgent que mantém o túnel ativo após reinicializações e falhas.

#### Etapa 1: adicionar a configuração SSH

Edite `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Substitua `<REMOTE_IP>` e `<REMOTE_USER>` pelos seus valores.

#### Etapa 2: copiar a chave SSH (uma vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Etapa 3: configurar o token do Gateway

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Use `gateway.remote.password` se o Gateway remoto utilizar autenticação por senha. `OPENCLAW_GATEWAY_TOKEN` continua válido como uma substituição no nível do shell, mas a configuração persistente recomendada para o cliente remoto é `gateway.remote.token`/`gateway.remote.password`.

#### Etapa 4: criar o LaunchAgent

Salve como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Etapa 5: carregar o LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

O túnel é iniciado automaticamente ao iniciar a sessão, reinicia em caso de falha e mantém a porta encaminhada ativa.

<Note>
Se você tiver um LaunchAgent `com.openclaw.ssh-tunnel` remanescente de uma configuração anterior, descarregue-o e exclua-o.
</Note>

#### Solução de problemas

```bash
# Verificar se o túnel está em execução
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Reiniciar o túnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Interromper o túnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuração                 | O que faz                                                            |
| --------------------------------------- | --------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`    | Encaminha a porta local 18789 para a porta remota 18789               |
| `ssh -N`                                | SSH sem executar comandos remotos (somente encaminhamento de portas)  |
| `KeepAlive`                             | Reinicia o túnel automaticamente em caso de falha                     |
| `RunAtLoad`                             | Inicia o túnel quando o LaunchAgent é carregado ao iniciar a sessão   |

## Relacionados

- [Tailscale](/pt-BR/gateway/tailscale)
- [Autenticação](/pt-BR/gateway/authentication)
- [Configuração de Gateway remoto](/pt-BR/gateway/remote-gateway-readme)
