---
read_when:
    - Implantando o OpenClaw no EasyRunner
    - Executando o Gateway por trás do proxy Caddy do EasyRunner
    - Escolhendo volumes persistentes e autenticação para um Gateway hospedado
summary: Execute o Gateway do OpenClaw no EasyRunner com Podman e Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T00:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

O EasyRunner hospeda o Gateway do OpenClaw como um pequeno aplicativo em contêiner por trás de seu proxy Caddy. Este guia pressupõe um host EasyRunner que executa aplicativos Compose compatíveis com Podman e encerra conexões HTTPS por meio do Caddy.

## Antes de começar

- Um servidor EasyRunner com um domínio direcionado para ele.
- A imagem oficial do OpenClaw (`ghcr.io/openclaw/openclaw`) ou uma compilação própria.
- Um volume persistente de configuração para `/home/node/.openclaw`.
- Um volume persistente de espaço de trabalho para `/home/node/.openclaw/workspace`.
- Um token ou uma senha forte para o Gateway.

Mantenha a autenticação de dispositivo ativada quando possível. Se o seu proxy reverso não conseguir transmitir corretamente a identidade do dispositivo, corrija primeiro as configurações de proxy confiável (consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)); use métodos perigosos para ignorar a autenticação somente em uma rede totalmente privada e controlada pelo operador.

## Aplicativo Compose

Crie um aplicativo EasyRunner com um arquivo Compose estruturado assim:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Substitua `openclaw.example.com` pelo nome do host do seu Gateway. Armazene `OPENCLAW_GATEWAY_TOKEN` no gerenciador de segredos/ambiente do EasyRunner em vez de incluí-lo na definição do aplicativo. Por padrão, a imagem se vincula ao local loopback, portanto, a opção explícita `--bind lan --port 1455` em `command` é necessária para que o Caddy consiga acessar o contêiner.

## Configurar o OpenClaw

Dentro do volume persistente de configuração, mantenha o Gateway acessível somente por meio do proxy e exija autenticação:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Se o Caddy encerrar o TLS para o Gateway, defina as configurações de proxy confiável para o caminho exato do proxy, em vez de desativar globalmente as verificações de autenticação. Consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

## Verificar

Na sua estação de trabalho:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

No host EasyRunner, `GET /healthz` (atividade) e `GET /readyz` (prontidão) não exigem autenticação e dão suporte à verificação de integridade de contêiner integrada à imagem. Verifique também nos logs do aplicativo se o Gateway está escutando e se não há falhas de inicialização relacionadas a SecretRef, Plugin ou autenticação de canal.

## Atualizações e backups

- Baixe ou compile a nova imagem do OpenClaw e, em seguida, reimplante o aplicativo EasyRunner.
- Faça backup do volume `openclaw-config` antes das atualizações. Ele contém `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` e o estado dos pacotes de Plugins instalados.
- Faça backup de `openclaw-workspace` se os agentes gravarem nele dados persistentes de projetos.
- Execute `openclaw doctor` após atualizações importantes para detectar migrações de configuração e avisos de serviço.

## Solução de problemas

- `gateway probe` não consegue se conectar: confirme se o nome do host do Caddy aponta para o aplicativo e se o contêiner está escutando em `0.0.0.0:1455`.
- Falha na autenticação: altere simultaneamente o token nos segredos do EasyRunner e no comando do cliente local.
- Os arquivos pertencem ao usuário root após a restauração: a imagem é executada como `node` (uid 1000); corrija os volumes montados para que esse usuário possa gravar em `/home/node/.openclaw` e `/home/node/.openclaw/workspace`.
- Falha nos Plugins de navegador ou canal: verifique se os binários externos necessários, o acesso de saída à rede e as credenciais montadas estão disponíveis dentro do contêiner.
