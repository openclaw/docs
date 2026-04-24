---
read_when:
    - Executando ou depurando configurações remotas do gateway
summary: Acesso remoto usando tunnels SSH (Gateway WS) e tailnets
title: Acesso remoto
x-i18n:
    generated_at: "2026-04-24T05:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3753f29d6b3cc3f1a2f749cc0fdfdd60dfde8822f0ec6db0e18e5412de0980da
    source_path: gateway/remote.md
    workflow: 15
---

# Acesso remoto (SSH, tunnels e tailnets)

Este repositório oferece suporte a “remoto via SSH” mantendo um único Gateway (o master) em execução em um host dedicado (desktop/servidor) e conectando clientes a ele.

- Para **operadores (você / o app macOS)**: o tunneling SSH é o fallback universal.
- Para **nodes (iOS/Android e futuros dispositivos)**: conecte-se ao **WebSocket** do Gateway (LAN/tailnet ou tunnel SSH, conforme necessário).

## A ideia central

- O WebSocket do Gateway faz bind em **loopback** na porta configurada (padrão 18789).
- Para uso remoto, você encaminha essa porta de loopback por SSH (ou usa um tailnet/VPN e depende menos de tunnel).

## Configurações comuns de VPN/tailnet (onde o agente vive)

Pense no **host do Gateway** como “onde o agente vive”. Ele controla sessões, perfis de autenticação, canais e estado.
Seu laptop/desktop (e os nodes) se conectam a esse host.

### 1) Gateway sempre ativo no seu tailnet (VPS ou servidor doméstico)

Execute o Gateway em um host persistente e acesse-o por **Tailscale** ou SSH.

- **Melhor UX:** mantenha `gateway.bind: "loopback"` e use **Tailscale Serve** para a UI de Controle.
- **Fallback:** mantenha loopback + tunnel SSH a partir de qualquer máquina que precise de acesso.
- **Exemplos:** [exe.dev](/pt-BR/install/exe-dev) (VM simples) ou [Hetzner](/pt-BR/install/hetzner) (VPS de produção).

Isso é ideal quando seu laptop entra em suspensão com frequência, mas você quer o agente sempre ativo.

### 2) O desktop de casa executa o Gateway, o laptop é o controle remoto

O laptop **não** executa o agente. Ele se conecta remotamente:

- Use o modo **Remote over SSH** do app macOS (Configurações → Geral → “OpenClaw runs”).
- O app abre e gerencia o tunnel, então WebChat + verificações de integridade “simplesmente funcionam”.

Runbook: [Acesso remoto no macOS](/pt-BR/platforms/mac/remote).

### 3) O laptop executa o Gateway, acesso remoto a partir de outras máquinas

Mantenha o Gateway local, mas exponha-o com segurança:

- Tunnel SSH para o laptop a partir de outras máquinas, ou
- Tailscale Serve para a UI de Controle e mantenha o Gateway apenas em loopback.

Guia: [Tailscale](/pt-BR/gateway/tailscale) e [Visão geral da web](/pt-BR/web).

## Fluxo de comando (o que roda onde)

Um serviço de gateway controla estado + canais. Nodes são periféricos.

Exemplo de fluxo (Telegram → node):

- A mensagem do Telegram chega ao **Gateway**.
- O Gateway executa o **agente** e decide se deve chamar uma ferramenta de node.
- O Gateway chama o **node** pelo WebSocket do Gateway (RPC `node.*`).
- O node retorna o resultado; o Gateway responde de volta ao Telegram.

Observações:

- **Nodes não executam o serviço do gateway.** Apenas um gateway deve ser executado por host, a menos que você execute intencionalmente perfis isolados (consulte [Vários gateways](/pt-BR/gateway/multiple-gateways)).
- O “modo node” do app macOS é apenas um cliente node sobre o WebSocket do Gateway.

## Tunnel SSH (CLI + ferramentas)

Crie um tunnel local para o WS do Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Com o tunnel ativo:

- `openclaw health` e `openclaw status --deep` agora alcançam o gateway remoto via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` e `openclaw gateway call` também podem apontar para a URL encaminhada via `--url`, quando necessário.

Observação: substitua `18789` pela sua `gateway.port` configurada (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Observação: quando você passa `--url`, a CLI não usa fallback para credenciais de configuração nem de ambiente.
Inclua `--token` ou `--password` explicitamente. A ausência de credenciais explícitas é um erro.

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

Quando o gateway é apenas loopback, mantenha a URL em `ws://127.0.0.1:18789` e abra o tunnel SSH primeiro.

## Precedência de credenciais

A resolução de credenciais do gateway segue um contrato compartilhado entre caminhos de call/probe/status e monitoramento de aprovação de execução do Discord. Node-host usa o mesmo contrato base com uma exceção de modo local (ele ignora intencionalmente `gateway.remote.*`):

