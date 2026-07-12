---
read_when:
    - Configurando salas de grupo ou canal sempre ativas
    - Você quer que o agente acompanhe as conversas da sala sem publicar automaticamente o texto final
    - Depuração da digitação e do uso de tokens sem mensagem visível na sala
sidebarTitle: Ambient room events
summary: Permita que as salas de grupo compatíveis forneçam contexto silencioso, a menos que o agente envie uma mensagem com a ferramenta de mensagens
title: Eventos do ambiente da sala
x-i18n:
    generated_at: "2026-07-11T23:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Eventos ambientes de sala permitem que o OpenClaw processe conversas em grupos ou canais sem menção como contexto silencioso. O agente pode atualizar a memória e o estado da sessão, mas a sala permanece silenciosa, a menos que o agente chame explicitamente a ferramenta `message`.

Para conversas em grupo sempre ativas, combine `messages.groupChat.unmentionedInbound: "room_event"` com `messages.groupChat.visibleReplies: "message_tool"`. O agente escuta, decide quando uma resposta é útil e nunca precisa usar o antigo padrão de prompt de responder `NO_REPLY`.

Compatível atualmente com: canais de servidores do Discord, canais e canais privados do Slack, mensagens diretas do Slack com várias pessoas e grupos ou supergrupos do Telegram. Outros canais de grupo mantêm o comportamento de grupo existente, a menos que a página do canal informe que há compatibilidade com eventos ambientes de sala.

## Configuração recomendada

Defina o comportamento global das conversas em grupo:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Em seguida, torne a sala sempre ativa desabilitando a exigência de menção para ela. A sala ainda precisa atender à `groupPolicy` normal, à lista de permissões da sala e à lista de permissões de remetentes.

Depois de salvar a configuração, o Gateway aplica dinamicamente as configurações de `messages`. Reinicie somente quando o monitoramento de arquivos ou o recarregamento da configuração estiver desabilitado (`gateway.reload.mode: "off"`).

## O que muda

Com `messages.groupChat.unmentionedInbound: "room_event"`:

- mensagens permitidas de grupos ou canais sem menção tornam-se eventos silenciosos de sala
- mensagens com menção continuam sendo solicitações do usuário
- comandos de controle em texto e comandos nativos continuam sendo solicitações do usuário
- solicitações para abortar ou interromper continuam sendo solicitações do usuário
- mensagens diretas continuam sendo solicitações do usuário

Eventos de sala usam entrega visível estrita. O texto final do assistente é privado. O agente precisa chamar `message(action=send)` para publicar na sala.

As indicações de digitação e as reações de status do ciclo de vida continuam suprimidas para eventos de sala. A única exceção explícita de confirmação de recebimento é `messages.ackReactionScope: "all"`, que envia a reação de confirmação configurada; use um escopo mais restrito ou `"off"` quando a sala precisar permanecer completamente silenciosa.

## Exemplo do Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Use a configuração do Discord por canal quando apenas um canal precisar ser ambiente. Com `groupPolicy: "allowlist"`, incluir o canal na lista é o que o permite (`enabled: false` desabilita uma entrada):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Exemplo do Slack

As listas de permissões de canais do Slack priorizam IDs. Use IDs de canal, como `C12345678`, e não `#channel-name`. Incluir o canal em `channels.slack.channels` é o que o permite (`enabled: false` desabilita uma entrada):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Exemplo do Telegram

Para grupos do Telegram, o bot precisa conseguir ver mensagens normais do grupo. Se `requireMention: false`, desabilite o modo de privacidade do BotFather ou use outra configuração do Telegram que entregue todo o tráfego do grupo ao bot.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

IDs de grupos do Telegram geralmente são números negativos, como `-1001234567890`. Leia `chat.id` em `openclaw logs --follow`, encaminhe uma mensagem do grupo para um bot auxiliar de identificação ou inspecione `getUpdates` da API de bots.

## Política específica do agente

Use uma substituição específica do agente quando vários agentes compartilharem a mesma sala, mas apenas um deles precisar tratar conversas sem menção como contexto ambiente:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

O valor de `agents.list[].groupChat.unmentionedInbound` específico do agente substitui `messages.groupChat.unmentionedInbound` para esse agente.

## Modos de resposta visível

O valor padrão de `messages.groupChat.visibleReplies` é `"automatic"` para solicitações normais de usuários em grupos ou canais. Mantenha esse padrão quando o texto final do assistente precisar ser publicado de forma visível sem uma chamada explícita à ferramenta de mensagens.

Para salas ambientes sempre ativas, `messages.groupChat.visibleReplies: "message_tool"` continua sendo recomendado, especialmente com modelos de última geração que usam ferramentas de forma confiável, como GPT-5.6 Sol. Isso permite que o agente decida quando falar chamando a ferramenta de mensagens. Se o modelo retornar um texto final sem chamar a ferramenta, o OpenClaw mantém esse texto final privado e registra metadados de entrega suprimida.

Eventos de sala continuam seguindo o modo estrito mesmo quando outras solicitações do grupo usam respostas automáticas. Eventos ambientes de sala sem menção sempre exigem `message(action=send)` para produzir uma saída visível.

## Histórico

`messages.groupChat.historyLimit` define o padrão global do histórico de grupos (50 quando não definido; precisa ser um número inteiro positivo). Os canais podem substituí-lo com `channels.<channel>.historyLimit`, e alguns canais também permitem limites de histórico por conta. Defina `historyLimit: 0` no nível do canal para desabilitar o contexto do histórico de grupos nesse canal.

Os canais compatíveis com eventos de sala mantêm mensagens ambientes recentes da sala como contexto. O Telegram mantém uma janela deslizante sempre ativa por grupo, limitada por `historyLimit`; turnos de solicitação do usuário selecionam entradas posteriores à última resposta registrada do bot, enquanto turnos de eventos de sala recebem toda a janela recente para que o modelo possa ver as próprias publicações recentes. A chave de modo descontinuada `includeGroupHistoryContext` do Telegram é removida por `openclaw doctor --fix`.

## Solução de problemas

Se a sala mostrar digitação ou uso de tokens, mas nenhuma mensagem visível:

1. Confirme que a sala é permitida pela lista de permissões do canal e pela lista de permissões de remetentes.
2. Confirme que `requireMention: false` está definido no nível de sala esperado.
3. Verifique se `messages.groupChat.unmentionedInbound` ou a substituição do agente é `"room_event"`.
4. Inspecione os logs em busca de metadados da carga final suprimida ou de `didSendViaMessagingTool: false`.
5. Para solicitações normais do grupo, mantenha ou restaure `messages.groupChat.visibleReplies: "automatic"` se quiser que as respostas finais sejam publicadas automaticamente. Para salas ambientes que usam `message_tool`, use um modelo ou ambiente de execução que chame ferramentas de forma confiável.

Se as salas ambientes do Telegram não forem acionadas, verifique o modo de privacidade do BotFather e confirme que o Gateway está recebendo mensagens normais do grupo.

Se as salas ambientes do Slack não forem acionadas, confirme que a chave do canal é o ID do canal do Slack e que o aplicativo tem o escopo de histórico correspondente ao tipo de sala: `channels:history` (pública), `groups:history` (privada) ou `mpim:history` (mensagens diretas com várias pessoas).

## Conteúdo relacionado

- [Grupos](/pt-BR/channels/groups)
- [Discord](/pt-BR/channels/discord)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Referência de configuração de canais](/pt-BR/gateway/config-channels)
