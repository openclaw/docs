---
read_when:
    - Executando ou solucionando problemas de configurações remotas do Gateway
summary: Acesso remoto usando túneis SSH (Gateway WS) e tailnets
title: Acesso remoto
x-i18n:
    generated_at: "2026-04-26T11:29:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Este repositório oferece suporte a “remoto por SSH” mantendo um único Gateway (o mestre) em execução em um host dedicado (desktop/servidor) e conectando clientes a ele.

- Para **operadores (você / o app macOS)**: túnel SSH é o fallback universal.
- Para **nodes (iOS/Android e futuros dispositivos)**: conecte-se ao **WebSocket** do Gateway (LAN/tailnet ou túnel SSH, conforme necessário).

## A ideia central

- O WebSocket do Gateway faz bind em **loopback** na porta configurada (o padrão é 18789).
- Para uso remoto, você encaminha essa porta de loopback por SSH (ou usa uma tailnet/VPN e depende menos de túnel).

## Configurações comuns de VPN/tailnet (onde o agente vive)

Pense no **host do Gateway** como “onde o agente vive”. Ele é dono de sessões, perfis de autenticação, canais e estado.
Seu laptop/desktop (e nodes) se conectam a esse host.

### 1) Gateway sempre ativo na sua tailnet (VPS ou servidor doméstico)

Execute o Gateway em um host persistente e acesse-o via **Tailscale** ou SSH.

- **Melhor UX:** mantenha `gateway.bind: "loopback"` e use **Tailscale Serve** para a Control UI.
- **Fallback:** mantenha loopback + túnel SSH a partir de qualquer máquina que precise de acesso.
- **Exemplos:** [exe.dev](/pt-BR/install/exe-dev) (VM fácil) ou [Hetzner](/pt-BR/install/hetzner) (VPS de produção).

Isso é ideal quando seu laptop entra em repouso com frequência, mas você quer o agente sempre ativo.

### 2) O desktop de casa executa o Gateway, o laptop faz o controle remoto

O laptop **não** executa o agente. Ele se conecta remotamente:

- Use o modo **Remote over SSH** do app macOS (Settings → General → “OpenClaw runs”).
- O app abre e gerencia o túnel, então WebChat + verificações de integridade “simplesmente funcionam”.

Runbook: [acesso remoto no macOS](/pt-BR/platforms/mac/remote).

### 3) O laptop executa o Gateway, com acesso remoto a partir de outras máquinas

Mantenha o Gateway local, mas exponha-o com segurança:

- Túnel SSH para o laptop a partir de outras máquinas, ou
- Use Tailscale Serve para a Control UI e mantenha o Gateway acessível apenas por loopback.

Guia: [Tailscale](/pt-BR/gateway/tailscale) e [visão geral da web](/pt-BR/web).

## Fluxo de comandos (o que é executado onde)

Um serviço de gateway é dono do estado + canais. Nodes são periféricos.

Exemplo de fluxo (Telegram → node):

- Uma mensagem do Telegram chega ao **Gateway**.
- O Gateway executa o **agente** e decide se deve chamar uma ferramenta do node.
- O Gateway chama o **node** pelo WebSocket do Gateway (RPC `node.*`).
- O node retorna o resultado; o Gateway responde de volta no Telegram.

Observações:

- **Nodes não executam o serviço de gateway.** Apenas um gateway deve ser executado por host, a menos que você intencionalmente execute perfis isolados (consulte [Múltiplos gateways](/pt-BR/gateway/multiple-gateways)).
- O “modo node” do app macOS é apenas um cliente node sobre o WebSocket do Gateway.

## Túnel SSH (CLI + ferramentas)

Crie um túnel local para o WS do Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Com o túnel ativo:

- `openclaw health` e `openclaw status --deep` agora alcançam o gateway remoto via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` também podem direcionar a URL encaminhada via `--url` quando necessário.

Observação: substitua `18789` por `gateway.port` configurado (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Observação: quando você passa `--url`, a CLI não usa fallback para credenciais de configuração ou ambiente.
Inclua `--token` ou `--password` explicitamente. Ausência de credenciais explícitas é um erro.

## Padrões remotos da CLI

Você pode persistir um destino remoto para que os comandos da CLI o usem por padrão:

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

Quando o gateway é acessível apenas por loopback, mantenha a URL em `ws://127.0.0.1:18789` e abra primeiro o túnel SSH.
No transporte por túnel SSH do app macOS, os nomes de host do gateway descobertos pertencem a
`gateway.remote.sshTarget`; `gateway.remote.url` permanece como a URL do túnel local.

## Precedência de credenciais

A resolução de credenciais do Gateway segue um único contrato compartilhado entre caminhos de call/probe/status e monitoramento de aprovação de exec do Discord. Node-host usa o mesmo contrato base com uma exceção no modo local (ele intencionalmente ignora `gateway.remote.*`):

