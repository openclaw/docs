---
read_when:
    - Implantar o OpenClaw no Fly.io
    - Configurar volumes, segredos e a configuração da primeira execução no Fly.io
summary: Implantação passo a passo no Fly.io para o OpenClaw com armazenamento persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-24T05:57:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8913b6917c23de69865c57ec6a455f3e615bc65b09334edec0a3fe8ff69cf503
    source_path: install/fly.md
    workflow: 15
---

# Implantação no Fly.io

**Objetivo:** Gateway do OpenClaw em execução em uma máquina do [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso a Discord/canais.

## O que você precisa

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Conta no Fly.io (o nível gratuito funciona)
- Autenticação de modelo: chave de API do provider de modelo escolhido
- Credenciais de canal: token de bot do Discord, token do Telegram etc.

## Caminho rápido para iniciantes

1. Clone o repositório → personalize `fly.toml`
2. Crie app + volume → defina segredos
3. Implante com `fly deploy`
4. Entre por SSH para criar a configuração ou use a interface do Control

<Steps>
  <Step title="Crie o app no Fly">
    ```bash
    # Clone o repositório
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Crie um novo app no Fly (escolha seu próprio nome)
    fly apps create my-openclaw

    # Crie um volume persistente (1GB geralmente é suficiente)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Dica:** Escolha uma região próxima de você. Opções comuns: `lhr` (Londres), `iad` (Virgínia), `sjc` (San Jose).

  </Step>

  <Step title="Configure o fly.toml">
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

    **Configurações principais:**

    | Configuração                  | Motivo                                                                      |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Faz bind em `0.0.0.0` para que o proxy do Fly consiga alcançar o gateway    |
    | `--allow-unconfigured`        | Inicia sem arquivo de configuração (você criará um depois)                  |
    | `internal_port = 3000`        | Deve corresponder a `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) para health checks do Fly |
    | `memory = "2048mb"`           | 512MB é muito pouco; 2GB recomendado                                        |
    | `OPENCLAW_STATE_DIR = "/data"`| Persiste o estado no volume                                                 |

  </Step>

  <Step title="Defina os segredos">
    ```bash
    # Obrigatório: token do Gateway (para bind sem loopback)
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

    - Binds sem loopback (`--bind lan`) exigem um caminho válido de autenticação do gateway. Este exemplo do Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, mas `gateway.auth.password` ou uma implantação `trusted-proxy` sem loopback corretamente configurada também atendem ao requisito.
    - Trate esses tokens como senhas.
    - **Prefira variáveis de ambiente em vez de arquivo de configuração** para todas as chaves de API e tokens. Isso mantém segredos fora de `openclaw.json`, onde poderiam ser expostos ou registrados em log acidentalmente.

  </Step>

  <Step title="Implante">
    ```bash
    fly deploy
    ```

    A primeira implantação compila a imagem Docker (~2-3 minutos). Implantações seguintes são mais rápidas.

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

  <Step title="Crie o arquivo de configuração">
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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Observação:** Com `OPENCLAW_STATE_DIR=/data`, o caminho da configuração é `/data/openclaw.json`.

    **Observação:** O token do Discord pode vir de:

    - Variável de ambiente: `DISCORD_BOT_TOKEN` (recomendado para segredos)
    - Arquivo de configuração: `channels.discord.token`

    Se estiver usando variável de ambiente, não é necessário adicionar o token à configuração. O gateway lê `DISCORD_BOT_TOKEN` automaticamente.

    Reinicie para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acesse o Gateway">
    ### Interface do Control

    Abra no navegador:

    ```bash
    fly open
    ```

    Ou visite `https://my-openclaw.fly.dev/`

    Autentique-se com o segredo compartilhado configurado. Este guia usa o token do gateway de `OPENCLAW_GATEWAY_TOKEN`; se você trocou para autenticação por senha, use
    essa senha no lugar.

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

**Correção:** Adicione `--bind lan` ao comando do processo no `fly.toml`.

### Health checks falhando / connection refused

O Fly não consegue alcançar o gateway na porta configurada.

