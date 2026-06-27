---
read_when:
    - Configurando o Slack ou depurando o modo de socket, HTTP ou relay do Slack
summary: Configuração e comportamento em tempo de execução do Slack (Socket Mode, URLs de solicitação HTTP e modo de relay)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Pronto para produção para DMs e canais via integrações de app do Slack. O modo padrão é Socket Mode; URLs de solicitação HTTP também são compatíveis. O modo de retransmissão é destinado a implantações gerenciadas em que um roteador confiável é responsável pela entrada do Slack.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do Slack usam o modo de emparelhamento por padrão.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
</CardGroup>

## Como escolher Socket Mode ou URLs de solicitação HTTP

Ambos os transportes estão prontos para produção e alcançam paridade de recursos para mensagens, comandos de barra, App Home e interatividade. Escolha pelo formato da implantação, não pelos recursos.

| Preocupação                  | Socket Mode (padrão)                                                                                                                                 | URLs de solicitação HTTP                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública do Gateway       | Não obrigatória                                                                                                                                      | Obrigatória (DNS, TLS, proxy reverso ou túnel)                                                                 |
| Rede de saída                | WSS de saída para `wss-primary.slack.com` deve estar acessível                                                                                       | Sem WS de saída; somente HTTPS de entrada                                                                      |
| Tokens necessários           | Token de bot + Token em nível de app com `connections:write`                                                                                         | Token de bot + Signing Secret                                                                                  |
| Laptop de dev / atrás de firewall | Funciona como está                                                                                                                                   | Precisa de um túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou Gateway de staging                 |
| Escalonamento horizontal     | Uma sessão de Socket Mode por app por host; múltiplos Gateways precisam de apps Slack separados                                                      | Manipulador POST sem estado; múltiplas réplicas do Gateway podem compartilhar um app atrás de um balanceador de carga |
| Várias contas em um Gateway  | Compatível; cada conta abre seu próprio WS                                                                                                           | Compatível; cada conta precisa de um `webhookPath` exclusivo (padrão `/slack/events`) para que os registros não colidam |
| Transporte de comandos de barra | Entregue pela conexão WS; `slash_commands[].url` é ignorado                                                                                          | Slack envia POST para `slash_commands[].url`; o campo é obrigatório para o comando ser despachado              |
| Assinatura de solicitação    | Não usada (a autenticação é o Token em nível de app)                                                                                                 | Slack assina todas as solicitações; OpenClaw verifica com `signingSecret`                                      |
| Recuperação ao cair a conexão | A reconexão automática do Slack SDK está ativada; OpenClaw também reinicia sessões de Socket Mode com falha usando backoff limitado. O ajuste de transporte por tempo limite de pong se aplica. | Não há conexão persistente para cair; as novas tentativas são por solicitação do Slack                         |

<Note>
  **Escolha Socket Mode** para hosts com um único Gateway, laptops de dev e redes on-prem que conseguem acessar `*.slack.com` para saída, mas não conseguem aceitar HTTPS de entrada.

**Escolha URLs de solicitação HTTP** ao executar múltiplas réplicas do Gateway atrás de um balanceador de carga, quando WSS de saída está bloqueado mas HTTPS de entrada é permitido, ou quando você já encerra webhooks do Slack em um proxy reverso.
</Note>

### Modo de retransmissão

O modo de retransmissão separa a entrada do Slack do gateway OpenClaw. Um roteador confiável é responsável pela
única conexão Socket Mode do Slack, escolhe um gateway de destino e encaminha um evento
tipado por um websocket autenticado. O gateway continua usando seu token de bot para
chamadas de saída à Web API do Slack.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

A URL de retransmissão deve usar `wss://`, a menos que aponte para localhost. Trate o token bearer e
a tabela de rotas do roteador como parte do limite de autorização do Slack: eventos roteados entram no
manipulador normal de mensagens do Slack como ativações autorizadas. Um `slack_identity` fornecido pelo roteador
no quadro `hello` do websocket pode definir o nome de usuário e o ícone de saída padrão; uma identidade explícita
fornecida pelo chamador ainda prevalece. A conexão de retransmissão reconecta com o mesmo
tempo de backoff limitado usado pelo Socket Mode e limpa a identidade fornecida pelo roteador sempre que
se desconecta.

## Instalar

Instale o Slack antes de configurar o canal:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra e habilita o plugin. O plugin ainda não faz nada até você configurar o app Slack e as configurações de canal abaixo. Consulte [Plugins](/pt-BR/tools/plugin) para comportamento geral de plugins e regras de instalação.

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Criar um novo app Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifestos abaixo → **Next** → **Create**.

        <CodeGroup>

