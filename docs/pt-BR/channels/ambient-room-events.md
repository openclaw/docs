---
read_when:
    - Configurando salas de grupo ou canal sempre ativas
    - Você quer que o agente acompanhe as conversas da sala sem publicar automaticamente o texto final
    - Depuração da digitação e do uso de tokens sem mensagem visível na sala
sidebarTitle: Ambient room events
summary: Permitir que salas de grupo compatíveis forneçam contexto silencioso, a menos que o agente envie uma mensagem com a ferramenta de mensagens
title: Eventos ambientais da sala
x-i18n:
    generated_at: "2026-07-12T14:53:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Os eventos de ambiente da sala permitem que o OpenClaw processe conversas de grupo ou canal sem menções como contexto silencioso. O agente pode atualizar a memória e o estado da sessão, mas a sala permanece em silêncio, a menos que o agente chame explicitamente a ferramenta `message`.

Para conversas em grupo sempre ativas, combine `messages.groupChat.unmentionedInbound: "room_event"` com `messages.groupChat.visibleReplies: "message_tool"`. O agente escuta, decide quando uma resposta é útil e nunca precisa usar o antigo padrão de prompt que respondia `NO_REPLY`.

Compatível atualmente com: canais de servidores do Discord, canais e canais privados do Slack, DMs do Slack com várias pessoas e grupos ou supergrupos do Telegram. Outros canais de grupo mantêm o comportamento de grupo atual, a menos que a página do canal informe que são compatíveis com eventos de ambiente da sala.

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

Em seguida, mantenha a sala sempre ativa desabilitando a exigência de menção para ela. A sala ainda deve atender à `groupPolicy` normal, à lista de permissões da sala e à lista de permissões de remetentes.

Depois de salvar a configuração, o Gateway aplica imediatamente as configurações de `messages`. Reinicie somente quando o monitoramento de arquivos ou o recarregamento da configuração estiver desabilitado (`gateway.reload.mode: "off"`).

## O que muda

Com `messages.groupChat.unmentionedInbound: "room_event"`:

- mensagens permitidas de grupos ou canais sem menção tornam-se eventos silenciosos da sala
- mensagens com menção continuam sendo solicitações do usuário
- comandos de controle em texto e comandos nativos continuam sendo solicitações do usuário
- solicitações para abortar ou parar continuam sendo solicitações do usuário
- mensagens diretas continuam sendo solicitações do usuário

Os eventos da sala usam entrega visível estrita. O texto final do assistente é privado. O agente deve chamar `message(action=send)` para publicar na sala.

As reações de status de digitação e de ciclo de vida permanecem suprimidas nos eventos da sala. A única exceção explícita de confirmação é `messages.ackReactionScope: "all"`, que envia a reação de confirmação configurada; use um escopo mais restrito ou `"off"` quando a sala precisar permanecer completamente silenciosa.

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

Use a configuração do Discord por canal quando apenas um canal precisar ser de ambiente. Com `groupPolicy: "allowlist"`, listar o canal é o que o permite (`enabled: false` desabilita uma entrada):

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

As listas de permissões de canais do Slack priorizam IDs. Use IDs de canais, como `C12345678`, e não `#channel-name`. Listar o canal em `channels.slack.channels` é o que o permite (`enabled: false` desabilita uma entrada):

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

Para grupos do Telegram, o bot deve conseguir ver mensagens comuns do grupo. Se `requireMention: false`, desabilite o modo de privacidade do BotFather ou use outra configuração do Telegram que entregue todo o tráfego do grupo ao bot.

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

Os IDs de grupos do Telegram geralmente são números negativos, como `-1001234567890`. Leia `chat.id` em `openclaw logs --follow`, encaminhe uma mensagem do grupo para um bot auxiliar de identificação ou inspecione `getUpdates` da API de bots.

## Política específica do agente

Use uma substituição por agente quando vários agentes compartilharem a mesma sala, mas apenas um deles precisar tratar conversas sem menções como contexto de ambiente:

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

Por padrão, `messages.groupChat.visibleReplies` usa `"automatic"` para solicitações normais de usuários em grupos/canais. Mantenha esse padrão quando o texto final do assistente precisar ser publicado de forma visível sem uma chamada explícita à ferramenta de mensagens.

Para salas de ambiente sempre ativas, `messages.groupChat.visibleReplies: "message_tool"` continua sendo recomendado, especialmente com modelos de última geração que usam ferramentas de forma confiável, como o GPT-5.6 Sol. Isso permite que o agente decida quando falar chamando a ferramenta de mensagens. Se o modelo retornar texto final sem chamar a ferramenta, o OpenClaw manterá esse texto final privado e registrará metadados de entrega suprimida.

Os eventos da sala permanecem estritos mesmo quando outras solicitações de grupo usam respostas automáticas. Eventos de ambiente da sala sem menções sempre exigem `message(action=send)` para produzir uma saída visível.

## Histórico

`messages.groupChat.historyLimit` define o padrão global do histórico de grupos (50 quando não definido; deve ser um inteiro positivo). Os canais podem substituí-lo com `channels.<channel>.historyLimit`, e alguns canais também são compatíveis com limites de histórico por conta. Defina `historyLimit: 0` no nível do canal para desabilitar o contexto do histórico de grupos desse canal.

Os canais compatíveis com eventos da sala mantêm mensagens de ambiente recentes da sala como contexto. O Telegram mantém uma janela contínua sempre ativa por grupo, limitada por `historyLimit`; turnos de solicitações do usuário selecionam entradas posteriores à última resposta registrada do bot, enquanto turnos de eventos da sala recebem toda a janela recente para que o modelo possa ver suas próprias publicações recentes. A chave de modo descontinuada `includeGroupHistoryContext` do Telegram é removida por `openclaw doctor --fix`.

## Solução de problemas

Se a sala mostrar digitação ou uso de tokens, mas nenhuma mensagem visível:

1. Confirme que a sala é permitida pela lista de permissões do canal e pela lista de permissões de remetentes.
2. Confirme se `requireMention: false` está definido no nível esperado da sala.
3. Verifique se `messages.groupChat.unmentionedInbound` ou a substituição do agente está definida como `"room_event"`.
4. Inspecione os logs em busca de metadados da carga final suprimida ou `didSendViaMessagingTool: false`.
5. Para solicitações normais de grupo, mantenha ou restaure `messages.groupChat.visibleReplies: "automatic"` se quiser que as respostas finais sejam publicadas automaticamente. Para salas de ambiente que usam `message_tool`, use um modelo/runtime que chame ferramentas de forma confiável.

Se as salas de ambiente do Telegram não forem acionadas, verifique o modo de privacidade do BotFather e confirme que o Gateway está recebendo mensagens comuns do grupo.

Se as salas de ambiente do Slack não forem acionadas, verifique se a chave do canal é o ID do canal do Slack e se o aplicativo tem o escopo de histórico correspondente ao tipo da sala: `channels:history` (pública), `groups:history` (privada) ou `mpim:history` (DMs com várias pessoas).

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Discord](/pt-BR/channels/discord)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Referência de configuração de canais](/pt-BR/gateway/config-channels)
