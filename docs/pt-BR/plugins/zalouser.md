---
read_when:
    - Você quer suporte ao Zalo Personal (não oficial) no OpenClaw
    - Você está configurando ou desenvolvendo o Plugin zalouser
summary: 'Plugin Zalo Personal: login por QR + mensagens via zca-js nativo (instalação do Plugin + configuração do canal + ferramenta)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-24T06:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Suporte a Zalo Personal para OpenClaw via um Plugin, usando `zca-js` nativo para automatizar uma conta de usuário Zalo normal.

> **Aviso:** automação não oficial pode levar à suspensão/banimento da conta. Use por sua conta e risco.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Onde ele roda

Este Plugin roda **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure-o na **máquina que executa o Gateway** e depois reinicie o Gateway.

Nenhum binário externo `zca`/`openzca` CLI é necessário.

## Instalação

### Opção A: instalar pelo npm

```bash
openclaw plugins install @openclaw/zalouser
```

Reinicie o Gateway depois.

### Opção B: instalar a partir de uma pasta local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway depois.

## Configuração

A configuração do canal fica em `channels.zalouser` (não em `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Ferramenta do agente

Nome da ferramenta: `zalouser`

Ações: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Ações de mensagem do canal também oferecem suporte a `react` para reações em mensagens.

## Relacionados

- [Building plugins](/pt-BR/plugins/building-plugins)
- [Community plugins](/pt-BR/plugins/community)
