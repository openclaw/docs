---
read_when:
    - Implantação do OpenClaw no Upstash Box
    - Você quer um ambiente Linux gerenciado para o OpenClaw com acesso ao painel por túnel SSH
summary: Hospede o OpenClaw no Upstash Box com keep-alive e acesso por túnel SSH
title: Caixa do Upstash
x-i18n:
    generated_at: "2026-07-12T00:01:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Execute um Gateway persistente do OpenClaw no Upstash Box, um ambiente Linux gerenciado
com suporte ao ciclo de vida keep-alive.

Use um túnel SSH para acessar o painel. Não exponha a porta do Gateway diretamente
à internet pública.

## Pré-requisitos

- Conta no Upstash
- Upstash Box com keep-alive
- Cliente SSH em sua máquina local

## Criar um Box

Crie um Box com keep-alive no Upstash Console. Anote o ID do Box (por exemplo,
`right-flamingo-14486`) e sua chave de API do Box.

O Upstash mantém seu guia atual do OpenClaw Box em
[Configuração do OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Conectar com um túnel SSH

Encaminhe a porta do painel do OpenClaw para sua máquina local. Use sua chave de API do Box
como senha SSH quando solicitado:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

As opções de keepalive reduzem as interrupções do túnel por inatividade durante a integração inicial.

## Instalar o OpenClaw

Dentro do Box:

```bash
sudo npm install -g openclaw
```

## Executar a integração inicial

```bash
openclaw onboard --install-daemon
```

Siga as instruções. Copie a URL do painel e o token quando a integração inicial for concluída.

## Iniciar o Gateway

Configure o Gateway para a rede do Box e inicie-o em segundo plano:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Com o túnel SSH ativo, abra localmente a URL do painel:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Reinicialização automática

Defina este comando como o script de inicialização do Box para que o Gateway seja reiniciado quando o Box
iniciar:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Solução de problemas

Se o SSH travar durante a integração inicial, reconecte usando uma configuração SSH limpa e
keepalives:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Isso ignora configurações locais obsoletas de `~/.ssh/config` e mantém o túnel ativo
durante períodos de inatividade da rede.

## Relacionados

- [Acesso remoto](/pt-BR/gateway/remote)
- [Segurança do Gateway](/pt-BR/gateway/security)
- [Atualização do OpenClaw](/pt-BR/install/updating)