```json Recomendado
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

```json Mínimo
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recomendado** corresponde ao conjunto completo de recursos do Plugin Slack: App Home, comandos de barra, arquivos, reações, pins, DMs em grupo e leituras de emoji/grupos de usuários. Escolha **Mínimo** quando a política do workspace restringir escopos — ele cobre DMs, histórico de canais/grupos, menções e comandos de barra, mas remove arquivos, reações, pins, DMs em grupo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulte [Checklist de manifesto e escopos](#manifest-and-scope-checklist) para ver a justificativa por escopo e opções aditivas, como comandos de barra extras.
        </Note>

        Depois que o Slack criar o app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: adicione `connections:write`, salve e copie o App-Level Token.
        - **Install App -> Install to Workspace**: copie o Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configuração SecretRef recomendada:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Fallback de env (somente conta padrão):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifestos abaixo → substitua `https://gateway-host.example.com/slack/events` pela URL pública do seu Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recomendado
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Mínimo
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recomendado** corresponde ao conjunto completo de recursos do Plugin Slack; **Mínimo** remove arquivos, reações, pins, DMs de grupo (`mpim:*`), `emoji:read` e `usergroups:read` para workspaces restritivos. Consulte a [lista de verificação de manifesto e escopos](#manifest-and-scope-checklist) para a justificativa de cada escopo.
        </Note>

        <Info>
          Os três campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apontam para o mesmo endpoint do OpenClaw. O esquema de manifesto do Slack exige que eles tenham nomes separados, mas o OpenClaw roteia pelo tipo de payload, então um único `webhookPath` (padrão `/slack/events`) é suficiente. Comandos slash sem `slash_commands[].url` não executarão nada silenciosamente no modo HTTP.
        </Info>

        Depois que o Slack criar o app:

        - **Basic Information → App Credentials**: copie o **Signing Secret** para verificação de solicitações.
        - **Install App -> Install to Workspace**: copie o Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Configuração recomendada de SecretRef:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Use caminhos de Webhook exclusivos para HTTP com várias contas

        Dê a cada conta um `webhookPath` distinto (padrão `/slack/events`) para que os registros não entrem em conflito.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ajuste de transporte do Socket Mode

O OpenClaw define por padrão o tempo limite de pong do cliente do SDK do Slack como 15 segundos para o Socket Mode. Substitua as configurações de transporte somente quando precisar de ajustes específicos para workspace ou host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Use isso apenas para workspaces em Socket Mode que registrem timeouts de pong/websocket ou server-ping do Slack, ou que rodem em hosts com inanição conhecida do loop de eventos. `clientPingTimeout` é a espera pelo pong depois que o SDK envia um ping de cliente; `serverPingTimeout` é a espera por pings do servidor Slack. Mensagens e eventos do app continuam sendo estado da aplicação, não sinais de vivacidade do transporte.

Observações:

- `socketMode` é ignorado no modo HTTP Request URL.
- As configurações base de `channels.slack.socketMode` se aplicam a todas as contas Slack, a menos que sejam substituídas. Substituições por conta usam `channels.slack.accounts.<accountId>.socketMode`; como isso é uma substituição de objeto, inclua todos os campos de ajuste de socket que você quiser para essa conta.
- Somente `clientPingTimeout` tem um padrão do OpenClaw (`15000`). `serverPingTimeout` e `pingPongLoggingEnabled` são passados para o SDK do Slack somente quando configurados.
- O backoff de reinício do Socket Mode começa por volta de 2 segundos e tem limite por volta de 30 segundos. Falhas recuperáveis de início, espera de início e desconexão tentam novamente até o canal parar. Erros permanentes de conta e credenciais, como autenticação inválida, tokens revogados ou escopos ausentes, falham rapidamente em vez de tentar novamente para sempre.

## Lista de verificação de manifesto e escopos

O manifesto base do app Slack é o mesmo para Socket Mode e HTTP Request URLs. Somente o bloco `settings` (e a `url` do comando slash) difere.

Manifesto base (padrão do Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Para o modo **HTTP Request URLs**, substitua `settings` pela variante HTTP e adicione `url` a cada comando slash. URL pública obrigatória:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Configurações adicionais do manifesto

Expõe recursos diferentes que estendem os padrões acima.

O manifesto padrão habilita a guia **Início** do Slack App Home e assina `app_home_opened`. Quando um membro do workspace abre a guia Início, o OpenClaw publica uma visualização inicial segura padrão com `views.publish`; nenhum payload de conversa ou configuração privada é incluído. A guia **Mensagens** permanece habilitada para DMs do Slack. O manifesto também habilita threads de assistente do Slack com `features.assistant_view`, `assistant:write`, `assistant_thread_started` e `assistant_thread_context_changed`; threads de assistente são roteadas para suas próprias sessões de thread do OpenClaw e mantêm o contexto de thread fornecido pelo Slack disponível para o agente.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Vários [comandos de barra nativos](#commands-and-slash-behavior) podem ser usados em vez de um único comando configurado, com algumas nuances:

    - Use `/agentstatus` em vez de `/status`, porque o comando `/status` é reservado.
    - No máximo 25 comandos de barra podem ficar disponíveis ao mesmo tempo.

    Substitua sua seção `features.slash_commands` existente por um subconjunto dos [comandos disponíveis](/pt-BR/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Use a mesma lista `slash_commands` do Socket Mode acima e adicione `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Exemplo:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Repita esse valor de `url` em todos os comandos da lista.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Adicione o escopo de bot `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do app Slack.

    Se você usar um ícone de emoji, o Slack espera a sintaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Se você configurar `channels.slack.userToken`, os escopos de leitura típicos são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depender de leituras de busca do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de token

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP exige `botToken` + `signingSecret`.
- O modo relay exige `botToken` mais `relay.url`, `relay.authToken` e `relay.gatewayId`; ele não usa token de app nem segredo de assinatura.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` e `userToken` aceitam strings
  em texto simples ou objetos SecretRef.
- Tokens de configuração substituem o fallback de env.
- O fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica apenas à conta padrão.
- `userToken` só pode ser configurado por config (sem fallback de env) e usa comportamento somente leitura por padrão (`userTokenReadOnly: true`).

Comportamento do snapshot de status:

- A inspeção de contas do Slack rastreia campos `*Source` e `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por SecretRef
  ou outra fonte de segredo não inline, mas o caminho atual de comando/runtime
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; no Socket Mode, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para leituras de ações/diretório, o token de usuário pode ser preferido quando configurado. Para gravações, o token de bot continua sendo preferido; gravações com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot está indisponível.
</Tip>

## Ações e gates

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ação disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

As ações atuais de mensagem do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` aceita IDs de arquivo do Slack mostrados em placeholders de arquivos recebidos e retorna pré-visualizações de imagem para imagens ou metadados de arquivo local para outros tipos de arquivo.

## Controle de acesso e roteamento

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` controla o acesso a DMs. `channels.slack.allowFrom` é a lista de permissões de DM canônica.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `channels.slack.allowFrom` inclua `"*"`)
    - `disabled`

    Flags de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo padrão false)
    - `dm.groupChannels` (lista de permissões MPIM opcional)

    Precedência de várias contas:

    - `channels.slack.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    Os legados `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` ainda são lidos por compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A lista de permissões de canais fica em `channels.slack.channels` e **deve usar IDs estáveis de canais do Slack** (por exemplo, `C12345678`) como chaves de configuração.

    Observação de runtime: se `channels.slack` estiver completamente ausente (configuração somente por env), o runtime usa fallback para `groupPolicy="allowlist"` e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    Resolução de nome/ID:

    - entradas da lista de permissões de canais e entradas da lista de permissões de DM são resolvidas na inicialização quando o acesso do token permite
    - entradas de nome de canal não resolvidas são mantidas conforme configuradas, mas ignoradas para roteamento por padrão
    - autorização de entrada e roteamento de canais são ID-first por padrão; correspondência direta por nome de usuário/slug exige `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Chaves baseadas em nome (`#channel-name` ou `channel-name`) **não** correspondem em `groupPolicy: "allowlist"`. A busca de canal é ID-first por padrão, então uma chave baseada em nome nunca será roteada com sucesso e todas as mensagens nesse canal serão bloqueadas silenciosamente. Isso difere de `groupPolicy: "open"`, em que a chave do canal não é exigida para roteamento e uma chave baseada em nome parece funcionar.

    Sempre use o ID do canal do Slack como a chave. Para encontrá-lo: clique com o botão direito no canal no Slack → **Copy link** — o ID (`C...`) aparece no fim da URL.

    Correto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Incorreto (bloqueado silenciosamente em `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Mensagens de canal exigem menção por padrão.

    Fontes de menção:

    - menção explícita ao app (`<@botId>`)
    - menção a grupo de usuários do Slack (`<!subteam^S...>`) quando o usuário bot é membro desse grupo de usuários; exige `usergroups:read`
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de thread em resposta ao bot (desativado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes somente via resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (lista de permissões)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato da chave `toolsBySender`: curinga `channel:`, `id:`, `e164:`, `username:`, `name:` ou `"*"`
      (chaves legadas sem prefixo ainda são mapeadas somente para `id:`)

    `allowBots` é conservador para canais e canais privados: mensagens de sala criadas por bots são aceitas somente quando o bot remetente está listado explicitamente na lista de permissões `users` dessa sala, ou quando pelo menos um ID de proprietário explícito do Slack em `channels.slack.allowFrom` é atualmente membro da sala. Curingas e entradas de proprietário por nome de exibição não satisfazem a presença do proprietário. A presença do proprietário usa `conversations.members` do Slack; verifique se o app tem o escopo de leitura correspondente ao tipo de sala (`channels:read` para canais públicos, `groups:read` para canais privados). Se a consulta de membros falhar, o OpenClaw descarta a mensagem de sala criada por bot.

    Mensagens do Slack criadas por bots e aceitas usam a [proteção contra loop de bot](/pt-BR/channels/bot-loop-protection) compartilhada. Configure `channels.defaults.botLoopProtection` para o orçamento padrão e depois sobrescreva com `channels.slack.botLoopProtection` ou `channels.slack.channels.<id>.botLoopProtection` quando um workspace ou canal precisar de um limite diferente.

  </Tab>
</Tabs>

## Encadeamento, sessões e tags de resposta

- DMs são roteadas como `direct`; canais como `channel`; MPIMs como `group`.
- Vínculos de rota do Slack aceitam IDs de par brutos e formas de destino do Slack, como `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Com o padrão `session.dmScope=main`, DMs do Slack são consolidadas na sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Mensagens comuns de nível superior em canais permanecem na sessão por canal, mesmo quando `replyToMode` não é `off`.
- Respostas em threads do Slack usam o `thread_ts` pai do Slack para sufixos de sessão (`:thread:<threadTs>`), mesmo quando o encadeamento de respostas de saída está desabilitado com `replyToMode="off"`.
- O OpenClaw inicializa uma raiz elegível de canal de nível superior em `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` quando essa raiz deve iniciar uma thread visível do Slack, para que a raiz e respostas posteriores na thread compartilhem uma sessão do OpenClaw. Isso se aplica a eventos `app_mention`, correspondências explícitas de bot ou de padrão de menção configurado, e canais com `requireMention: false` com `replyToMode` diferente de `off`.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desabilitar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em threads para que o bot responda apenas a menções explícitas `@bot` dentro de threads, mesmo quando o bot já participou da thread. Sem isso, respostas em uma thread com participação do bot ignoram a exigência de `requireMention`.

Controles de encadeamento de resposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Tags manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respostas explícitas em threads do Slack pela ferramenta `message`, defina `replyBroadcast: true` com `action: "send"` e `threadId` ou `replyTo` para pedir ao Slack que também transmita a resposta da thread para o canal pai. Isso mapeia para a flag `reply_broadcast` de `chat.postMessage` do Slack e só é compatível com envios de texto ou Block Kit, não uploads de mídia.

Quando uma chamada da ferramenta `message` é executada dentro de uma thread do Slack e aponta para o mesmo canal, o OpenClaw normalmente herda a thread atual do Slack de acordo com `replyToMode`. Defina `topLevel: true` em `action: "send"` ou `action: "upload-file"` para forçar uma nova mensagem no canal pai. `threadId: null` é aceito como a mesma opção de saída para nível superior.

<Note>
`replyToMode="off"` desabilita o encadeamento de respostas de saída do Slack, incluindo tags explícitas `[[reply_to_*]]`. Ele não achata sessões de threads de entrada do Slack: mensagens já postadas dentro de uma thread do Slack ainda são roteadas para a sessão `:thread:<threadTs>`. Isso difere do Telegram, em que tags explícitas ainda são respeitadas no modo `"off"`. Threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram permanecem visíveis em linha.
</Note>

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem de entrada. `ackReactionScope` decide _quando_ esse emoji é realmente enviado.

### Emoji (`ackReaction`)

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback para emoji de identidade do agente (`agents.list[].identity.emoji`, ou `"eyes"` / 👀)

Observações:

- O Slack espera shortcodes (por exemplo, `"eyes"`).
- Use `""` para desabilitar a reação para a conta do Slack ou globalmente.

### Escopo (`messages.ackReactionScope`)

O provedor do Slack lê o escopo de `messages.ackReactionScope` (padrão `"group-mentions"`). Hoje não há sobrescrita por conta do Slack nem por canal do Slack; o valor é global para o Gateway.

Valores:

- `"all"`: reage em DMs e grupos.
- `"direct"`: reage somente em DMs.
- `"group-all"`: reage a todas as mensagens de grupo (sem DMs).
- `"group-mentions"` (padrão): reage em grupos, mas somente quando o bot é mencionado (ou em mencionáveis de grupo que fizeram opt-in). **DMs são excluídas.**
- `"off"` / `"none"`: nunca reage.

<Note>
O escopo padrão (`"group-mentions"`) não dispara reações de confirmação em mensagens diretas. Para ver o `ackReaction` configurado (por exemplo, `"eyes"`) em DMs de entrada do Slack, defina `messages.ackReactionScope` como `"direct"` ou `"all"`. `messages.ackReactionScope` é lido na inicialização do provedor do Slack, então é necessário reiniciar o gateway para que a alteração entre em vigor.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Streaming de texto

`channels.slack.streaming` controla o comportamento de pré-visualização ao vivo:

- `off`: desabilita o streaming de pré-visualização ao vivo.
- `partial` (padrão): substitui o texto de pré-visualização pela saída parcial mais recente.
- `block`: acrescenta atualizações de pré-visualização em blocos.
- `progress`: mostra texto de status de progresso durante a geração e depois envia o texto final.
- `streaming.preview.toolProgress`: quando a pré-visualização de rascunho está ativa, roteia atualizações de ferramenta/progresso para a mesma mensagem de pré-visualização editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: defina como `status` para manter linhas compactas de progresso de ferramenta enquanto oculta texto bruto de comando/execução (padrão: `raw`).

Oculte texto bruto de comando/execução mantendo linhas compactas de progresso:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` controla o streaming de texto nativo do Slack quando `channels.slack.streaming.mode` é `partial` (padrão: `true`).

Cartões nativos de tarefa de progresso do Slack são opt-in para o modo de progresso. Defina `channels.slack.streaming.progress.nativeTaskCards` como `true` com `channels.slack.streaming.mode="progress"` para enviar um cartão nativo do Slack de plano/tarefa enquanto o trabalho está em execução e depois atualizar o mesmo cartão de tarefa na conclusão. Sem essa flag, o modo de progresso mantém o comportamento portátil de pré-visualização de rascunho.

- Uma thread de resposta deve estar disponível para que o streaming de texto nativo e o status de thread do assistente do Slack apareçam. A seleção de thread ainda segue `replyToMode`.
- Raízes de canal, chat em grupo e DMs de nível superior ainda podem usar a pré-visualização normal de rascunho quando o streaming nativo está indisponível ou não existe thread de resposta.
- DMs de nível superior do Slack permanecem fora de thread por padrão, portanto não mostram a pré-visualização nativa de stream/status em estilo de thread do Slack; em vez disso, o OpenClaw posta e edita uma pré-visualização de rascunho na DM.
- Mídia e payloads não textuais fazem fallback para entrega normal.
- Finais de mídia/erro cancelam edições pendentes de pré-visualização; finais elegíveis de texto/bloco só são descarregados quando podem editar a pré-visualização no lugar.
- Se o streaming falhar no meio da resposta, o OpenClaw faz fallback para entrega normal dos payloads restantes.

Use pré-visualização de rascunho em vez de streaming de texto nativo do Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Faça opt-in para cartões nativos de tarefa de progresso do Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é um alias legado de runtime para `channels.slack.streaming.mode`.
- o booleano `channels.slack.streaming` é um alias legado de runtime para `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legado é um alias de runtime para `channels.slack.streaming.nativeTransport`.
- Execute `openclaw doctor --fix` para reescrever a configuração persistida de streaming do Slack para as chaves canônicas.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto o OpenClaw processa uma resposta e depois a remove quando a execução termina. Isso é mais útil fora de respostas em threads, que usam um indicador de status padrão "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera shortcodes (por exemplo, `"hourglass_flowing_sand"`).
- A reação é de melhor esforço, e a limpeza é tentada automaticamente depois que a resposta ou o caminho de falha é concluído.

## Mídia, divisão em partes e entrega

<AccordionGroup>
  <Accordion title="Anexos de entrada">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de solicitação autenticado por token) e gravados no armazenamento de mídia quando a busca tem sucesso e os limites de tamanho permitem. Marcadores de posição de arquivo incluem o `fileId` do Slack para que agentes possam buscar o arquivo original com `download-file`.

    Downloads usam tempos limite limitados de inatividade e total. Se a recuperação de arquivo do Slack travar ou falhar, o OpenClaw continua processando a mensagem e faz fallback para o marcador de posição de arquivo.

    O limite de tamanho de entrada em runtime usa `20MB` por padrão, salvo se sobrescrito por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - partes de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita a divisão priorizando parágrafos
    - envios de arquivo usam APIs de upload do Slack e podem incluir respostas em thread (`thread_ts`)
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam padrões por tipo MIME do pipeline de mídia

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferenciais:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    DMs do Slack somente com texto/bloco podem postar diretamente em IDs de usuário; uploads de arquivo e envios em thread abrem primeiro a DM pelas APIs de conversa do Slack porque esses caminhos exigem um ID de conversa concreto.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de slash

Comandos slash aparecem no Slack como um único comando configurado ou vários comandos nativos. Configure `channels.slack.slashCommand` para alterar os padrões de comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Comandos nativos exigem [configurações adicionais de manifesto](#additional-manifest-settings) no seu app do Slack e são habilitados com `channels.slack.commands.native: true` ou `commands.native: true` em configurações globais.

- O modo automático de comando nativo fica **desligado** para Slack, portanto `commands.native: "auto"` não habilita comandos nativos do Slack.

```txt
/help
```

Menus nativos de argumentos usam uma estratégia de renderização adaptativa que mostra um modal de confirmação antes de despachar um valor de opção selecionado:

- até 5 opções: blocos de botão
- 6 a 100 opções: menu de seleção estático
- mais de 100 opções: seleção externa com filtragem assíncrona de opções quando manipuladores de opções de interatividade estão disponíveis
- limites do Slack excedidos: valores de opção codificados fazem fallback para botões

```txt
/think
```

Sessões de barra usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda roteiam execuções de comandos para a sessão de conversa de destino usando `CommandTargetSessionKey`.

## Respostas interativas

O Slack pode renderizar controles de resposta interativa criados por agente, mas esse recurso é desabilitado por padrão.
Para novas saídas de agente, CLI e Plugin, prefira os botões `presentation` compartilhados ou blocos de seleção. Eles usam o mesmo caminho de interação do Slack e também degradam em outros canais.

Habilite globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Ou habilite apenas para uma conta do Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando habilitado, os agentes ainda podem emitir diretivas de resposta obsoletas exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas para o Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho de evento de interação existente do Slack. Mantenha-as para prompts antigos e rotas de escape específicas do Slack; use apresentação compartilhada para novos controles portáteis.

As APIs do compilador de diretivas também estão obsoletas para novo código produtor:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Use payloads `presentation` e `buildSlackPresentationBlocks(...)` para novos controles renderizados no Slack.

Observações:

- Esta é uma IU legada específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativo são tokens opacos gerados pelo OpenClaw, não valores brutos criados por agente.
- Se os blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw volta para a resposta de texto original em vez de enviar um payload de blocos inválido.

### Envios de modais pertencentes a Plugins

Plugins do Slack que registram um manipulador interativo também podem receber eventos de ciclo de vida modal `view_submission` e `view_closed` antes que o OpenClaw compacte o payload para o evento de sistema visível ao agente. Use um destes padrões de roteamento ao abrir um modal do Slack:

- Defina `callback_id` como `openclaw:<namespace>:<payload>`.
- Ou mantenha um `callback_id` existente e coloque `pluginInteractiveData:
"<namespace>:<payload>"` nos `private_metadata` do modal.

O manipulador recebe `ctx.interaction.kind` como `view_submission` ou `view_closed`, `inputs` normalizados e o objeto bruto completo `stateValues` do Slack. O roteamento somente por callback-id é suficiente para invocar o manipulador do Plugin; inclua os campos de roteamento de usuário/sessão existentes em `private_metadata` do modal quando o modal também deve produzir um evento de sistema visível ao agente. O agente recebe um evento de sistema compacto e redigido `Slack interaction: ...`. Se o manipulador retornar `systemEvent.summary`, `systemEvent.reference` ou `systemEvent.data`, esses campos serão incluídos nesse evento compacto para que o agente possa referenciar armazenamento pertencente ao Plugin sem ver o payload completo do formulário.

## Aprovações nativas no Slack

O Slack pode atuar como um cliente de aprovação nativo com botões interativos e interações, em vez de voltar para a IU Web ou o terminal.

- Aprovações de execução e Plugin podem ser renderizadas como prompts Slack-native Block Kit.
- `channels.slack.execApprovals.*` continua sendo a configuração de habilitação do cliente nativo de aprovação de execução e de roteamento de DM/canal.
- DMs de aprovação de execução usam `channels.slack.execApprovals.approvers` ou `commands.ownerAllowFrom`.
- Aprovações de Plugin usam botões nativos do Slack quando o Slack está habilitado como cliente de aprovação nativo para a sessão de origem, ou quando `approvals.plugin` roteia para a sessão do Slack de origem ou para um destino do Slack.
- DMs de aprovação de Plugin usam aprovadores de Plugin do Slack de `channels.slack.allowFrom`, `allowFrom` de conta nomeada ou a rota padrão da conta.
- A autorização do aprovador ainda é aplicada: aprovadores somente de execução não podem aprovar solicitações de Plugin, a menos que também sejam aprovadores de Plugin.

Isso usa a mesma superfície compartilhada de botão de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do seu app Slack, os prompts de aprovação são renderizados como botões Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a principal UX de aprovação; o OpenClaw só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser que aprovações por chat estão indisponíveis ou que a aprovação manual é o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; volta para `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um aprovador de execução é resolvido. O Slack também pode lidar com aprovações nativas de Plugin por meio desse caminho de cliente nativo quando aprovadores de Plugin do Slack são resolvidos e a solicitação corresponde aos filtros do cliente nativo. Defina `enabled: false` para desabilitar explicitamente o Slack como cliente de aprovação nativo. Defina `enabled: true` para forçar aprovações nativas quando aprovadores forem resolvidos. Desabilitar aprovações de execução do Slack não desabilita a entrega de aprovação nativa de Plugin do Slack que é habilitada por meio de `approvals.plugin`; a entrega de aprovação de Plugin usa aprovadores de Plugin do Slack em vez disso.

Comportamento padrão sem configuração explícita de aprovação de execução do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

A configuração explícita nativa do Slack só é necessária quando você quer substituir aprovadores, adicionar filtros ou
optar pela entrega no chat de origem:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

O encaminhamento compartilhado de `approvals.exec` é separado. Use-o somente quando os prompts de aprovação de execução também precisarem
ser roteados para outros chats ou destinos explícitos fora da banda. O encaminhamento compartilhado de `approvals.plugin` também é
separado; a entrega nativa do Slack suprime esse fallback somente quando o Slack consegue lidar nativamente com a solicitação de
aprovação do plugin.

O `/approve` no mesmo chat também funciona em canais do Slack e DMs que já aceitam comandos. Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals) para ver o modelo completo de encaminhamento de aprovações.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens são mapeadas para eventos do sistema.
- Transmissões de thread (respostas de thread com "Também enviar para o canal") são processadas como mensagens normais de usuário.
- Eventos de adicionar/remover reações são mapeados para eventos do sistema.
- Eventos de entrada/saída de membros, canal criado/renomeado e adição/remoção de fixação são mapeados para eventos do sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está ativado.
- Metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O iniciador da thread e a semeadura inicial do contexto de histórico da thread são filtrados por allowlists de remetentes configuradas quando aplicável.
- Ações de bloco, atalhos e interações modais emitem eventos de sistema estruturados `Slack interaction: ...` com campos de payload avançados:
  - ações de bloco: valores selecionados, rótulos, valores de seletores e metadados `workflow_*`
  - atalhos globais: metadados de callback e ator, roteados para a sessão direta do ator
  - atalhos de mensagem: contexto de callback, ator, canal, thread e mensagem selecionada
  - eventos modais `view_submission` e `view_closed` com metadados de canal roteado e entradas de formulário

Defina atalhos globais ou de mensagem na configuração do seu app Slack e use qualquer ID de callback não vazio. O OpenClaw confirma payloads de atalho correspondentes, aplica a mesma política de remetente de DM/canal das outras interações do Slack e enfileira o evento higienizado para a sessão do agente roteada. IDs de acionamento e URLs de resposta são redigidos do contexto do agente.

## Referência de configuração

Referência principal: [Referência de configuração - Slack](/pt-BR/gateway/config-channels#slack).

<Accordion title="Campos de alto sinal do Slack">

- modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternância de compatibilidade: `dangerouslyAllowNameMatching` (emergencial; mantenha desativado a menos que necessário)
- acesso a canais: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threads/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks` (padrão: `false`), `unfurlMedia` para controle de prévia de link/mídia de `chat.postMessage`; defina `unfurlLinks: true` para voltar a habilitar prévias de links
- operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas nos canais">
    Verifique, em ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`) — **as chaves devem ser IDs de canal** (`C12345678`), não nomes (`#channel-name`). Chaves baseadas em nome falham silenciosamente com `groupPolicy: "allowlist"` porque o roteamento de canais usa ID primeiro por padrão. Para encontrar um ID: clique com o botão direito no canal no Slack → **Copiar link** — o valor `C...` no fim da URL é o ID do canal.
    - `requireMention`
    - allowlist de `users` por canal
    - `messages.groupChat.visibleReplies`: solicitações normais de grupo/canal usam `"automatic"` por padrão. Se você optou por `"message_tool"` e os logs mostram texto do assistente sem chamada `message(action=send)`, o modelo não usou o caminho visível da ferramenta de mensagem. O texto final permanece privado nesse modo; inspecione o log detalhado do gateway para metadados de payload suprimidos ou defina como `"automatic"` se quiser que toda resposta final normal do assistente seja publicada pelo caminho legado.
    - `messages.groupChat.unmentionedInbound`: se for `"room_event"`, conversas permitidas em canal sem menção são contexto ambiente e permanecem silenciosas a menos que o agente chame a ferramenta `message`. Consulte [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    Comandos úteis:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Mensagens de DM ignoradas">
    Verifique:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou o legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas de allowlist (`dmPolicy: "open"` ainda exige `channels.slack.allowFrom: ["*"]`)
    - DMs em grupo usam tratamento de MPIM; ative `channels.slack.dm.groupEnabled` e, se configurado, inclua a MPIM em `channels.slack.dm.groupChannels`
    - eventos de DM do Slack Assistant: logs detalhados que mencionam `drop message_changed`
      geralmente significam que o Slack enviou um evento editado de thread do Assistant sem um
      remetente humano recuperável nos metadados da mensagem

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode não conecta">
    Valide os tokens de bot + app e a ativação do Socket Mode nas configurações do app Slack.
    O App-Level Token precisa de `connections:write`, e o Bot User OAuth Token
    do bot deve pertencer ao mesmo app/workspace do Slack que o token do app.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o runtime atual não conseguiu resolver o valor baseado em SecretRef.

    Logs como `slack socket mode failed to start; retry ...` são falhas de
    inicialização recuperáveis. Escopos ausentes, tokens revogados e autenticação inválida falham rapidamente
    em vez disso. Um log `slack token mismatch ...` significa que o token do bot e o token do app
    parecem pertencer a apps Slack diferentes; corrija as credenciais do app Slack.

  </Accordion>

  <Accordion title="Modo HTTP não recebe eventos">
    Valide:

    - segredo de assinatura
    - caminho do webhook
    - URLs de solicitação do Slack (Eventos + Interatividade + Comandos de barra)
    - `webhookPath` único por conta HTTP
    - a URL pública encerra TLS e encaminha solicitações para o caminho do Gateway
    - o caminho `request_url` do app Slack corresponde exatamente a `channels.slack.webhookPath` (padrão `/slack/events`)

    Se `signingSecretStatus: "configured_unavailable"` aparecer em snapshots de
    conta, a conta HTTP está configurada, mas o runtime atual não conseguiu
    resolver o segredo de assinatura baseado em SecretRef.

    Um log repetido `slack: webhook path ... already registered` significa que duas contas HTTP
    estão usando o mesmo `webhookPath`; dê a cada conta um caminho distinto.

  </Accordion>

  <Accordion title="Comandos nativos/de barra não disparam">
    Verifique se você pretendia:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos de barra correspondentes registrados no Slack
    - ou modo de comando de barra único (`channels.slack.slashCommand.enabled: true`)

    O Slack não cria nem remove comandos de barra automaticamente. `commands.native: "auto"` não habilita comandos nativos do Slack; use `true` e crie os comandos correspondentes no app Slack. No modo HTTP, todo comando de barra do Slack deve incluir a URL do Gateway. No Socket Mode, as cargas de comando chegam pelo websocket e o Slack ignora `slash_commands[].url`.

    Verifique também `commands.useAccessGroups`, autorização de DM, allowlists de canais
    e allowlists de `users` por canal. O Slack retorna erros efêmeros para
    remetentes de comandos de barra bloqueados, incluindo:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referência de visão de anexos

O Slack pode anexar mídia baixada à rodada do agente quando os downloads de arquivos do Slack têm sucesso e os limites de tamanho permitem. Arquivos de imagem podem passar pelo caminho de compreensão de mídia ou diretamente para um modelo de resposta com capacidade de visão; outros arquivos são mantidos como contexto de arquivo baixável, em vez de tratados como entrada de imagem.

### Tipos de mídia compatíveis

| Tipo de mídia                  | Origem                 | Comportamento atual                                                             | Observações                                                                |
| ------------------------------ | ---------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Imagens JPEG / PNG / GIF / WebP | URL de arquivo Slack   | Baixadas e anexadas à rodada para tratamento com capacidade de visão             | Limite por arquivo: `channels.slack.mediaMaxMb` (padrão 20 MB)             |
| Arquivos PDF                   | URL de arquivo Slack   | Baixados e expostos como contexto de arquivo para ferramentas como `download-file` ou `pdf` | Entrada do Slack não converte PDFs automaticamente em entrada de visão por imagem |
| Outros arquivos                | URL de arquivo Slack   | Baixados quando possível e expostos como contexto de arquivo                     | Arquivos binários não são tratados como entrada de imagem                  |
| Respostas em threads           | Arquivos do início da thread | Arquivos da mensagem raiz podem ser hidratados como contexto quando a resposta não tem mídia direta | Inícios só com arquivos usam um placeholder de anexo                       |
| Mensagens com várias imagens   | Vários arquivos Slack  | Cada arquivo é avaliado independentemente                                       | O processamento do Slack é limitado a oito arquivos por mensagem          |

### Pipeline de entrada

Quando uma mensagem do Slack com anexos de arquivo chega:

1. O OpenClaw baixa o arquivo da URL privada do Slack usando o token do bot.
2. O arquivo é gravado no armazenamento de mídia em caso de sucesso.
3. Caminhos de mídia baixada e tipos de conteúdo são adicionados ao contexto de entrada.
4. Caminhos de modelo/ferramenta com capacidade de imagem podem usar anexos de imagem desse contexto.
5. Arquivos que não são imagem permanecem disponíveis como metadados de arquivo ou referências de mídia para ferramentas que conseguem lidar com eles.

### Herança de anexos da raiz da thread

Quando uma mensagem chega em uma thread (tem um pai `thread_ts`):

- Se a própria resposta não tiver mídia direta e a mensagem raiz incluída tiver arquivos, o Slack pode hidratar os arquivos raiz como contexto de início da thread.
- Anexos diretos da resposta têm precedência sobre anexos da mensagem raiz.
- Uma mensagem raiz que tenha apenas arquivos e nenhum texto é representada com um placeholder de anexo para que o fallback ainda possa incluir seus arquivos.

### Tratamento de vários anexos

Quando uma única mensagem do Slack contém vários anexos de arquivo:

- Cada anexo é processado independentemente pelo pipeline de mídia.
- Referências de mídia baixada são agregadas ao contexto da mensagem.
- A ordem de processamento segue a ordem dos arquivos do Slack na carga do evento.
- Uma falha no download de um anexo não bloqueia os outros.

### Limites de tamanho, download e modelo

- **Limite de tamanho**: padrão de 20 MB por arquivo. Configurável via `channels.slack.mediaMaxMb`.
- **Falhas de download**: arquivos que o Slack não consegue servir, URLs expiradas, arquivos inacessíveis, arquivos grandes demais e respostas HTML de autenticação/login do Slack são ignorados em vez de serem relatados como formatos não compatíveis.
- **Modelo de visão**: a análise de imagem usa o modelo de resposta ativo quando ele oferece suporte a visão, ou o modelo de imagem configurado em `agents.defaults.imageModel`.

### Limites conhecidos

| Cenário                                | Comportamento atual                                                         | Solução alternativa                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de arquivo Slack expirada          | Arquivo ignorado; nenhum erro exibido                                        | Reenvie o arquivo no Slack                                                 |
| Modelo de visão não configurado        | Anexos de imagem são armazenados como referências de mídia, mas não analisados como imagens | Configure `agents.defaults.imageModel` ou use um modelo de resposta com capacidade de visão |
| Imagens muito grandes (> 20 MB por padrão) | Ignoradas conforme o limite de tamanho                                    | Aumente `channels.slack.mediaMaxMb` se o Slack permitir                    |
| Anexos encaminhados/compartilhados     | Texto e mídia de imagem/arquivo hospedada no Slack são de melhor esforço     | Compartilhe novamente diretamente na thread do OpenClaw                    |
| Anexos PDF                             | Armazenados como contexto de arquivo/mídia, não roteados automaticamente pela visão de imagem | Use `download-file` para metadados de arquivo ou a ferramenta `pdf` para análise de PDF |

### Documentação relacionada

- [Pipeline de compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Ferramenta PDF](/pt-BR/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitação de visão de anexos do Slack
- Testes de regressão: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificação ao vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionados

<CardGroup cols={2}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    Emparelhe um usuário do Slack ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de canal e DM de grupo.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Layout e precedência da configuração.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Catálogo e comportamento de comandos.
  </Card>
</CardGroup>
