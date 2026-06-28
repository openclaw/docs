---
read_when:
    - Você quer suporte ao Zalo Personal (não oficial) no OpenClaw
    - Você está configurando ou desenvolvendo o Plugin zalouser
summary: 'Plugin Zalo Personal: login por QR + mensagens via zca-js nativo (instalação do Plugin + configuração de canal + ferramenta)'
title: Plugin pessoal do Zalo
x-i18n:
    generated_at: "2026-05-10T19:46:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Suporte ao Zalo Personal para OpenClaw por meio de um Plugin, usando `zca-js` nativo para automatizar uma conta normal de usuário do Zalo.

<Warning>
A automação não oficial pode levar à suspensão ou ao banimento da conta. Use por sua própria conta e risco.
</Warning>

## Nomenclatura

O id do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível integração futura com a API oficial do Zalo.

## Onde ele é executado

Este Plugin é executado **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure-o na **máquina que executa o Gateway** e, em seguida, reinicie o Gateway.

Nenhum binário externo de CLI `zca`/`openzca` é necessário.

## Instalação

### Opção A: instalar a partir do npm

```bash
openclaw plugins install @openclaw/zalouser
```

Use o pacote sem especificar versão para acompanhar a tag de lançamento oficial atual. Fixe uma versão exata apenas quando precisar de uma instalação reproduzível.

Reinicie o Gateway depois disso.

### Opção B: instalar a partir de uma pasta local (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway depois disso.

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

## Relacionado

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [ClawHub](/pt-BR/clawhub)
