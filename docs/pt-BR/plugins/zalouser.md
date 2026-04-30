---
read_when:
    - Você quer suporte ao Zalo Personal (não oficial) no OpenClaw
    - Você está configurando ou desenvolvendo o Plugin zalouser
summary: 'Plugin Zalo Personal: login por QR + mensagens via zca-js nativo (instalação do Plugin + configuração de canal + ferramenta)'
title: Plugin pessoal do Zalo
x-i18n:
    generated_at: "2026-04-30T10:03:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

Suporte ao Zalo Personal para OpenClaw por meio de um Plugin, usando o `zca-js` nativo para automatizar uma conta normal de usuário do Zalo.

<Warning>
A automação não oficial pode levar à suspensão ou ao banimento da conta. Use por sua conta e risco.
</Warning>

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Onde ele é executado

Este Plugin é executado **dentro do processo do Gateway**.

Se você usar um Gateway remoto, instale/configure-o na **máquina que executa o Gateway** e reinicie o Gateway.

Nenhum binário externo de CLI `zca`/`openzca` é necessário.

## Instalação

### Opção A: instalar pelo npm

```bash
openclaw plugins install @openclaw/zalouser
```

Se o npm informar que o pacote de propriedade da OpenClaw está obsoleto, essa versão do pacote é
de uma linha de pacotes externa mais antiga; use um build atual empacotado do OpenClaw ou
o caminho da pasta local até que um pacote npm mais novo seja publicado.

Depois, reinicie o Gateway.

### Opção B: instalar de uma pasta local (dev)

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

As ações de mensagem de canal também oferecem suporte a `react` para reações a mensagens.

## Relacionado

- [Criação de Plugins](/pt-BR/plugins/building-plugins)
- [Plugins da comunidade](/pt-BR/plugins/community)
