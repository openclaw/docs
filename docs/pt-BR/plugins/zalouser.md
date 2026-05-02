---
read_when:
    - Você quer suporte ao Zalo Personal (não oficial) no OpenClaw
    - Você está configurando ou desenvolvendo o plugin zalouser
summary: 'Plugin Zalo Personal: login por QR + envio de mensagens via zca-js nativo (instalação do Plugin + configuração do canal + ferramenta)'
title: Plugin pessoal do Zalo
x-i18n:
    generated_at: "2026-05-02T22:21:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Suporte ao Zalo Personal para OpenClaw por meio de um Plugin, usando `zca-js` nativo para automatizar uma conta normal de usuário do Zalo.

<Warning>
A automação não oficial pode levar à suspensão ou ao banimento da conta. Use por sua conta e risco.
</Warning>

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível integração futura com a API oficial do Zalo.

## Onde ele é executado

Este Plugin é executado **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure-o na **máquina que executa o Gateway** e depois reinicie o Gateway.

Nenhum binário externo da CLI `zca`/`openzca` é necessário.

## Instalação

### Opção A: instalar a partir do npm

```bash
openclaw plugins install @openclaw/zalouser
```

Use o pacote sem especificar versão para seguir a tag de lançamento oficial atual. Fixe uma versão exata apenas quando precisar de uma instalação reproduzível.

Depois, reinicie o Gateway.

### Opção B: instalar a partir de uma pasta local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Depois, reinicie o Gateway.

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

As ações de mensagem do canal também oferecem suporte a `react` para reações a mensagens.

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Plugins da comunidade](/pt-BR/plugins/community)
