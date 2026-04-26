---
read_when:
    - Implantando o OpenClaw no Fly.io
    - Configurando volumes, segredos e a configuração da primeira execução no Fly
summary: Implantação passo a passo no Fly.io para o OpenClaw com armazenamento persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-26T11:31:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
    source_path: install/fly.md
    workflow: 15
---

# Implantação no Fly.io

**Objetivo:** Gateway do OpenClaw em execução em uma máquina do [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso a Discord/canais.

## O que você precisa

- [CLI `flyctl`](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Conta no Fly.io (o nível gratuito funciona)
- Autenticação de modelo: chave de API do provider de modelo escolhido
- Credenciais de canal: token de bot do Discord, token do Telegram etc.

## Caminho rápido para iniciantes

1. Clonar o repositório → personalizar `fly.toml`
2. Criar app + volume → definir segredos
3. Implantar com `fly deploy`
4. Entrar por SSH para criar a configuração ou usar a Control UI

<Steps>
  <Step title="Criar o app no Fly">
    ```bash
    # Clonar o repositório
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Criar um novo app Fly (escolha seu próprio nome)
    fly apps create my-openclaw

    # Criar um volume persistente (1GB geralmente é suficiente)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Dica:** Escolha uma região próxima de você. Opções comuns: `lhr` (Londres), `iad` (Virgínia), `sjc` (San Jose).

  </Step>

  <Step title="Configurar fly.toml">
    Edite `fly.toml` para corresponder ao nome do seu app e aos seus requisitos.

    **Observação de segurança:** A configuração padrão expõe uma URL pública. Para uma implantação reforçada sem IP público, consulte [Implantação privada](#private-deployment-hardened) ou use `fly.private.toml`.

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

    **Principais configurações:**

    | Configuração                  | Motivo                                                                      |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Faz bind em `0.0.0.0` para que o proxy do Fly consiga alcançar o gateway    |
    | `--allow-unconfigured`        | Inicia sem um arquivo de configuração (você criará um depois)               |
    | `internal_port = 3000`        | Deve corresponder a `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) para os health checks do Fly |
    | `memory = "2048mb"`           | 512MB é muito pouco; recomenda-se 2GB                                       |
    | `OPENCLAW_STATE_DIR = "/data"` | Persiste o estado no volume                                                |

  </Step>

  <Step title="Definir segredos">
    ```bash
    # Obrigatório: token do Gateway (para bind fora de loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Chaves de API do provider de modelo
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Opcional: outros providers
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Tokens de canal
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Observações:**

    - Binds fora de loopback (`--bind lan`) exigem um caminho válido de autenticação do gateway. Este exemplo do Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, mas `gateway.auth.password` ou uma implantação `trusted-proxy` corretamente configurada fora de loopback também atendem ao requisito.
    - Trate esses tokens como senhas.
    - **Prefira variáveis de ambiente em vez do arquivo de configuração** para todas as chaves de API e tokens. Isso mantém segredos fora de `openclaw.json`, onde poderiam ser expostos ou registrados em log acidentalmente.

  </Step>

  <Step title="Implantar">
    ```bash
    fly deploy
    ```

    A primeira implantação faz build da imagem Docker (~2–3 minutos). As implantações seguintes são mais rápidas.

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

  <Step title="Criar o arquivo de configuração">
    Entre por SSH na máquina para criar uma configuração adequada:

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

    **Observação:** Substitua `https://my-openclaw.fly.dev` pela origem real do seu app Fly. A inicialização do Gateway pré-configura origens locais da Control UI a partir dos valores de runtime de `--bind` e `--port`, para que o primeiro boot possa prosseguir antes de a configuração existir, mas o acesso pelo navegador via Fly ainda precisa da origem HTTPS exata listada em `gateway.controlUi.allowedOrigins`.

    **Observação:** O token do Discord pode vir de:

    - Variável de ambiente: `DISCORD_BOT_TOKEN` (recomendado para segredos)
    - Arquivo de configuração: `channels.discord.token`

    Se usar variável de ambiente, não há necessidade de adicionar o token à configuração. O gateway lê `DISCORD_BOT_TOKEN` automaticamente.

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

    Ou visite `https://my-openclaw.fly.dev/`

    Autentique-se com o segredo compartilhado configurado. Este guia usa o token do gateway de `OPENCLAW_GATEWAY_TOKEN`; se você mudou para autenticação por senha, use essa senha.

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

O gateway está fazendo bind em `127.0.0.1` em vez de `0.0.0.0`.

**Correção:** Adicione `--bind lan` ao comando do processo em `fly.toml`.

### Health checks falhando / conexão recusada

O Fly não consegue alcançar o gateway na porta configurada.

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

**Observação:** 512MB é muito pouco. 1GB pode funcionar, mas pode causar OOM sob carga ou com logs detalhados. **Recomendam-se 2GB.**

### Problemas de lock do Gateway

O Gateway se recusa a iniciar com erros de "already running".

Isso acontece quando o contêiner reinicia, mas o arquivo de lock do PID permanece no volume.

**Correção:** Exclua o arquivo de lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

O arquivo de lock fica em `/data/gateway.*.lock` (não em um subdiretório).

### A configuração não está sendo lida

`--allow-unconfigured` apenas ignora a proteção de inicialização. Ele não cria nem repara `/data/openclaw.json`, então verifique se sua configuração real existe e inclui `gateway.mode="local"` quando você quer uma inicialização local normal do gateway.

Verifique se a configuração existe:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Gravando configuração via SSH

O comando `fly ssh console -C` não oferece suporte a redirecionamento de shell. Para gravar um arquivo de configuração:

```bash
# Use echo + tee (pipe do local para o remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Ou use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Observação:** `fly sftp` pode falhar se o arquivo já existir. Exclua antes:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Estado não persistente

Se você perder perfis de autenticação, estado de canal/provider ou sessões após uma reinicialização,
o diretório de estado está sendo gravado no sistema de arquivos do contêiner.

**Correção:** Garanta que `OPENCLAW_STATE_DIR=/data` esteja definido em `fly.toml` e reimplante.

## Atualizações

```bash
# Baixar as alterações mais recentes
git pull

# Reimplantar
fly deploy

# Verificar a integridade
fly status
fly logs
```

### Atualizando o comando da máquina

Se você precisar alterar o comando de inicialização sem uma reimplantação completa:

```bash
# Obter o ID da máquina
fly machines list

# Atualizar o comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou com aumento de memória
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Observação:** Após `fly deploy`, o comando da máquina pode voltar para o que está em `fly.toml`. Se você fez alterações manuais, reaplique-as após a implantação.

## Implantação privada (reforçada)

Por padrão, o Fly aloca IPs públicos, tornando seu gateway acessível em `https://your-app.fly.dev`. Isso é conveniente, mas significa que sua implantação é detectável por scanners da internet (Shodan, Censys etc.).

Para uma implantação reforçada com **nenhuma exposição pública**, use o template privado.

### Quando usar implantação privada

- Você faz apenas chamadas/mensagens **de saída** (sem Webhooks de entrada)
- Você usa túneis **ngrok ou Tailscale** para callbacks de Webhook
- Você acessa o gateway via **SSH, proxy ou WireGuard** em vez do navegador
- Você quer que a implantação fique **oculta de scanners da internet**

### Configuração

Use `fly.private.toml` em vez da configuração padrão:

```bash
# Implantar com configuração privada
fly deploy -c fly.private.toml
```

Ou converta uma implantação existente:

```bash
# Listar IPs atuais
fly ips list -a my-openclaw

# Liberar IPs públicos
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Mudar para a configuração privada para que implantações futuras não realoquem IPs públicos
# (remova [http_service] ou implante com o template privado)
fly deploy -c fly.private.toml

# Alocar IPv6 somente privado
fly ips allocate-v6 --private -a my-openclaw
```

Depois disso, `fly ips list` deve mostrar apenas um IP do tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Acessando uma implantação privada

Como não há URL pública, use um destes métodos:

**Opção 1: Proxy local (mais simples)**

```bash
# Encaminhar a porta local 3000 para o app
fly proxy 3000:3000 -a my-openclaw

# Depois abra http://localhost:3000 no navegador
```

**Opção 2: VPN WireGuard**

```bash
# Criar configuração do WireGuard (uma vez)
fly wireguard create

# Importar no cliente WireGuard e depois acessar via IPv6 interno
# Exemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opção 3: Somente SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks com implantação privada

Se você precisar de callbacks de Webhook (Twilio, Telnyx etc.) sem exposição pública:

1. **Túnel ngrok** - Execute o ngrok dentro do contêiner ou como sidecar
2. **Tailscale Funnel** - Exponha caminhos específicos via Tailscale
3. **Somente saída** - Alguns providers (Twilio) funcionam bem para chamadas de saída sem Webhooks

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

O túnel ngrok é executado dentro do contêiner e fornece uma URL pública de Webhook sem expor o próprio app Fly. Defina `webhookSecurity.allowedHosts` para o hostname público do túnel para que cabeçalhos de host encaminhados sejam aceitos.

### Benefícios de segurança

| Aspecto           | Público      | Privado    |
| ----------------- | ------------ | ---------- |
| Scanners da internet | Detectável | Oculto     |
| Ataques diretos   | Possíveis    | Bloqueados |
| Acesso à Control UI | Navegador  | Proxy/VPN  |
| Entrega de Webhook | Direta      | Via túnel  |

## Observações

- O Fly.io usa **arquitetura x86** (não ARM)
- O Dockerfile é compatível com ambas as arquiteturas
- Para onboarding de WhatsApp/Telegram, use `fly ssh console`
- Dados persistentes ficam no volume em `/data`
- O Signal exige Java + signal-cli; use uma imagem personalizada e mantenha a memória em 2GB+.

## Custo

Com a configuração recomendada (`shared-cpu-2x`, 2GB de RAM):

- ~US$ 10–15/mês, dependendo do uso
- O nível gratuito inclui alguma franquia

Consulte [preços do Fly.io](https://fly.io/docs/about/pricing/) para detalhes.

## Próximos passos

- Configurar canais de mensagens: [Canais](/pt-BR/channels)
- Configurar o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Manter o OpenClaw atualizado: [Atualizando](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Hetzner](/pt-BR/install/hetzner)
- [Docker](/pt-BR/install/docker)
- [Hospedagem VPS](/pt-BR/vps)
