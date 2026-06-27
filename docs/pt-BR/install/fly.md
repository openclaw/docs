---
read_when:
    - Implantando o OpenClaw no Fly.io
    - Configurando volumes, segredos e a configuração de primeira execução do Fly
summary: Implantação passo a passo do OpenClaw no Fly.io com armazenamento persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:38:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**Meta:** OpenClaw Gateway em execução em uma máquina [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso a Discord/canais.

## O que você precisa

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) instalado
- Conta Fly.io (o plano gratuito funciona)
- Autenticação de modelo: chave de API para o provedor de modelo escolhido
- Credenciais de canal: token de bot do Discord, token do Telegram, etc.

## Caminho rápido para iniciantes

1. Clone o repositório → personalize `fly.toml`
2. Crie o app + volume → defina secrets
3. Faça deploy com `fly deploy`
4. Entre via SSH para criar a configuração ou use a Control UI

<Steps>
  <Step title="Criar o app Fly">
    ```bash
    # Clone o repositório
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Crie um novo app Fly (escolha seu próprio nome)
    fly apps create my-openclaw

    # Crie um volume persistente (1 GB geralmente é suficiente)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Dica:** Escolha uma região próxima de você. Opções comuns: `lhr` (Londres), `iad` (Virgínia), `sjc` (San Jose).

  </Step>

  <Step title="Configurar fly.toml">
    Edite `fly.toml` para corresponder ao nome e aos requisitos do seu app.

    **Nota de segurança:** A configuração padrão expõe uma URL pública. Para um deploy reforçado sem IP público, consulte [Deploy privado](#private-deployment-hardened) ou use `deploy/fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Nome do seu app
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

    A imagem Docker do OpenClaw usa `tini` como entrypoint. Os comandos de processo do Fly substituem o `CMD` do Docker sem substituir o `ENTRYPOINT`, então o processo ainda executa sob `tini`.

    **Configurações principais:**

    | Configuração                  | Por quê                                                                    |
    | ----------------------------- | -------------------------------------------------------------------------- |
    | `--bind lan`                  | Vincula a `0.0.0.0` para que o proxy do Fly consiga alcançar o Gateway     |
    | `--allow-unconfigured`        | Inicia sem um arquivo de configuração (você criará um depois)              |
    | `internal_port = 3000`        | Deve corresponder a `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) para health checks do Fly |
    | `memory = "2048mb"`           | 512 MB é pouco demais; 2 GB recomendado                                    |
    | `OPENCLAW_STATE_DIR = "/data"` | Persiste o estado no volume                                                |

  </Step>

  <Step title="Definir secrets">
    ```bash
    # Obrigatório: token do Gateway (para binding não loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Chaves de API do provedor de modelo
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Opcional: outros provedores
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Tokens de canal
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **Observações:**

    - Bindings não loopback (`--bind lan`) exigem um caminho válido de autenticação do Gateway. Este exemplo do Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, mas `gateway.auth.password` ou um deploy `trusted-proxy` não loopback configurado corretamente também atendem ao requisito.
    - Trate esses tokens como senhas.
    - **Prefira variáveis de ambiente ao arquivo de configuração** para todas as chaves de API e tokens. Isso mantém secrets fora de `openclaw.json`, onde poderiam ser expostos ou registrados acidentalmente.

  </Step>

  <Step title="Fazer deploy">
    ```bash
    fly deploy
    ```

    O primeiro deploy cria a imagem Docker (~2 a 3 minutos). Deploys posteriores são mais rápidos.

    Após o deploy, verifique:

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
    Entre via SSH na máquina para criar uma configuração adequada:

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

    **Observação:** Substitua `https://my-openclaw.fly.dev` pela origem real do seu app Fly. A inicialização do Gateway semeia origens locais da Control UI a partir dos valores de runtime `--bind` e `--port` para que a primeira inicialização possa prosseguir antes de a configuração existir, mas o acesso pelo navegador via Fly ainda precisa da origem HTTPS exata listada em `gateway.controlUi.allowedOrigins`.

    **Observação:** O token do Discord pode vir de:

    - Variável de ambiente: `DISCORD_BOT_TOKEN` (recomendado para secrets)
    - Arquivo de configuração: `channels.discord.token`

    Se usar variável de ambiente, não é necessário adicionar o token à configuração. O Gateway lê `DISCORD_BOT_TOKEN` automaticamente.

    Reinicie para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acessar o Gateway">
    ### Control UI

    Abra no navegador:

    ```bash
    fly open
    ```

    Ou acesse `https://my-openclaw.fly.dev/`

    Autentique-se com o segredo compartilhado configurado. Este guia usa o token do Gateway de `OPENCLAW_GATEWAY_TOKEN`; se você mudou para autenticação por senha, use essa senha.

    ### Logs

    ```bash
    fly logs              # Logs ao vivo
    fly logs --no-tail    # Logs recentes
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Solução de problemas

### "App is not listening on expected address"

O Gateway está fazendo bind em `127.0.0.1` em vez de `0.0.0.0`.

**Correção:** Adicione `--bind lan` ao comando de processo em `fly.toml`.

### Health checks falhando / conexão recusada

O Fly não consegue alcançar o Gateway na porta configurada.

**Correção:** Garanta que `internal_port` corresponda à porta do Gateway (defina `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

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

**Observação:** 512 MB é pouco demais. 1 GB pode funcionar, mas pode sofrer OOM sob carga ou com logging detalhado. **2 GB é recomendado.**

