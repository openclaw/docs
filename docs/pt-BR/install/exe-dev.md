---
read_when:
    - Você quer um host Linux barato e sempre ativo para o Gateway
    - Você quer acesso remoto à UI de Controle sem administrar seu próprio VPS
summary: Executar o Gateway OpenClaw no exe.dev (VM + proxy HTTPS) para acesso remoto
title: exe.dev
x-i18n:
    generated_at: "2026-04-24T05:57:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ec992a734dc55c190d5ef3bdd020aa12e9613958a87d8998727264f6f3d3c1f
    source_path: install/exe-dev.md
    workflow: 15
---

Objetivo: Gateway OpenClaw em execução em uma VM do exe.dev, acessível do seu laptop via: `https://<vm-name>.exe.xyz`

Esta página assume a imagem padrão **exeuntu** do exe.dev. Se você escolheu outra distro, adapte os pacotes conforme necessário.

## Caminho rápido para iniciantes

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. Preencha sua chave/token de autenticação conforme necessário
3. Clique em "Agent" ao lado da sua VM e aguarde a Shelley concluir o provisionamento
4. Abra `https://<vm-name>.exe.xyz/` e autentique com o segredo compartilhado configurado (este guia usa autenticação por token por padrão, mas autenticação por senha também funciona se você mudar `gateway.auth.mode`)
5. Aprove solicitações pendentes de pairing de dispositivo com `openclaw devices approve <requestId>`

## O que você precisa

- Conta no exe.dev
- Acesso `ssh exe.dev` às máquinas virtuais do [exe.dev](https://exe.dev) (opcional)

## Instalação automatizada com Shelley

A Shelley, agente do [exe.dev](https://exe.dev), pode instalar o OpenClaw instantaneamente com nosso
prompt. O prompt usado é o seguinte:

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## Instalação manual

## 1) Criar a VM

A partir do seu dispositivo:

```bash
ssh exe.dev new
```

Depois conecte-se:

```bash
ssh <vm-name>.exe.xyz
```

Dica: mantenha esta VM **stateful**. O OpenClaw armazena `openclaw.json`, `auth-profiles.json`
por agente, sessões e estado de canal/provedor em
`~/.openclaw/`, além do workspace em `~/.openclaw/workspace/`.

## 2) Instalar pré-requisitos (na VM)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) Instalar o OpenClaw

Execute o script de instalação do OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) Configurar o nginx para fazer proxy do OpenClaw para a porta 8000

Edite `/etc/nginx/sites-enabled/default` com:

```
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

        # Cabeçalhos padrão de proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Configurações de timeout para conexões de longa duração
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Substitua os headers de encaminhamento em vez de preservar cadeias fornecidas pelo cliente.
O OpenClaw confia em metadados de IP encaminhados apenas de proxies explicitamente configurados,
e cadeias `X-Forwarded-For` em estilo append são tratadas como um risco de endurecimento.

## 5) Acessar o OpenClaw e conceder privilégios

Acesse `https://<vm-name>.exe.xyz/` (veja a saída da UI de Controle no onboarding). Se pedir autenticação, cole o
segredo compartilhado configurado na VM. Este guia usa autenticação por token, então recupere `gateway.auth.token`
com `openclaw config get gateway.auth.token` (ou gere um com `openclaw doctor --generate-gateway-token`).
Se você mudou o gateway para autenticação por senha, use `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`.
Aprove dispositivos com `openclaw devices list` e `openclaw devices approve <requestId>`. Em caso de dúvida, use a Shelley no navegador!

## Acesso remoto

O acesso remoto é tratado pela autenticação do [exe.dev](https://exe.dev). Por
padrão, o tráfego HTTP da porta 8000 é encaminhado para `https://<vm-name>.exe.xyz`
com autenticação por email.

## Atualizando

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

Guia: [Atualizando](/pt-BR/install/updating)

## Relacionado

- [Gateway remoto](/pt-BR/gateway/remote)
- [Visão geral da instalação](/pt-BR/install)