**Correção:** Verifique se `internal_port` corresponde à porta do gateway (defina `--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

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

**Observação:** 512MB é muito pouco. 1GB pode funcionar, mas pode causar OOM sob carga ou com logs detalhados. **2GB é recomendado.**

### Problemas de lock do Gateway

O Gateway se recusa a iniciar com erros de "already running".

Isso acontece quando o contêiner reinicia, mas o arquivo de lock PID persiste no volume.

**Correção:** Exclua o arquivo de lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

O arquivo de lock fica em `/data/gateway.*.lock` (não em um subdiretório).

### Configuração não está sendo lida

`--allow-unconfigured` apenas ignora a verificação de inicialização. Ele não cria nem repara `/data/openclaw.json`, então certifique-se de que sua configuração real existe e inclui `gateway.mode="local"` quando você quiser uma inicialização normal de gateway local.

Verifique se a configuração existe:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Gravar configuração via SSH

O comando `fly ssh console -C` não oferece suporte a redirecionamento de shell. Para gravar um arquivo de configuração:

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

### Estado não está persistindo

Se você perder perfis de autenticação, estado de canal/provider ou sessões após um reinício,
o diretório de estado está sendo gravado no sistema de arquivos do contêiner.

**Correção:** Verifique se `OPENCLAW_STATE_DIR=/data` está definido em `fly.toml` e reimplante.

## Atualizações

```bash
# Buscar as alterações mais recentes
git pull

# Reimplantar
fly deploy

# Verificar integridade
fly status
fly logs
```

### Atualizar comando da máquina

Se você precisar alterar o comando de inicialização sem uma reimplantação completa:

```bash
# Obter o ID da máquina
fly machines list

# Atualizar comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Ou com aumento de memória
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Observação:** Após `fly deploy`, o comando da máquina pode voltar ao que está em `fly.toml`. Se você fez alterações manuais, reaplique-as depois da implantação.

## Implantação privada (reforçada)

Por padrão, o Fly aloca IPs públicos, tornando seu gateway acessível em `https://your-app.fly.dev`. Isso é conveniente, mas significa que sua implantação pode ser descoberta por scanners da internet (Shodan, Censys etc.).

Para uma implantação reforçada com **nenhuma exposição pública**, use o template privado.

### Quando usar implantação privada

- Você faz apenas chamadas/mensagens **de saída** (sem Webhooks de entrada)
- Você usa túneis **ngrok ou Tailscale** para quaisquer callbacks de Webhook
- Você acessa o gateway via **SSH, proxy ou WireGuard** em vez do navegador
- Você quer a implantação **oculta de scanners da internet**

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

# Trocar para configuração privada para que implantações futuras não realoquem IPs públicos
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

### Acessar uma implantação privada

Como não há URL pública, use um destes métodos:

**Opção 1: Proxy local (mais simples)**

```bash
# Encaminhar a porta local 3000 para o app
fly proxy 3000:3000 -a my-openclaw

# Depois abra http://localhost:3000 no navegador
```

**Opção 2: VPN WireGuard**

```bash
# Criar configuração WireGuard (uma vez)
fly wireguard create

# Importe no cliente WireGuard, depois acesse via IPv6 interno
# Exemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opção 3: Apenas SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks com implantação privada

Se você precisar de callbacks de Webhook (Twilio, Telnyx etc.) sem exposição pública:

1. **Túnel ngrok** - Execute o ngrok dentro do contêiner ou como sidecar
2. **Tailscale Funnel** - Exponha caminhos específicos via Tailscale
3. **Somente saída** - Alguns providers (Twilio) funcionam bem para chamadas de saída sem Webhooks

Exemplo de configuração de voice-call com ngrok:

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

O túnel ngrok é executado dentro do contêiner e fornece uma URL pública de Webhook sem expor o próprio app do Fly. Defina `webhookSecurity.allowedHosts` como o hostname público do túnel para que cabeçalhos de host encaminhados sejam aceitos.

### Benefícios de segurança

| Aspecto           | Público      | Privado    |
| ----------------- | ------------ | ---------- |
| Scanners da internet | Detectável | Oculto     |
| Ataques diretos   | Possíveis    | Bloqueados |
| Acesso à interface do Control | Navegador | Proxy/VPN |
| Entrega de Webhook | Direta      | Via túnel  |

## Observações

- O Fly.io usa **arquitetura x86** (não ARM)
- O Dockerfile é compatível com ambas as arquiteturas
- Para onboarding de WhatsApp/Telegram, use `fly ssh console`
- Dados persistentes ficam no volume em `/data`
- O Signal exige Java + signal-cli; use uma imagem personalizada e mantenha a memória em 2GB+.

## Custo

Com a configuração recomendada (`shared-cpu-2x`, 2GB RAM):

- ~US$10-15/mês, dependendo do uso
- O nível gratuito inclui alguma franquia

Consulte [preços do Fly.io](https://fly.io/docs/about/pricing/) para detalhes.

## Próximos passos

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Hetzner](/pt-BR/install/hetzner)
- [Docker](/pt-BR/install/docker)
- [Hospedagem VPS](/pt-BR/vps)