- Credenciais explícitas (`--token`, `--password` ou `gatewayToken` da ferramenta) sempre vencem em caminhos de chamada que aceitam autenticação explícita.
- Segurança de substituição de URL:
  - Substituições de URL da CLI (`--url`) nunca reutilizam credenciais implícitas de config/env.
  - Substituições de URL via env (`OPENCLAW_GATEWAY_URL`) podem usar apenas credenciais de env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Padrões de modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (o fallback remoto se aplica apenas quando a entrada de token de autenticação local não está definida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (o fallback remoto se aplica apenas quando a entrada de password de autenticação local não está definida)
- Padrões de modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exceção de modo local de node-host: `gateway.remote.token` / `gateway.remote.password` são ignorados.
- Verificações de token em probe/status remotos são estritas por padrão: elas usam apenas `gateway.remote.token` (sem fallback para token local) ao direcionar ao modo remoto.
- Substituições via env do Gateway usam apenas `OPENCLAW_GATEWAY_*`.

## UI de chat via SSH

O WebChat não usa mais uma porta HTTP separada. A UI de chat SwiftUI se conecta diretamente ao WebSocket do Gateway.

- Encaminhe `18789` por SSH (veja acima) e então conecte os clientes a `ws://127.0.0.1:18789`.
- No macOS, prefira o modo “Remote over SSH” do app, que gerencia o tunnel automaticamente.

## app macOS "Remote over SSH"

O app de barra de menu do macOS pode conduzir a mesma configuração de ponta a ponta (verificações remotas de status, WebChat e encaminhamento de Voice Wake).

Runbook: [Acesso remoto no macOS](/pt-BR/platforms/mac/remote).

## Regras de segurança (remoto/VPN)

Versão curta: **mantenha o Gateway apenas em loopback** a menos que você tenha certeza de que precisa de um bind.

- **Loopback + SSH/Tailscale Serve** é o padrão mais seguro (sem exposição pública).
- `ws://` em texto simples é apenas loopback por padrão. Para redes privadas confiáveis,
  defina `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como válvula de escape.
- **Binds sem loopback** (`lan`/`tailnet`/`custom`, ou `auto` quando loopback não está disponível) devem usar autenticação do gateway: token, password ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` são fontes de credenciais do cliente. Eles **não** configuram a autenticação do servidor por si só.
- Caminhos locais de chamada podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não puder ser resolvido, a resolução falha de forma fechada (sem fallback remoto mascarando).
- `gateway.remote.tlsFingerprint` faz pinning do certificado TLS remoto ao usar `wss://`.
- **Tailscale Serve** pode autenticar o tráfego da UI de Controle/WebSocket por headers de identidade quando `gateway.auth.allowTailscale: true`; endpoints da API HTTP não usam essa autenticação por header do Tailscale e seguem, em vez disso, o modo normal de autenticação HTTP do gateway. Esse fluxo sem token presume que o host do gateway seja confiável. Defina como `false` se você quiser autenticação por segredo compartilhado em todo lugar.
- A autenticação **trusted-proxy** é apenas para configurações sem loopback com proxy com reconhecimento de identidade.
  Proxies reversos em loopback no mesmo host não satisfazem `gateway.auth.mode: "trusted-proxy"`.
- Trate o controle do Browser como acesso de operador: apenas tailnet + pairing deliberado de node.

Aprofundamento: [Segurança](/pt-BR/gateway/security).

### macOS: tunnel SSH persistente via LaunchAgent

Para clientes macOS que se conectam a um gateway remoto, a configuração persistente mais fácil usa uma entrada `LocalForward` na configuração SSH mais um LaunchAgent para manter o tunnel ativo em reinicializações e falhas.

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

O tunnel iniciará automaticamente no login, reiniciará em caso de falha e manterá a porta encaminhada ativa.

Observação: se você tiver um LaunchAgent `com.openclaw.ssh-tunnel` remanescente de uma configuração antiga, descarregue-o e exclua-o.

#### Solução de problemas

Verifique se o tunnel está em execução:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicie o tunnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Pare o tunnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuração              | O que faz                                                    |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Encaminha a porta local 18789 para a porta remota 18789      |
| `ssh -N`                             | SSH sem executar comandos remotos (apenas encaminhamento de porta) |
| `KeepAlive`                          | Reinicia automaticamente o tunnel se ele falhar              |
| `RunAtLoad`                          | Inicia o tunnel quando o LaunchAgent é carregado no login    |

## Relacionado

- [Tailscale](/pt-BR/gateway/tailscale)
- [Autenticação](/pt-BR/gateway/authentication)
- [Configuração remota do gateway](/pt-BR/gateway/remote-gateway-readme)
