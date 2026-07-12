---
read_when:
    - Você quer um host Linux barato e sempre ativo para o Gateway
    - Você quer acesso remoto à interface de controle sem executar seu próprio VPS
summary: Execute o Gateway do OpenClaw no exe.dev (VM + proxy HTTPS) para acesso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T00:02:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**Objetivo:** Gateway do OpenClaw em execução em uma VM da [exe.dev](https://exe.dev), acessível em `https://<vm-name>.exe.xyz`.

Este guia pressupõe a imagem padrão **exeuntu** da exe.dev. Adapte os pacotes conforme necessário em outras distribuições.

## O que você precisa

- Conta da exe.dev
- Acesso via `ssh exe.dev` às VMs da exe.dev (opcional, para configuração manual)

## Caminho rápido para iniciantes

1. Abra [https://exe.new/openclaw](https://exe.new/openclaw)
2. Preencha sua chave/token de autenticação conforme necessário
3. Clique em "Agent" ao lado da sua VM e aguarde Shelley concluir o provisionamento
4. Abra `https://<vm-name>.exe.xyz/` e autentique-se com o segredo compartilhado configurado (autenticação por token por padrão; a autenticação por senha também funciona se você alterar `gateway.auth.mode`)
5. Aprove as solicitações pendentes de pareamento de dispositivos com `openclaw devices approve <requestId>`

## Instalação automatizada com Shelley

Shelley, o agente da exe.dev, pode instalar o OpenClaw a partir de um prompt:

```text
Configure o OpenClaw (https://docs.openclaw.ai/install) nesta VM. Use os sinalizadores de modo não interativo e de aceitação de risco no processo de integração do OpenClaw. Adicione a autenticação ou o token fornecido conforme necessário. Configure o nginx para encaminhar da porta padrão 18789 para o local raiz na configuração padrão de site habilitada, certificando-se de habilitar o suporte a WebSocket. O pareamento é feito com "openclaw devices list" e "openclaw devices approve <request id>". Certifique-se de que o painel mostre que a integridade do OpenClaw está OK. A exe.dev gerencia para nós o encaminhamento da porta 8000 para as portas 80/443 e o HTTPS, portanto o endereço "acessível" final deve ser <vm-name>.exe.xyz, sem especificação de porta.
```

## Instalação manual

<Steps>
  <Step title="Criar a VM">
    No seu dispositivo:

    ```bash
    ssh exe.dev new
    ```

    Em seguida, conecte-se:

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    Mantenha esta VM **com estado persistente**. O OpenClaw armazena `openclaw.json`, arquivos `auth-profiles.json` por agente, sessões e o estado de canais/provedores em `~/.openclaw/`, além do espaço de trabalho em `~/.openclaw/workspace/`.
    </Tip>

  </Step>

  <Step title="Instalar os pré-requisitos (na VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="Instalar o OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Configurar o nginx como proxy para a porta 8000">
    Edite `/etc/nginx/sites-enabled/default`:

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # Suporte a WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # Cabeçalhos padrão do proxy
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Configurações de tempo limite para conexões de longa duração
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    Sobrescreva os cabeçalhos de encaminhamento em vez de preservar cadeias fornecidas pelo cliente. O OpenClaw confia nos metadados de IP encaminhados somente quando provenientes de proxies configurados explicitamente, e cadeias `X-Forwarded-For` com anexação são tratadas como um risco de proteção.

  </Step>

  <Step title="Acessar o OpenClaw e aprovar dispositivos">
    Abra `https://<vm-name>.exe.xyz/` (consulte a saída da interface de controle durante a integração). Se uma autenticação for solicitada, cole o segredo compartilhado configurado na VM.

    Este guia usa autenticação por token por padrão; portanto, obtenha `gateway.auth.token` com `openclaw config get gateway.auth.token` ou gere um novo com `openclaw doctor --n`. Se você alterou o Gateway para autenticação por senha, use `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.

    Aprove dispositivos com `openclaw devices list` e `openclaw devices approve <requestId>`. Em caso de dúvida, use Shelley no navegador.

  </Step>
</Steps>

## Configuração remota de canais

Para hosts remotos, prefira uma única chamada `config patch` em vez de várias chamadas SSH para `config set`. Mantenha os tokens reais no ambiente da VM ou em `~/.openclaw/.env` e coloque somente SecretRefs em `openclaw.json`. Consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets) para ver o contrato completo de SecretRef.

Na VM, faça com que o ambiente do serviço contenha os segredos necessários:

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

Na sua máquina local, crie um arquivo de patch e envie-o por pipe para a VM:

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

Use `--replace-path` quando uma lista de permissões aninhada precisar se tornar exatamente o valor do patch, por exemplo, ao substituir a lista de permissões de um canal do Discord:

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

Consulte [Discord](/pt-BR/channels/discord) e [Slack](/pt-BR/channels/slack) para ver a referência completa de configuração dos canais.

## Acesso remoto

A exe.dev gerencia a autenticação do acesso remoto. Por padrão, o tráfego HTTP da porta 8000 é encaminhado para `https://<vm-name>.exe.xyz` com autenticação por e-mail.

## Atualização

```bash
openclaw update
```

Consulte [Atualização](/pt-BR/install/updating) para ver como alternar canais e realizar a recuperação manual.

## Relacionados

- [Gateway remoto](/pt-BR/gateway/remote)
- [Visão geral da instalação](/pt-BR/install)
