---
read_when:
    - Implantando o OpenClaw no Fly.io
    - Configurando volumes, segredos e configuração de primeira execução do Fly
summary: Implantação passo a passo do OpenClaw no Fly.io com armazenamento persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-05-10T19:38:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2f6f56d22f01fc3729bafc47337e12dfad626a8b0bebb60bc4b49757d6cd1d3
    source_path: install/fly.md
    workflow: 16
---

**Objetivo:** Gateway do OpenClaw em execução em uma máquina da [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso ao Discord/canal.

## O que você precisa

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Conta Fly.io (o plano gratuito funciona)
- Autenticação do modelo: chave de API para o provedor de modelo escolhido
- Credenciais do canal: token de bot do Discord, token do Telegram etc.

## Caminho rápido para iniciantes

1. Clone o repositório → personalize `fly.toml`
2. Crie o app + volume → defina os segredos
3. Implante com `fly deploy`
4. Acesse via SSH para criar a configuração ou use a UI de Controle

<Steps>
  <Step title="Criar o app Fly">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Dica:** Escolha uma região próxima de você. Opções comuns: `lhr` (Londres), `iad` (Virgínia), `sjc` (San Jose).

  </Step>

  <Step title="Configurar fly.toml">
    Edite `fly.toml` para corresponder ao nome e aos requisitos do seu app.

    **Observação de segurança:** A configuração padrão expõe uma URL pública. Para uma implantação reforçada sem IP público, consulte [Implantação privada](#private-deployment-hardened) ou use `deploy/fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    A imagem Docker do OpenClaw usa `tini` como entrypoint. Os comandos de processo da Fly substituem o `CMD` do Docker sem substituir o `ENTRYPOINT`, então o processo ainda é executado sob o `tini`.

    **Configurações principais:**

    | Configuração                   | Motivo                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Vincula a `0.0.0.0` para que o proxy da Fly consiga acessar o gateway       |
    | `--allow-unconfigured`         | Inicia sem um arquivo de configuração (você criará um depois)               |
    | `internal_port = 3000`         | Deve corresponder a `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) para as verificações de integridade da Fly |
    | `memory = "2048mb"`            | 512 MB é pouco demais; 2 GB é recomendado                                   |
    | `OPENCLAW_STATE_DIR = "/data"` | Persiste o estado no volume                                                 |

  </Step>

  <Step title="Definir segredos">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Observações:**

    - Vínculos não loopback (`--bind lan`) exigem um caminho válido de autenticação do gateway. Este exemplo da Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, mas `gateway.auth.password` ou uma implantação `trusted-proxy` não loopback configurada corretamente também satisfazem o requisito.
    - Trate esses tokens como senhas.
    - **Prefira variáveis de ambiente em vez de arquivo de configuração** para todas as chaves de API e tokens. Isso mantém os segredos fora de `openclaw.json`, onde poderiam ser expostos ou registrados acidentalmente.

  </Step>

  <Step title="Implantar">
    ```bash
    fly deploy
    ```

    A primeira implantação compila a imagem Docker (~2 a 3 minutos). Implantações posteriores são mais rápidas.

    Após a implantação, verifique:

    ```bash
    fly status
    fly logs
    ```

    Você deve ver:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Criar arquivo de configuração">
    Acesse a máquina via SSH para criar uma configuração adequada:

    ```bash
    fly ssh console
    ```

    Crie o diretório e o arquivo de configuração:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Observação:** Com `OPENCLAW_STATE_DIR=/data`, o caminho da configuração é `/data/openclaw.json`.

    **Observação:** Substitua `https://my-openclaw.fly.dev` pela origem real do seu app Fly. A inicialização do Gateway semeia origens locais da UI de Controle a partir dos valores de runtime `--bind` e `--port`, para que a primeira inicialização possa prosseguir antes que a configuração exista, mas o acesso pelo navegador via Fly ainda precisa da origem HTTPS exata listada em `gateway.controlUi.allowedOrigins`.

    **Observação:** O token do Discord pode vir de:

    - Variável de ambiente: `DISCORD_BOT_TOKEN` (recomendado para segredos)
    - Arquivo de configuração: `channels.discord.token`

    Se usar variável de ambiente, não é necessário adicionar o token à configuração. O gateway lê `DISCORD_BOT_TOKEN` automaticamente.

    Reinicie para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acessar o Gateway">
    ### UI de Controle

    Abra no navegador:

    ```bash
    fly open
    ```

    Ou acesse `https://my-openclaw.fly.dev/`

    Autentique-se com o segredo compartilhado configurado. Este guia usa o token do gateway de `OPENCLAW_GATEWAY_TOKEN`; se você mudou para autenticação por senha, use essa senha.

    ### Logs

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Solução de problemas

### "App is not listening on expected address"

O gateway está vinculando a `127.0.0.1` em vez de `0.0.0.0`.

**Correção:** Adicione `--bind lan` ao comando de processo em `fly.toml`.

### Verificações de integridade falhando / conexão recusada

A Fly não consegue acessar o gateway na porta configurada.

**Correção:** Garanta que `internal_port` corresponda à porta do gateway (defina `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / Problemas de memória

O contêiner continua reiniciando ou sendo encerrado. Sinais: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou reinicializações silenciosas.

**Correção:** Aumente a memória em `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Ou atualize uma máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Observação:** 512 MB é pouco demais. 1 GB pode funcionar, mas pode gerar OOM sob carga ou com logs verbosos. **2 GB é recomendado.**

### Problemas de bloqueio do Gateway

O Gateway se recusa a iniciar com erros de "already running".

Isso acontece quando o contêiner reinicia, mas o arquivo de bloqueio de PID persiste no volume.

**Correção:** Exclua o arquivo de bloqueio:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

O arquivo de bloqueio fica em `/data/gateway.*.lock` (não em um subdiretório).

### Configuração não está sendo lida

`--allow-unconfigured` apenas ignora a proteção de inicialização. Ele não cria nem repara `/data/openclaw.json`, então verifique se sua configuração real existe e inclui `gateway.mode="local"` quando você quiser uma inicialização normal do gateway local.

Verifique se a configuração existe:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Gravar configuração via SSH

O comando `fly ssh console -C` não oferece suporte a redirecionamento de shell. Para gravar um arquivo de configuração:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Observação:** `fly sftp` pode falhar se o arquivo já existir. Exclua primeiro:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Estado não está persistindo

Se você perder perfis de autenticação, estado de canal/provedor ou sessões após uma reinicialização, o diretório de estado está gravando no sistema de arquivos do contêiner.

**Correção:** Garanta que `OPENCLAW_STATE_DIR=/data` esteja definido em `fly.toml` e reimplante.

## Atualizações

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Atualizar comando da máquina

Se você precisar alterar o comando de inicialização sem uma reimplantação completa:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Observação:** Após `fly deploy`, o comando da máquina pode voltar ao que está em `fly.toml`. Se você fez alterações manuais, reaplique-as após a implantação.

## Implantação privada (reforçada)

Por padrão, a Fly aloca IPs públicos, tornando seu gateway acessível em `https://your-app.fly.dev`. Isso é conveniente, mas significa que sua implantação pode ser descoberta por scanners da internet (Shodan, Censys etc.).

Para uma implantação reforçada **sem exposição pública**, use o modelo privado.

### Quando usar implantação privada

- Você faz apenas chamadas/mensagens **de saída** (sem webhooks de entrada)
- Você usa túneis **ngrok ou Tailscale** para quaisquer callbacks de Webhook
- Você acessa o gateway via **SSH, proxy ou WireGuard** em vez do navegador
- Você quer que a implantação fique **oculta de scanners da internet**

### Configuração

Use `deploy/fly.private.toml` em vez da configuração padrão:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Ou converta uma implantação existente:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Depois disso, `fly ips list` deve mostrar apenas um IP do tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acessar uma implantação privada

Como não há URL pública, use um destes métodos:

**Opção 1: Proxy local (mais simples)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Opção 2: VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Opção 3: somente SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks com implantação privada

Se você precisar de callbacks de webhook (Twilio, Telnyx etc.) sem exposição pública:

1. **Túnel ngrok** - Execute o ngrok dentro do contêiner ou como sidecar
2. **Tailscale Funnel** - Exponha caminhos específicos via Tailscale
3. **Somente saída** - Alguns provedores (Twilio) funcionam bem para chamadas de saída sem webhooks

Exemplo de configuração de chamada de voz com ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

O túnel ngrok é executado dentro do contêiner e fornece uma URL pública de webhook sem expor o próprio app Fly. Defina `webhookSecurity.allowedHosts` como o hostname público do túnel para que os cabeçalhos de host encaminhados sejam aceitos.

### Benefícios de segurança

| Aspecto                 | Público     | Privado    |
| ----------------------- | ----------- | ---------- |
| Scanners da internet    | Detectável  | Oculto     |
| Ataques diretos         | Possíveis   | Bloqueados |
| Acesso à interface de controle | Navegador | Proxy/VPN  |
| Entrega de webhook      | Direta      | Via túnel  |

## Observações

- A Fly.io usa **arquitetura x86** (não ARM)
- O Dockerfile é compatível com ambas as arquiteturas
- Para onboarding do WhatsApp/Telegram, use `fly ssh console`
- Dados persistentes ficam no volume em `/data`
- Signal requer Java + signal-cli; use uma imagem personalizada e mantenha a memória em 2 GB ou mais.

## Custo

Com a configuração recomendada (`shared-cpu-2x`, 2 GB de RAM):

- Cerca de US$ 10-15/mês, dependendo do uso
- O plano gratuito inclui uma cota

Consulte [preços da Fly.io](https://fly.io/docs/about/pricing/) para obter detalhes.

## Próximos passos

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Hetzner](/pt-BR/install/hetzner)
- [Docker](/pt-BR/install/docker)
- [Hospedagem VPS](/pt-BR/vps)
