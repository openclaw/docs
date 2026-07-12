---
read_when:
    - Você quer suporte ao Zalo Personal (não oficial) no OpenClaw
    - Você está configurando ou desenvolvendo o plugin zalouser
summary: 'Plugin Zalo Personal: login por QR + mensagens via zca-js nativo (instalação do plugin + configuração do canal + ferramenta)'
title: Plugin pessoal do Zalo
x-i18n:
    generated_at: "2026-07-12T15:29:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

Suporte ao Zalo Personal para o OpenClaw por meio de um plugin que usa o `zca-js` nativo para
automatizar uma conta normal de usuário do Zalo. Nenhum binário externo da CLI
`zca`/`openzca` é necessário.

<Warning>
A automação não oficial pode levar à suspensão ou ao banimento da conta. Use por sua conta e risco.
</Warning>

## Nomenclatura

O id do canal é `zalouser` para deixar explícito que ele automatiza uma **conta pessoal
de usuário do Zalo** (não oficial). O id de canal separado `zalo` corresponde à integração
oficial e incluída do Bot/webhook do Zalo — consulte [Zalo](/pt-BR/channels/zalo).

## Onde é executado

Este plugin é executado **dentro do processo do Gateway**. Para um Gateway remoto,
instale/configure-o nesse host e reinicie o Gateway.

## Instalação

### Pelo npm

```bash
openclaw plugins install @openclaw/zalouser
```

Use somente o pacote para acompanhar a tag da versão oficial atual; fixe uma versão
exata somente quando precisar de uma instalação reproduzível. Depois, reinicie o Gateway.

### Por uma pasta local (desenvolvimento)

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

Consulte [Configuração do canal pessoal do Zalo](/pt-BR/channels/zalouser) para ver o controle de acesso
a mensagens diretas/grupos, a configuração de várias contas, as variáveis de ambiente e a solução de problemas.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Ferramenta do agente

Nome da ferramenta: `zalouser`

Ações: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

As ações de mensagens do canal (não a ferramenta do agente) também oferecem suporte a `react` para
reações a mensagens.

## Relacionados

- [Configuração do canal pessoal do Zalo](/pt-BR/channels/zalouser)
- [Zalo (canal oficial de Bot/webhook)](/pt-BR/channels/zalo)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [ClawHub](/clawhub)