### Problemas de lock do Gateway

O Gateway se recusa a iniciar com erros de "already running".

Isso acontece quando o contêiner reinicia, mas o arquivo de lock de PID persiste no volume.

**Correção:** Exclua o arquivo de lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

O arquivo de lock fica em `/data/gateway.*.lock` (não em um subdiretório).

### Configuração não está sendo lida

`--allow-unconfigured` apenas ignora a proteção de inicialização. Ele não cria nem repara `/data/openclaw.json`, então garanta que sua configuração real exista e inclua `gateway.mode="local"` quando quiser uma inicialização normal do Gateway local.

Verifique se a configuração existe:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Escrevendo configuração via SSH

O comando `fly ssh console -C` não oferece suporte a redirecionamento de shell. Para escrever um arquivo de configuração:

```bash
# Use echo + tee (pipe do local para o remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Ou use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Observação:** `fly sftp` pode falhar se o arquivo já existir. Exclua primeiro:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Estado não persistindo

Se você perder perfis de autenticação, estado de canal/provedor ou sessões após uma reinicialização, o diretório de estado está gravando no sistema de arquivos do contêiner.

**Correção:** Garanta que `OPENCLAW_STATE_DIR=/data` esteja definido em `fly.toml` e faça redeploy.

## Atualizações

```bash
# Baixe as alterações mais recentes
git pull

# Faça redeploy
fly deploy

# Verifique a integridade
fly status
fly logs
```

### Atualizando o comando da máquina

Se você precisar alterar o comando de inicialização sem um redeploy completo:

```bash
# Obtenha o ID da máquina
fly machines list

# Atualize o comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou com aumento de memória
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Observação:** Após `fly deploy`, o comando da máquina pode ser redefinido para o que está em `fly.toml`. Se você fez alterações manuais, reaplique-as após o deploy.

## Deploy privado (reforçado)

Por padrão, o Fly aloca IPs públicos, tornando seu Gateway acessível em `https://your-app.fly.dev`. Isso é conveniente, mas significa que seu deploy pode ser descoberto por scanners da internet (Shodan, Censys, etc.).

Para um deploy reforçado sem **nenhuma exposição pública**, use o template privado.

### Quando usar deploy privado

- Você faz apenas chamadas/mensagens **de saída** (sem webhooks de entrada)
- Você usa túneis **ngrok ou Tailscale** para quaisquer callbacks de Webhook
- Você acessa o Gateway via **SSH, proxy ou WireGuard** em vez do navegador
- Você quer o deploy **oculto de scanners da internet**

### Configuração

Use `deploy/fly.private.toml` em vez da configuração padrão:

```bash
# Faça deploy com a configuração privada
fly deploy -c deploy/fly.private.toml
```

Ou converta um deploy existente:

```bash
# Liste os IPs atuais
fly ips list -a my-openclaw

# Libere IPs públicos
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Mude para a configuração privada para que deploys futuros não realoquem IPs públicos
# (remova [http_service] ou faça deploy com o template privado)
fly deploy -c deploy/fly.private.toml

# Aloque IPv6 somente privado
fly ips allocate-v6 --private -a my-openclaw
```

Depois disso, `fly ips list` deve mostrar apenas um IP do tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acessando um deploy privado

Como não há URL pública, use um destes métodos:

**Opção 1: Proxy local (mais simples)**

```bash
# Encaminhe a porta local 3000 para o app
fly proxy 3000:3000 -a my-openclaw

# Depois abra http://localhost:3000 no navegador
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

Se você precisar de callbacks de Webhook (Twilio, Telnyx etc.) sem exposição pública:

1. **Túnel ngrok** - Execute o ngrok dentro do contêiner ou como sidecar
2. **Tailscale Funnel** - Exponha caminhos específicos via Tailscale
3. **Somente saída** - Alguns provedores (Twilio) funcionam bem para chamadas de saída sem Webhooks

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

O túnel ngrok é executado dentro do contêiner e fornece uma URL pública de Webhook sem expor o próprio app Fly. Defina `webhookSecurity.allowedHosts` como o nome de host público do túnel para que os cabeçalhos de host encaminhados sejam aceitos.

### Benefícios de segurança

| Aspecto                | Público      | Privado    |
| ---------------------- | ------------ | ---------- |
| Scanners da internet   | Detectável   | Oculto     |
| Ataques diretos        | Possíveis    | Bloqueados |
| Acesso à UI de controle | Navegador   | Proxy/VPN  |
| Entrega de Webhook     | Direta       | Via túnel  |

## Observações

- O Fly.io usa **arquitetura x86** (não ARM)
- O Dockerfile é compatível com ambas as arquiteturas
- Para onboarding do WhatsApp/Telegram, use `fly ssh console`
- Dados persistentes ficam no volume em `/data`
- O Signal requer Java + signal-cli; use uma imagem personalizada e mantenha a memória em 2 GB ou mais.

## Custo

Com a configuração recomendada (`shared-cpu-2x`, 2 GB de RAM):

- ~US$ 10-15/mês, dependendo do uso
- O nível gratuito inclui alguma cota

Veja [preços da Fly.io](https://fly.io/docs/about/pricing/) para detalhes.

## Próximos passos

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Hetzner](/pt-BR/install/hetzner)
- [Docker](/pt-BR/install/docker)
- [Hospedagem VPS](/pt-BR/vps)
