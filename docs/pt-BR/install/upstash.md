---
read_when:
    - Implantando o OpenClaw no Upstash Box
    - Você quer um ambiente Linux gerenciado para OpenClaw com acesso ao painel por túnel SSH
summary: Hospede o OpenClaw no Upstash Box com keep-alive e acesso por túnel SSH
title: Caixa Upstash
x-i18n:
    generated_at: "2026-06-27T17:39:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw no Upstash Box, um ambiente Linux gerenciado
com suporte ao ciclo de vida keep-alive.

Use um túnel SSH para acessar o dashboard. Não exponha a porta do Gateway diretamente
à internet pública.

## Pré-requisitos

- Conta Upstash
- Upstash Box com keep-alive
- Cliente SSH na sua máquina local

## Criar uma Box

Crie uma Box com keep-alive no Upstash Console. Anote o ID da Box, como
`right-flamingo-14486`, e sua chave de API da Box.

A Upstash mantém seu passo a passo atual da Box para OpenClaw em
[Configuração do OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Conectar com um túnel SSH

Encaminhe a porta do dashboard do OpenClaw para sua máquina local. Use sua chave de API da Box
como senha SSH quando solicitado:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

As opções de keepalive reduzem quedas do túnel por inatividade durante a integração inicial.

## Instalar o OpenClaw

Dentro da Box:

```bash
sudo npm install -g openclaw
```

## Executar a integração inicial

```bash
openclaw onboard --install-daemon
```

Siga as instruções. Copie a URL e o token do dashboard quando a integração inicial terminar.

## Iniciar o Gateway

Configure o Gateway para a rede da Box e inicie-o em segundo plano:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Com o túnel SSH ativo, abra a URL do dashboard localmente:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Reinício automático

Defina este comando como o script de inicialização da Box para que o Gateway reinicie quando a Box
iniciar:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Solução de problemas

Se o SSH travar durante a integração inicial, reconecte com uma configuração SSH limpa e
keepalives:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Isso ignora configurações locais obsoletas em `~/.ssh/config` e mantém o túnel ativo
durante períodos de inatividade da rede.

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Segurança do Gateway](/pt-BR/gateway/security)
- [Atualizar o OpenClaw](/pt-BR/install/updating)
