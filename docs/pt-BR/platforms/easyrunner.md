---
read_when:
    - Implantando o OpenClaw no EasyRunner
    - Executando o Gateway por trás do proxy Caddy do EasyRunner
    - Escolhendo volumes persistentes e autenticação para um Gateway hospedado
summary: Execute o OpenClaw Gateway no EasyRunner com Podman e Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:42:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner pode hospedar o Gateway do OpenClaw como um pequeno app conteinerizado atrás de seu
proxy Caddy. Este guia pressupõe um host EasyRunner que executa apps Compose compatíveis com
Podman e expõe HTTPS por meio do Caddy.

## Antes de começar

- Um servidor EasyRunner com um domínio roteado para ele.
- Uma imagem de contêiner do OpenClaw criada ou publicada.
- Um volume de configuração persistente para `/home/node/.openclaw`.
- Um volume de workspace persistente para `/workspace`.
- Um token ou senha forte do Gateway.

Mantenha a autenticação de dispositivo habilitada quando possível. Se sua implantação de proxy reverso não conseguir
transportar corretamente a identidade do dispositivo, corrija primeiro as configurações de proxy confiável; use
contornos perigosos de autenticação somente para uma rede totalmente privada e controlada pelo operador.

## App Compose

Crie um app EasyRunner com um arquivo Compose estruturado assim:

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
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Substitua `openclaw.example.com` pelo nome de host do seu Gateway. Armazene
`OPENCLAW_GATEWAY_TOKEN` no gerenciador de segredos/ambiente do EasyRunner em vez de
confirmá-lo na definição do app.

## Configurar o OpenClaw

Dentro do volume de configuração persistente, mantenha o Gateway acessível somente por meio
do proxy e exija autenticação:

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

Se o Caddy encerrar TLS para o Gateway, configure as configurações de proxy confiável para
o caminho exato do proxy em vez de desabilitar verificações de autenticação globalmente. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

## Verificar

A partir da sua estação de trabalho:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

A partir do host EasyRunner, verifique nos logs do app se há um Gateway em escuta e se não há
falhas de autenticação de SecretRef, Plugin ou canal na inicialização.

## Atualizações e backups

- Baixe ou crie a nova imagem do OpenClaw e, em seguida, reimplante o app EasyRunner.
- Faça backup do volume `openclaw-config` antes das atualizações.
- Faça backup de `openclaw-workspace` se agentes gravarem dados de projeto duráveis ali.
- Execute `openclaw doctor` após atualizações importantes para identificar migrações de configuração e
  avisos de serviço.

## Solução de problemas

- `gateway probe` não consegue se conectar: confirme que o nome de host do Caddy aponta para o app
  e que o contêiner escuta em `0.0.0.0:1455`.
- A autenticação falha: altere o token nos segredos do EasyRunner e no comando do cliente local
  juntos.
- Os arquivos pertencem ao root após a restauração: repare os volumes montados para que o
  usuário do contêiner possa gravar em `/home/node/.openclaw` e `/workspace`.
- Plugins de navegador ou canal falham: verifique se os binários externos necessários, a saída de rede
  e as credenciais montadas estão disponíveis dentro do contêiner.
