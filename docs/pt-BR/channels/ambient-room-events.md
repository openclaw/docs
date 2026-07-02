---
read_when:
    - Configurando salas de grupo ou canal sempre ativas
    - Você quer que o agente monitore a conversa da sala sem publicar o texto final automaticamente
    - Depurando a digitação e o uso de tokens sem mensagem visível na sala
sidebarTitle: Ambient room events
summary: Permitir que salas de grupo compatíveis forneçam contexto silencioso, a menos que o agente envie com a ferramenta de mensagem
title: Eventos ambientais da sala
x-i18n:
    generated_at: "2026-07-02T17:33:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Eventos de sala ambiente permitem que o OpenClaw processe conversas de grupo ou canal sem menção como contexto silencioso. O agente pode atualizar memória e estado da sessão, mas a sala permanece silenciosa a menos que o agente chame explicitamente a ferramenta `message`.

Para chats de grupo sempre ativos, este é o modo recomendado: combine `messages.groupChat.unmentionedInbound: "room_event"` com `messages.groupChat.visibleReplies: "message_tool"`. Use quando o agente deve escutar, decidir quando uma resposta é útil e evitar o padrão antigo de prompt de responder `NO_REPLY`.

Suportado hoje: canais de guilda do Discord, canais e canais privados do Slack, DMs multipessoa do Slack e grupos ou supergrupos do Telegram. Outros canais de grupo mantêm o comportamento de grupo existente, a menos que a página do canal diga que eles oferecem suporte a eventos de sala ambiente.

## Configuração recomendada

Defina o comportamento global de chat de grupo:

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

Em seguida, configure a própria sala como sempre ativa desabilitando a exigência de menção para essa sala. O canal ainda deve ser permitido por sua `groupPolicy` normal, pela lista de permissões da sala e pela lista de permissões de remetentes.

Depois de salvar a configuração, o Gateway recarrega a quente as configurações de `messages`. Reinicie somente quando o monitoramento de arquivos ou o recarregamento de configuração estiver desabilitado.

## O que muda

Com `messages.groupChat.unmentionedInbound: "room_event"`:

- mensagens de grupo ou canal permitidas sem menção se tornam eventos de sala silenciosos
- mensagens com menção continuam sendo solicitações do usuário
- comandos de texto e comandos nativos continuam sendo solicitações do usuário
- solicitações de abortar ou parar continuam sendo solicitações do usuário
- mensagens diretas continuam sendo solicitações do usuário

Eventos de sala usam entrega visível estrita. O texto final do assistente é privado. O agente deve chamar `message(action=send)` para publicar na sala.

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

Use configuração do Discord por canal quando apenas um canal deve ser ambiente:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Listas de permissões de canais do Slack priorizam IDs. Use IDs de canal como `C12345678`, não `#channel-name`.

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Exemplo do Telegram

Para grupos do Telegram, o bot deve conseguir ver mensagens normais do grupo. Se `requireMention: false`, desabilite o modo de privacidade do BotFather ou use outra configuração do Telegram que entregue todo o tráfego do grupo ao bot.

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

IDs de grupo do Telegram geralmente são números negativos como `-1001234567890`. Leia `chat.id` em `openclaw logs --follow`, encaminhe uma mensagem do grupo para um bot auxiliar de ID ou inspecione `getUpdates` da Bot API.

## Política específica do agente

Use uma substituição de agente quando vários agentes compartilham a mesma sala, mas apenas um deve tratar conversas sem menção como contexto ambiente:

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

O valor específico do agente `agents.list[].groupChat.unmentionedInbound` substitui `messages.groupChat.unmentionedInbound` para esse agente.

## Modos de resposta visível

`messages.groupChat.visibleReplies` usa `"automatic"` como padrão para solicitações normais de usuário em grupo/canal. Mantenha esse padrão quando quiser que o texto final do assistente seja publicado visivelmente sem exigir uma chamada explícita à ferramenta de mensagens.

Para salas ambiente sempre ativas, `messages.groupChat.visibleReplies: "message_tool"` ainda é recomendado, especialmente com modelos de última geração e confiáveis no uso de ferramentas, como GPT 5.5. Ele permite que o agente decida quando falar chamando a ferramenta de mensagens. Se o modelo retornar texto final sem chamar a ferramenta, o OpenClaw mantém esse texto final privado e registra metadados de entrega suprimida.

Eventos de sala permanecem estritos mesmo quando outras solicitações de grupo usam respostas automáticas. Eventos de sala ambiente sem menção ainda exigem `message(action=send)` para saída visível.

## Histórico

`messages.groupChat.historyLimit` controla o padrão global de histórico de grupo. Canais podem substituí-lo com `channels.<channel>.historyLimit`, e alguns canais também oferecem suporte a limites de histórico por conta.

Defina `historyLimit: 0` para desabilitar o contexto de histórico de grupo.

Canais com suporte a eventos de sala mantêm mensagens de sala ambiente recentes como contexto. O Telegram mantém uma janela contínua sempre ativa por grupo, limitada por `historyLimit`; turnos de solicitação do usuário selecionam entradas após a última resposta registrada do bot, enquanto turnos de evento de sala recebem a janela recente completa para que o modelo possa ver suas próprias publicações recentes. A chave de modo aposentada `includeGroupHistoryContext` do Telegram é removida por `openclaw doctor --fix`.

## Solução de problemas

Se a sala mostrar digitação ou uso de tokens, mas nenhuma mensagem visível:

1. Confirme que a sala é permitida pela lista de permissões do canal e pela lista de permissões de remetentes.
2. Confirme que `requireMention: false` está definido no nível de sala esperado.
3. Verifique se `messages.groupChat.unmentionedInbound` ou a substituição do agente é `"room_event"`.
4. Inspecione os logs em busca de metadados de payload final suprimido ou `didSendViaMessagingTool: false`.
5. Para solicitações normais de grupo, mantenha ou restaure `messages.groupChat.visibleReplies: "automatic"` se quiser que respostas finais sejam publicadas automaticamente. Para salas ambiente usando `message_tool`, use um modelo/runtime que chame ferramentas de forma confiável.

Se salas ambiente do Telegram não dispararem de forma alguma, verifique o modo de privacidade do BotFather e confirme que o Gateway está recebendo mensagens normais do grupo.

Se salas ambiente do Slack não dispararem, verifique se a chave do canal é o ID do canal Slack e se o app tem o escopo `channels:history` ou `groups:history` necessário para esse tipo de sala.

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Discord](/pt-BR/channels/discord)
- [Slack](/pt-BR/channels/slack)
- [Telegram](/pt-BR/channels/telegram)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
- [Referência de configuração de canais](/pt-BR/gateway/config-channels)
