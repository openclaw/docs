---
read_when:
    - Implantação do OpenClaw no Fly.io
    - Configuração de volumes, segredos e configuração inicial do Fly
summary: Implantação passo a passo do OpenClaw na Fly.io com armazenamento persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T00:00:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Objetivo:** executar o OpenClaw Gateway em uma máquina do [Fly.io](https://fly.io) com armazenamento persistente, HTTPS automático e acesso ao Discord/a canais.

## O que você precisa

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalada
- Conta no Fly.io (o plano gratuito funciona)
- Autenticação do modelo: chave de API do provedor de modelo escolhido
- Credenciais dos canais: token do bot do Discord, token do Telegram etc.

## Caminho rápido para iniciantes

1. Clone o repositório e personalize o `fly.toml`
2. Crie o aplicativo e o volume e defina os segredos
3. Implante com `fly deploy`
4. Acesse via SSH para criar a configuração ou use a interface de controle

<Steps>
  <Step title="Criar o aplicativo no Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # escolha seu próprio nome
    fly apps create my-openclaw

    # 1 GB geralmente é suficiente
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Escolha uma região próxima de você. Opções comuns: `lhr` (Londres), `iad` (Virgínia), `sjc` (San José).

  </Step>

  <Step title="Configurar o fly.toml">
    Edite o `fly.toml` de acordo com o nome e os requisitos do seu aplicativo. O `fly.toml` versionado no repositório é o modelo público mostrado abaixo; `deploy/fly.private.toml` é a variante reforçada sem IP público (consulte [Implantação privada](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nome do seu aplicativo
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

    O ponto de entrada da imagem Docker do OpenClaw é `tini`, que executa `node openclaw.mjs gateway` por padrão. A seção `[processes]` do Fly substitui o `CMD` do Docker (aqui, ela executa diretamente `node dist/index.js gateway ...`, o mesmo ponto de entrada compilado) sem alterar o `ENTRYPOINT`; portanto, o processo continua sendo executado sob o `tini`.

    **Configurações principais:**

    | Configuração                    | Motivo                                                                                         |
    | ------------------------------ | ---------------------------------------------------------------------------------------------- |
    | `--bind lan`                   | Vincula a `0.0.0.0` para que o proxy do Fly consiga acessar o Gateway                          |
    | `--allow-unconfigured`         | Inicia sem um arquivo de configuração (você o cria depois)                                     |
    | `internal_port = 3000`         | Deve corresponder a `--port 3000` (ou `OPENCLAW_GATEWAY_PORT`) para as verificações de integridade do Fly |
    | `memory = "2048mb"`            | 512 MB é insuficiente; recomenda-se 2 GB                                                       |
    | `OPENCLAW_STATE_DIR = "/data"` | Mantém o estado persistente no volume                                                          |

  </Step>

  <Step title="Definir os segredos">
    ```bash
    # obrigatório: token de autenticação do Gateway para vinculação fora do loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # chaves de API dos provedores de modelo
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # opcional: outros provedores
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # tokens dos canais
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Vinculações fora do loopback (`--bind lan`) exigem um caminho válido de autenticação do Gateway. Este exemplo usa `OPENCLAW_GATEWAY_TOKEN`, mas `gateway.auth.password` ou uma implantação de proxy confiável fora do loopback configurada corretamente também atendem ao requisito. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets) para conhecer o contrato de SecretRef.

    Trate esses tokens como senhas. Para chaves de API e tokens, prefira variáveis de ambiente/`fly secrets` ao arquivo de configuração, para que os segredos não sejam armazenados no `openclaw.json`.

  </Step>

  <Step title="Implantar">
    ```bash
    fly deploy
    ```

    A primeira implantação compila a imagem Docker. Verifique após a implantação:

    ```bash
    fly status
    fly logs
    ```

    Os logs de inicialização do Gateway exibem `gateway ready` quando o listener HTTP/WebSocket está ativo. A própria verificação de integridade do Fly monitora `internal_port = 3000` conforme o `fly.toml`; a diretiva `HEALTHCHECK` do Docker da imagem também consulta `/healthz` na porta padrão 18789, que não é usada aqui porque esta implantação substitui a porta do Gateway por `--port 3000`.

  </Step>

  <Step title="Criar o arquivo de configuração">
    Acesse a máquina via SSH para criar uma configuração adequada:

    ```bash
    fly ssh console
    ```

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

    Com `OPENCLAW_STATE_DIR=/data`, o caminho da configuração é `/data/openclaw.json`.

    Substitua `https://my-openclaw.fly.dev` pela origem real do seu aplicativo no Fly. Na inicialização, o Gateway preenche as origens locais da interface de controle usando os valores de `--bind` e `--port` do ambiente de execução, permitindo que a primeira inicialização prossiga antes da existência da configuração; porém, o acesso pelo navegador por meio do Fly ainda exige que a origem HTTPS exata esteja listada em `gateway.controlUi.allowedOrigins`.

    O token do Discord pode vir de uma destas fontes:

    - Variável de ambiente `DISCORD_BOT_TOKEN` (recomendada para segredos); não é necessário adicioná-la à configuração, pois o Gateway a lê automaticamente
    - Arquivo de configuração `channels.discord.token`

    Reinicie para aplicar:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Acessar o Gateway">
    ### Interface de controle

    ```bash
    fly open
    ```

    Ou acesse `https://my-openclaw.fly.dev/`.

    Autentique-se com o segredo compartilhado configurado: o token do Gateway em `OPENCLAW_GATEWAY_TOKEN` ou sua senha, caso tenha mudado para autenticação por senha.

    ### Logs

    ```bash
    fly logs              # logs em tempo real
    fly logs --no-tail    # logs recentes
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Solução de problemas

### "O aplicativo não está escutando no endereço esperado"

O Gateway está vinculado a `127.0.0.1` em vez de `0.0.0.0`.

**Correção:** adicione `--bind lan` ao comando do processo no `fly.toml`.

### Falha nas verificações de integridade/conexão recusada

O Fly não consegue acessar o Gateway na porta configurada.

**Correção:** confirme que `internal_port` corresponde à porta do Gateway (`--port 3000` ou `OPENCLAW_GATEWAY_PORT=3000`).

### OOM/problemas de memória

O contêiner continua reiniciando ou sendo encerrado. Sinais: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` ou reinicializações silenciosas.

**Correção:** aumente a memória no `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Ou atualize uma máquina existente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB é insuficiente. 1 GB pode funcionar, mas pode ocorrer OOM sob carga ou com logs detalhados. Recomenda-se 2 GB.

### Problemas com o bloqueio do Gateway

O Gateway se recusa a iniciar com erros de "já está em execução" após a reinicialização de um contêiner.

O arquivo de bloqueio de instância única fica em `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), e não no volume persistente `/data`; portanto, uma reinicialização completa do contêiner normalmente o remove com o restante do sistema de arquivos do contêiner. Se o bloqueio persistir (por exemplo, após um `fly machine restart` que preserve o sistema de arquivos do contêiner) e impedir a inicialização, remova-o manualmente:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### A configuração não está sendo lida

`--allow-unconfigured` apenas ignora a proteção de inicialização. Ele não cria nem repara `/data/openclaw.json`; portanto, confirme que sua configuração real existe e inclui `"gateway": { "mode": "local" }` para uma inicialização local normal do Gateway.

Verifique se a configuração existe:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Gravar a configuração via SSH

`fly ssh console -C` não oferece suporte ao redirecionamento do shell. Para gravar um arquivo de configuração:

```bash
# echo + tee (encaminhe do ambiente local para o remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# ou sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` pode falhar se o arquivo já existir; exclua-o primeiro:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### O estado não está persistindo

Se você perder perfis de autenticação, o estado de canais/provedores ou sessões após uma reinicialização, o diretório de estado está sendo gravado no sistema de arquivos do contêiner em vez do volume.

**Correção:** confirme que `OPENCLAW_STATE_DIR=/data` está definido no `fly.toml` e implante novamente.

## Atualização

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` é o caminho supervisionado neste caso: ele recompila a imagem a partir do Dockerfile, de modo que a versão da CLI/do Gateway, a imagem base do sistema operacional e todas as alterações no Dockerfile sejam atualizadas em conjunto. Executar `openclaw update` dentro do contêiner em execução não é a mesma operação, pois a imagem é distribuída como uma árvore `dist/` compilada pelo Docker, sem checkout do `.git` e sem uma instalação global gerenciada pelo npm que possa ser detectada; consulte [Atualização](/pt-BR/install/updating) para conhecer esse fluxo em instalações no estilo de máquinas virtuais.

### Atualizar o comando da máquina

Para alterar o comando de inicialização sem uma reimplantação completa:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# ou com aumento de memória
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Uma execução posterior de `fly deploy` redefine o comando da máquina para o valor especificado no `fly.toml`; reaplique as alterações manuais após a reimplantação.

## Implantação privada (reforçada)

Por padrão, o Fly aloca IPs públicos, de modo que seu Gateway fica acessível em `https://your-app.fly.dev` e pode ser descoberto por mecanismos de varredura da internet (Shodan, Censys etc.).

Use `deploy/fly.private.toml` para uma implantação reforçada **sem IP público**: ele omite `[http_service]`, portanto nenhum acesso público de entrada é alocado.

### Quando usar uma implantação privada

- Somente chamadas/mensagens de saída (sem Webhooks de entrada)
- Túneis ngrok ou Tailscale processam quaisquer retornos de chamada de Webhooks
- O acesso ao Gateway é feito via SSH, proxy ou WireGuard, em vez de um navegador
- A implantação deve ficar oculta dos mecanismos de varredura da internet

### Configuração

```bash
fly deploy -c deploy/fly.private.toml
```

Ou converta uma implantação existente:

```bash
# liste os IPs atuais
fly ips list -a my-openclaw

# libere os IPs públicos
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# mude para a configuração privada para que futuras implantações não realoquem IPs públicos
fly deploy -c deploy/fly.private.toml

# aloque um IPv6 exclusivamente privado
fly ips allocate-v6 --private -a my-openclaw
```

Depois disso, `fly ips list` deve mostrar apenas um IP do tipo `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Como acessar uma implantação privada

**Opção 1: proxy local (mais simples)**

```bash
fly proxy 3000:3000 -a my-openclaw
# abra http://localhost:3000 em um navegador
```

**Opção 2: VPN WireGuard**

```bash
fly wireguard create
# importe para um cliente WireGuard e acesse pelo IPv6 interno
# exemplo: http://[fdaa:x:x:x:x::x]:3000
```

**Opção 3: somente SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhooks com implantação privada

Para retornos de chamada de Webhook (Twilio, Telnyx etc.) sem exposição pública:

1. **Túnel ngrok**: execute o ngrok dentro do contêiner ou como um sidecar
2. **Tailscale Funnel**: exponha caminhos específicos pelo Tailscale
3. **Somente saída**: alguns provedores (Twilio) funcionam para chamadas de saída sem Webhooks

Exemplo de configuração de chamada de voz com ngrok, em `plugins.entries.voice-call.config`:

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

O túnel ngrok é executado dentro do contêiner e fornece uma URL pública de Webhook sem expor o próprio aplicativo Fly. Defina `webhookSecurity.allowedHosts` como o nome do host do túnel para que os cabeçalhos de host encaminhados sejam aceitos.

### Compromissos de segurança

| Aspecto                    | Público     | Privado          |
| -------------------------- | ----------- | ---------------- |
| Rastreadores da internet   | Detectável  | Oculto           |
| Ataques diretos            | Possíveis   | Bloqueados       |
| Acesso à interface de controle | Navegador | Proxy/VPN     |
| Entrega de Webhook         | Direta      | Por túnel        |

## Observações

- O Fly.io usa arquitetura x86; o Dockerfile é compatível com x86 e ARM.
- Para a integração inicial do WhatsApp/Telegram, use `fly ssh console`.
- Os dados persistentes ficam no volume em `/data`.
- O Signal requer o signal-cli (uma CLI baseada em Java) na imagem; use uma imagem personalizada e mantenha pelo menos 2 GB de memória.

## Custo

Com a configuração recomendada (`shared-cpu-2x`, 2 GB de RAM), espere um custo aproximado de US$ 10 a US$ 15 por mês, dependendo do uso; o nível gratuito cobre parte da franquia básica. Consulte os [preços do Fly.io](https://fly.io/docs/about/pricing/) para ver os valores atuais.

## Próximas etapas

- Configure os canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)

## Relacionado

- [Visão geral da instalação](/pt-BR/install)
- [Hetzner](/pt-BR/install/hetzner)
- [Docker](/pt-BR/install/docker)
- [Hospedagem em VPS](/pt-BR/vps)