- Credenciais explícitas (`--token`, `--password` ou ferramenta `gatewayToken`) sempre vencem em caminhos de chamada que aceitam autenticação explícita.
- Segurança na substituição de URL:
  - Substituições de URL da CLI (`--url`) nunca reutilizam credenciais implícitas de config/env.
  - Substituições de URL por env (`OPENCLAW_GATEWAY_URL`) podem usar apenas credenciais de env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Padrões do modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (o fallback remoto se aplica apenas quando a entrada do token de autenticação local não está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (o fallback remoto se aplica apenas quando a entrada da senha de autenticação local não está definida)
- Padrões do modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção de node-host no modo local: `gateway.remote.token` / `gateway.remote.password` são ignorados.
- Verificações de token de probe/status remoto são estritas por padrão: usam apenas `gateway.remote.token` (sem fallback para token local) ao direcionar o modo remoto.
- Substituições de env do Gateway usam apenas `OPENCLAW_GATEWAY_*`.

## Interface de chat por SSH

O WebChat não usa mais uma porta HTTP separada. A UI de chat SwiftUI se conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` por SSH (veja acima), depois conecte os clientes a `ws://127.0.0.1:18789`.
- No macOS, prefira o modo “Remote over SSH” do app, que gerencia o túnel automaticamente.

## App macOS "Remote over SSH"

O app da barra de menus do macOS pode conduzir a mesma configuração de ponta a ponta (verificações remotas de status, WebChat e encaminhamento de Voice Wake).

Runbook: [acesso remoto no macOS](/pt-BR/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Versão curta: **mantenha o Gateway acessível apenas por loopback** a menos que você tenha certeza de que precisa de um bind.

- **Loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` em texto simples é limitado a loopback por padrão. Para redes privadas confiáveis,
  defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo do cliente como
  último recurso. Não existe equivalente em `openclaw.json`; isso deve ser uma
  variável de ambiente do processo do cliente que faz a conexão WebSocket.
- **Binds fora de loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando loopback não está disponível) devem usar autenticação do gateway: token, senha ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Eles **não** configuram, por si só, a autenticação do servidor.
- Caminhos de chamada locais podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver configurado explicitamente via SecretRef e não resolvido, a resolução falhará de forma fechada (sem fallback remoto mascarando isso).
- `gateway.remote.tlsFingerprint` fixa o certificado TLS remoto ao usar `wss://`.
- **Tailscale Serve** pode autenticar tráfego da Control UI/WebSocket via cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`; endpoints de API HTTP não usam essa autenticação por cabeçalho do Tailscale e, em vez disso, seguem o modo normal de autenticação HTTP do gateway. Esse fluxo sem token assume que o host do gateway é confiável. Defina como `false` se quiser autenticação por segredo compartilhado em todos os lugares.
- A autenticação **Trusted-proxy** é apenas para configurações fora de loopback com proxy e reconhecimento de identidade.
  Proxies reversos no mesmo host e em loopback não satisfazem `gateway.auth.mode: "trusted-proxy"`.
- Trate o controle por navegador como acesso de operador: somente tailnet + pareamento deliberado de node.

Aprofundamento: [Segurança](/pt-BR/gateway/security).

### macOS: túnel SSH persistente via LaunchAgent

Para clientes macOS conectando-se a um gateway remoto, a configuração persistente mais fácil usa uma entrada `LocalForward` na configuração SSH mais um LaunchAgent para manter o túnel ativo entre reinicializações e falhas.

#### Etapa 1: adicionar configuração SSH

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

#### Etapa 3: configurar o token do gateway

Armazene o token na configuração para que ele persista entre reinicializações:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Etapa 4: criar o LaunchAgent

Salve isto como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

O túnel será iniciado automaticamente no login, reiniciado em caso de falha e manterá a porta encaminhada ativa.

Observação: se você tiver um LaunchAgent `com.openclaw.ssh-tunnel` remanescente de uma configuração antiga, descarregue-o e exclua-o.

#### Solução de problemas

Verifique se o túnel está em execução:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicie o túnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Pare o túnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuração               | O que ela faz                                                |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Encaminha a porta local 18789 para a porta remota 18789      |
| `ssh -N`                              | SSH sem executar comandos remotos (somente encaminhamento de porta) |
| `KeepAlive`                           | Reinicia automaticamente o túnel se ele falhar               |
| `RunAtLoad`                           | Inicia o túnel quando o LaunchAgent é carregado no login     |

## Relacionados

- [Tailscale](/pt-BR/gateway/tailscale)
- [Autenticação](/pt-BR/gateway/authentication)
- [Configuração de gateway remoto](/pt-BR/gateway/remote-gateway-readme)
