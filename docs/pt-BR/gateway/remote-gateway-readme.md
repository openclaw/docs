---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Configuração de túnel SSH para conectar o OpenClaw.app a um Gateway remoto
title: Configuração do Gateway remoto
x-i18n:
    generated_at: "2026-04-30T09:50:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: fccc75e672bf3295c335fc4d2f610e9cbb3f1882edd12ffb9d009120291bd2d9
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

> Este conteúdo foi incorporado a [Acesso remoto](/pt-BR/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Consulte essa página para o guia atual.

# Executando o OpenClaw.app com um Gateway remoto

O OpenClaw.app usa tunelamento SSH para se conectar a um Gateway remoto. Este guia mostra como configurá-lo.

## Visão geral

```mermaid
flowchart TB
    subgraph Client["Client Machine"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(local port)"]
        T["SSH Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Remote Machine"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Configuração rápida

### Etapa 1: Adicionar configuração SSH

Edite `~/.ssh/config` e adicione:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Substitua `<REMOTE_IP>` e `<REMOTE_USER>` pelos seus valores.

### Etapa 2: Copiar a chave SSH

Copie sua chave pública para a máquina remota (digite a senha uma vez):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Etapa 3: Configurar a autenticação do Gateway remoto

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Use `gateway.remote.password` como alternativa se o seu Gateway remoto usar autenticação por senha.
`OPENCLAW_GATEWAY_TOKEN` ainda é válido como uma substituição no nível do shell, mas a configuração durável
do cliente remoto é `gateway.remote.token` / `gateway.remote.password`.

### Etapa 4: Iniciar o túnel SSH

```bash
ssh -N remote-gateway &
```

### Etapa 5: Reiniciar o OpenClaw.app

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

O aplicativo agora se conectará ao Gateway remoto por meio do túnel SSH.

---

## Iniciar o túnel automaticamente ao fazer login

Para que o túnel SSH seja iniciado automaticamente quando você fizer login, crie um Launch Agent.

### Criar o arquivo PLIST

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

### Carregar o Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

O túnel agora irá:

- Iniciar automaticamente quando você fizer login
- Reiniciar se falhar
- Continuar em execução em segundo plano

Observação legada: remova qualquer LaunchAgent `com.openclaw.ssh-tunnel` remanescente, se presente.

---

## Solução de problemas

**Verifique se o túnel está em execução:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Reinicie o túnel:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Pare o túnel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Como funciona

| Componente                           | O que ele faz                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Encaminha a porta local 18789 para a porta remota 18789      |
| `ssh -N`                             | SSH sem executar comandos remotos (apenas encaminhamento de porta) |
| `KeepAlive`                          | Reinicia automaticamente o túnel se ele falhar               |
| `RunAtLoad`                          | Inicia o túnel quando o agente é carregado                   |

O OpenClaw.app se conecta a `ws://127.0.0.1:18789` na sua máquina cliente. O túnel SSH encaminha essa conexão para a porta 18789 na máquina remota onde o Gateway está em execução.

## Relacionado

- [Acesso remoto](/pt-BR/gateway/remote)
- [Tailscale](/pt-BR/gateway/tailscale)
