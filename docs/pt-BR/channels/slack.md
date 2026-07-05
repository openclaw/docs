---
read_when:
    - Configurando o Slack ou depurando o modo de socket, HTTP ou relay do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Socket Mode, URLs de solicitação HTTP e modo de retransmissão)
title: Slack
x-i18n:
    generated_at: "2026-07-05T02:00:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b8011f0fce235aa3995ab93c5716ed2112a847cf3dc7a6f9589048d9575bafc
    source_path: channels/slack.md
    workflow: 16
---

Pronto para produção para DMs e canais por meio de integrações de app do Slack. O modo padrão é Socket Mode; URLs de solicitação HTTP também são compatíveis. O modo de relay é destinado a implantações gerenciadas em que um roteador confiável controla a entrada do Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    DMs do Slack usam o modo de pareamento por padrão.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnóstico entre canais e playbooks de reparo.
  </Card>
</CardGroup>

## Escolhendo Socket Mode ou URLs de solicitação HTTP

Ambos os transportes estão prontos para produção e alcançam paridade de recursos para mensagens, comandos de barra, App Home e interatividade. Escolha pelo formato da implantação, não pelos recursos.

| Aspecto                      | Socket Mode (padrão)                                                                                                                                | URLs de solicitação HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública do Gateway           | Não obrigatória                                                                                                                                         | Obrigatória (DNS, TLS, proxy reverso ou túnel)                                                                   |
| Rede de saída             | WSS de saída para `wss-primary.slack.com` deve estar acessível                                                                                            | Sem WS de saída; apenas HTTPS de entrada                                                                             |
| Tokens necessários                | Token de bot + token de nível de app com `connections:write`                                                                                                 | Token de bot + Signing Secret                                                                                     |
| Laptop de desenvolvimento / atrás de firewall | Funciona como está                                                                                                                                          | Precisa de um túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou Gateway de staging                          |
| Escalabilidade horizontal           | Uma sessão de Socket Mode por app por host; múltiplos Gateways precisam de apps do Slack separados                                                                 | Manipulador POST sem estado; múltiplas réplicas do Gateway podem compartilhar um app atrás de um balanceador de carga                     |
| Várias contas em um Gateway | Compatível; cada conta abre seu próprio WS                                                                                                             | Compatível; cada conta precisa de um `webhookPath` único (padrão `/slack/events`) para que os registros não colidam |
| Transporte de comando de barra      | Entregue pela conexão WS; `slash_commands[].url` é ignorado                                                                                  | O Slack envia POST para `slash_commands[].url`; o campo é obrigatório para o comando ser despachado                           |
| Assinatura da solicitação              | Não usada (a autenticação é o token de nível de app)                                                                                                               | O Slack assina cada solicitação; o OpenClaw verifica com `signingSecret`                                              |
| Recuperação em queda de conexão  | A reconexão automática do SDK do Slack fica habilitada; o OpenClaw também reinicia sessões de Socket Mode com falha usando backoff limitado. Aplica-se o ajuste de transporte por tempo limite de pong. | Sem conexão persistente para cair; novas tentativas são por solicitação a partir do Slack                                           |

<Note>
  **Escolha Socket Mode** para hosts com um único Gateway, laptops de desenvolvimento e redes locais que conseguem acessar `*.slack.com` na saída, mas não conseguem aceitar HTTPS de entrada.

**Escolha URLs de solicitação HTTP** ao executar múltiplas réplicas do Gateway atrás de um balanceador de carga, quando WSS de saída estiver bloqueado mas HTTPS de entrada for permitido, ou quando você já encerrar webhooks do Slack em um proxy reverso.
</Note>

### Modo de relay

O modo de relay separa a entrada do Slack do gateway do OpenClaw. Um roteador confiável controla a
conexão única do Slack em Socket Mode, escolhe um gateway de destino e encaminha um evento
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

A URL de relay deve usar `wss://`, a menos que aponte para localhost. Trate o token de bearer e
a tabela de rotas do roteador como parte do limite de autorização do Slack: eventos roteados entram no
manipulador normal de mensagens do Slack como ativações autorizadas. Uma `slack_identity`
fornecida pelo roteador no frame `hello` do websocket pode definir o nome de usuário e o ícone padrão de saída; uma
identidade explícita fornecida pelo chamador ainda prevalece. A conexão de relay se reconecta com a mesma
temporização de backoff limitado usada pelo Socket Mode e limpa a identidade fornecida pelo roteador sempre que
é desconectada.

## Instalar

Instale o Slack antes de configurar o canal:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra e habilita o Plugin. O Plugin ainda não faz nada até você configurar o app do Slack e as configurações de canal abaixo. Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento geral de Plugin e regras de instalação.

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifestos abaixo → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
          **Recommended** corresponde ao conjunto completo de recursos do Plugin do Slack: App Home, comandos de barra, arquivos, reações, pins, DMs em grupo e leituras de emoji/grupo de usuários. Escolha **Minimal** quando a política do workspace restringir escopos — ele cobre DMs, histórico de canais/grupos, menções e comandos de barra, mas remove arquivos, reações, pins, DM em grupo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulte [Checklist de manifesto e escopos](#manifest-and-scope-checklist) para a justificativa por escopo e opções aditivas, como comandos de barra extras.
        </Note>

        Depois que o Slack criar o app:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: adicione `connections:write`, salve e copie o token de nível de app.
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

  <Tab title="URLs de requisição HTTP">
    <Steps>
      <Step title="Criar um novo app do Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifestos abaixo → substitua `https://gateway-host.example.com/slack/events` pela URL pública do seu Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
          **Recommended** corresponde ao conjunto completo de recursos do Plugin do Slack; **Minimal** remove arquivos, reações, pins, DMs em grupo (`mpim:*`), `emoji:read` e `usergroups:read` para workspaces restritivos. Consulte a [lista de verificação de manifesto e escopos](#manifest-and-scope-checklist) para a justificativa de cada escopo.
        </Note>

        <Info>
          Os três campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apontam todos para o mesmo endpoint do OpenClaw. O esquema de manifesto do Slack exige que eles tenham nomes separados, mas o OpenClaw roteia por tipo de payload, então um único `webhookPath` (padrão `/slack/events`) é suficiente. Comandos slash sem `slash_commands[].url` serão ignorados silenciosamente no modo HTTP.
        </Info>

        Depois que o Slack criar o app:

        - **Basic Information → App Credentials**: copie o **Signing Secret** para verificação de requisições.
        - **Install App -> Install to Workspace**: copie o Bot User OAuth Token.

      </Step>

      <Step title="Configurar o OpenClaw">

        Configuração SecretRef recomendada:

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

        Dê a cada conta um `webhookPath` distinto (padrão `/slack/events`) para que os registros não colidam.
        </Note>

      </Step>

      <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ajuste de transporte do Socket Mode

O OpenClaw define o timeout de pong do cliente do SDK do Slack como 15 segundos por padrão para o Socket Mode. Sobrescreva as configurações de transporte somente quando precisar de ajustes específicos de workspace ou host:

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

Use isto somente para workspaces em Socket Mode que registram timeouts de pong/websocket ou server-ping do Slack, ou que rodam em hosts com inanição conhecida do loop de eventos. `clientPingTimeout` é a espera pelo pong depois que o SDK envia um ping do cliente; `serverPingTimeout` é a espera por pings do servidor do Slack. Mensagens e eventos do app continuam sendo estado da aplicação, não sinais de vivacidade do transporte.

Notas:

- `socketMode` é ignorado no modo URL de requisição HTTP.
- As configurações base de `channels.slack.socketMode` se aplicam a todas as contas do Slack, a menos que sejam sobrescritas. Sobrescritas por conta usam `channels.slack.accounts.<accountId>.socketMode`; como isso é uma sobrescrita de objeto, inclua todos os campos de ajuste de socket que você quiser para essa conta.
- Somente `clientPingTimeout` tem um padrão do OpenClaw (`15000`). `serverPingTimeout` e `pingPongLoggingEnabled` são passados para o SDK do Slack somente quando configurados.
- O backoff de reinício do Socket Mode começa em torno de 2 segundos e tem limite em torno de 30 segundos. Falhas recuperáveis de início, espera de início e desconexão tentam novamente até que o canal pare. Erros permanentes de conta e credenciais, como autenticação inválida, tokens revogados ou escopos ausentes, falham rapidamente em vez de tentar para sempre.

## Lista de verificação de manifesto e escopos

O manifesto base do app Slack é o mesmo para Socket Mode e URLs de requisição HTTP. Apenas o bloco `settings` (e a `url` do comando slash) difere.

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

Para o **modo URLs de requisição HTTP**, substitua `settings` pela variante HTTP e adicione `url` a cada comando slash. URL pública obrigatória:

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

Expõe diferentes recursos que estendem os padrões acima.

O manifesto padrão habilita a aba **Home** do Slack App Home e assina `app_home_opened`. Quando um membro do workspace abre a aba Home, o OpenClaw publica uma visualização Home padrão segura com `views.publish`; nenhuma carga de conversa ou configuração privada é incluída. A aba **Messages** permanece habilitada para DMs do Slack. O manifesto também habilita threads de assistente do Slack com `features.assistant_view`, `assistant:write`, `assistant_thread_started` e `assistant_thread_context_changed`; threads de assistente são roteadas para suas próprias sessões de thread do OpenClaw e mantêm o contexto de thread fornecido pelo Slack disponível para o agente.

<AccordionGroup>
  <Accordion title="Comandos de barra nativos opcionais">

    Vários [comandos de barra nativos](#commands-and-slash-behavior) podem ser usados em vez de um único comando configurado, com algumas nuances:

    - Use `/agentstatus` em vez de `/status`, porque o comando `/status` é reservado.
    - No máximo 25 comandos de barra podem ficar disponíveis ao mesmo tempo.

    Substitua sua seção `features.slash_commands` existente por um subconjunto dos [comandos disponíveis](/pt-BR/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (padrão)">

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
      <Tab title="URLs de solicitação HTTP">
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

        Repita esse valor de `url` em cada comando da lista.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Escopos de autoria opcionais (operações de escrita)">
    Adicione o escopo de bot `chat:write.customize` se quiser que mensagens enviadas usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do app Slack.

    Se você usar um ícone de emoji, o Slack espera a sintaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Escopos opcionais de token de usuário (operações de leitura)">
    Se você configurar `channels.slack.userToken`, os escopos de leitura típicos são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depende de leituras de busca do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de tokens

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP requer `botToken` + `signingSecret`.
- O modo Relay requer `botToken` mais `relay.url`, `relay.authToken` e `relay.gatewayId`; ele não usa token de app nem segredo de assinatura.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` e `userToken` aceitam strings em texto claro
  ou objetos SecretRef.
- Tokens de configuração substituem o fallback de env.
- O fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica apenas à conta padrão.
- `userToken` é somente de configuração (sem fallback de env) e o padrão é comportamento somente leitura (`userTokenReadOnly: true`).

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
Para leituras de ações/diretório, o token de usuário pode ser preferido quando configurado. Para escritas, o token de bot continua sendo preferido; escritas com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot está indisponível.
</Tip>

## Ações e controles

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ações disponíveis nas ferramentas atuais do Slack:

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
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso a DMs. `channels.slack.allowFrom` é a allowlist canônica de DM.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `channels.slack.allowFrom` inclua `"*"`)
    - `disabled`

    Flags de DM:

    - `dm.enabled` (padrão verdadeiro)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo padrão falso)
    - `dm.groupChannels` (allowlist MPIM opcional)

    Precedência de várias contas:

    - `channels.slack.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` legados ainda são lidos por compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e **deve usar IDs de canal estáveis do Slack** (por exemplo, `C12345678`) como chaves de configuração.

    Observação de runtime: se `channels.slack` estiver completamente ausente (configuração somente por env), o runtime usa fallback para `groupPolicy="allowlist"` e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    Resolução de nome/ID:

    - entradas da allowlist de canais e entradas da allowlist de DM são resolvidas na inicialização quando o acesso ao token permite
    - entradas de nome de canal não resolvidas são mantidas como configuradas, mas ignoradas para roteamento por padrão
    - autorização de entrada e roteamento de canal são ID-first por padrão; correspondência direta de nome de usuário/slug requer `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Chaves baseadas em nome (`#channel-name` ou `channel-name`) **não** correspondem em `groupPolicy: "allowlist"`. A busca de canal é ID-first por padrão, então uma chave baseada em nome nunca será roteada com sucesso e todas as mensagens nesse canal serão bloqueadas silenciosamente. Isso difere de `groupPolicy: "open"`, em que a chave do canal não é necessária para roteamento e uma chave baseada em nome parece funcionar.

    Sempre use o ID do canal do Slack como chave. Para encontrá-lo: clique com o botão direito no canal no Slack → **Copy link** — o ID (`C...`) aparece no fim da URL.

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

  <Tab title="Menções e usuários de canal">
    Mensagens de canal exigem menção por padrão.

    Fontes de menção:

    - menção explícita ao app (`<@botId>`)
    - menção a grupo de usuários do Slack (`<!subteam^S...>`) quando o usuário bot é membro desse grupo de usuários; requer `usergroups:read`
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de thread em resposta ao bot (desabilitado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes apenas por resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `users` (lista de permissões)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de chave de `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, ou curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

    `ignoreOtherMentions` tem valor padrão `false`. Quando `true`, mensagens de canal que mencionam outro usuário ou grupo de usuários, mas não este bot, são armazenadas como contexto pendente e não são processadas. DMs e DMs em grupo não são afetadas. O filtro exige um ID de usuário do bot vindo de `auth.test`; se essa identidade não estiver disponível, as mensagens passam sem alterações.

    `allowBots` é conservador para canais e canais privados: mensagens de sala escritas por bots são aceitas apenas quando o bot remetente está explicitamente listado na lista de permissões `users` dessa sala, ou quando pelo menos um ID explícito de proprietário do Slack vindo de `channels.slack.allowFrom` é atualmente membro da sala. Curingas e entradas de proprietário por nome de exibição não satisfazem a presença do proprietário. A presença do proprietário usa `conversations.members` do Slack; garanta que o app tenha o escopo de leitura correspondente ao tipo de sala (`channels:read` para canais públicos, `groups:read` para canais privados). Se a consulta de membros falhar, o OpenClaw descarta a mensagem de sala escrita por bot.

    Mensagens aceitas do Slack escritas por bots usam a [proteção contra loop de bot](/pt-BR/channels/bot-loop-protection) compartilhada. Configure `channels.defaults.botLoopProtection` para o orçamento padrão e depois substitua por `channels.slack.botLoopProtection` ou `channels.slack.channels.<id>.botLoopProtection` quando um workspace ou canal precisar de um limite diferente.

  </Tab>
</Tabs>

## Threads, sessões e etiquetas de resposta

- DMs roteiam como `direct`; canais como `channel`; MPIMs como `group`.
- Vínculos de rota do Slack aceitam IDs brutos de pares, além de formas de destino do Slack como `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Com o padrão `session.dmScope=main`, DMs do Slack colapsam para a sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Mensagens comuns de nível superior em canais permanecem na sessão por canal, mesmo quando `replyToMode` não é `off`.
- Respostas em threads do Slack usam o `thread_ts` do Slack pai para os sufixos de sessão (`:thread:<threadTs>`), mesmo quando o encadeamento de respostas de saída está desabilitado com `replyToMode="off"`.
- O OpenClaw injeta uma raiz elegível de canal de nível superior em `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` quando se espera que essa raiz inicie uma thread visível no Slack, para que a raiz e respostas posteriores na thread compartilhem uma sessão do OpenClaw. Isso se aplica a eventos `app_mention`, correspondências explícitas ao bot ou a padrões de menção configurados, e canais com `requireMention: false` e `replyToMode` diferente de `off`.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desabilitar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em threads para que o bot responda apenas a menções explícitas `@bot` dentro de threads, mesmo quando o bot já participou da thread. Sem isso, respostas em uma thread com participação do bot ignoram o bloqueio de `requireMention`.

Controles de encadeamento de respostas:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para conversas diretas: `channels.slack.dm.replyToMode`

Etiquetas manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respostas explícitas em threads do Slack pela ferramenta `message`, defina `replyBroadcast: true` com `action: "send"` e `threadId` ou `replyTo` para pedir ao Slack que também transmita a resposta da thread para o canal pai. Isso mapeia para a flag `reply_broadcast` de `chat.postMessage` do Slack e só é compatível com envios de texto ou Block Kit, não com uploads de mídia.

Quando uma chamada da ferramenta `message` roda dentro de uma thread do Slack e mira o mesmo canal, o OpenClaw normalmente herda a thread atual do Slack conforme `replyToMode`. Defina `topLevel: true` em `action: "send"` ou `action: "upload-file"` para forçar uma nova mensagem no canal pai. `threadId: null` é aceito como a mesma opção de saída para nível superior.

<Note>
`replyToMode="off"` desabilita o encadeamento de respostas de saída do Slack, incluindo etiquetas explícitas `[[reply_to_*]]`. Ele não achata sessões de thread de entrada do Slack: mensagens já postadas dentro de uma thread do Slack ainda roteiam para a sessão `:thread:<threadTs>`. Isso difere do Telegram, onde etiquetas explícitas ainda são respeitadas no modo `"off"`. Threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram permanecem visíveis em linha.
</Note>

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw está processando uma mensagem de entrada. `ackReactionScope` decide _quando_ esse emoji é realmente enviado.

### Emoji (`ackReaction`)

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback de emoji da identidade do agente (`agents.list[].identity.emoji`; caso contrário, `"eyes"` / 👀)

Observações:

- O Slack espera shortcodes (por exemplo, `"eyes"`).
- Use `""` para desabilitar a reação para a conta do Slack ou globalmente.

### Escopo (`messages.ackReactionScope`)

O provedor Slack lê o escopo de `messages.ackReactionScope` (padrão `"group-mentions"`). Hoje não há substituição em nível de conta do Slack ou de canal do Slack; o valor é global para o Gateway.

Valores:

- `"all"`: reage em DMs e grupos.
- `"direct"`: reage apenas em DMs.
- `"group-all"`: reage a toda mensagem de grupo (sem DMs).
- `"group-mentions"` (padrão): reage em grupos, mas apenas quando o bot é mencionado (ou em mencionáveis de grupo que optaram por participar). **DMs são excluídas.**
- `"off"` / `"none"`: nunca reage.

<Note>
O escopo padrão (`"group-mentions"`) não dispara reações de confirmação em mensagens diretas. Para ver o `ackReaction` configurado (por exemplo, `"eyes"`) em DMs de entrada do Slack, defina `messages.ackReactionScope` como `"direct"` ou `"all"`. `messages.ackReactionScope` é lido na inicialização do provedor Slack, então é necessário reiniciar o Gateway para a alteração surtir efeito.
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

`channels.slack.streaming` controla o comportamento de prévia ao vivo:

- `off`: desabilita o streaming de prévia ao vivo.
- `partial` (padrão): substitui o texto de prévia pela saída parcial mais recente.
- `block`: acrescenta atualizações de prévia em partes.
- `progress`: mostra texto de status de progresso durante a geração e depois envia o texto final.
- `streaming.preview.toolProgress`: quando a prévia de rascunho está ativa, roteia atualizações de ferramenta/progresso para a mesma mensagem de prévia editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: defina como `status` para manter linhas compactas de progresso de ferramentas enquanto oculta texto bruto de comando/execução (padrão: `raw`).

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

Cartões de tarefa nativos de progresso do Slack são opcionais no modo de progresso. Defina `channels.slack.streaming.progress.nativeTaskCards` como `true` com `channels.slack.streaming.mode="progress"` para enviar um cartão de plano/tarefa nativo do Slack enquanto o trabalho está em execução e depois atualizar o mesmo cartão de tarefa na conclusão. Sem essa flag, o modo de progresso mantém o comportamento portátil de prévia de rascunho.

- Uma thread de resposta deve estar disponível para que o streaming de texto nativo e o status de thread do assistente do Slack apareçam. A seleção da thread ainda segue `replyToMode`.
- Raízes de canais, conversas em grupo e DMs de nível superior ainda podem usar a prévia de rascunho normal quando o streaming nativo está indisponível ou não existe thread de resposta.
- DMs de nível superior do Slack ficam fora de thread por padrão, então não mostram a prévia nativa de stream/status em estilo de thread do Slack; em vez disso, o OpenClaw posta e edita uma prévia de rascunho na DM.
- Mídia e cargas não textuais usam a entrega normal como fallback.
- Finais de mídia/erro cancelam edições de prévia pendentes; finais elegíveis de texto/bloco só são descarregados quando podem editar a prévia no lugar.
- Se o streaming falhar no meio da resposta, o OpenClaw usa a entrega normal como fallback para as cargas restantes.

Use prévia de rascunho em vez de streaming de texto nativo do Slack:

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

Opte por cartões de tarefa nativos de progresso do Slack:

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
- booleano `channels.slack.streaming` é um alias legado de runtime para `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legado é um alias de runtime para `channels.slack.streaming.nativeTransport`.
- Execute `openclaw doctor --fix` para reescrever a configuração persistida de streaming do Slack para as chaves canônicas.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem de entrada do Slack enquanto o OpenClaw está processando uma resposta e depois a remove quando a execução termina. Isso é mais útil fora de respostas em threads, que usam um indicador de status padrão "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera shortcodes (por exemplo, `"hourglass_flowing_sand"`).
- A reação é de melhor esforço, e a limpeza é tentada automaticamente depois que a resposta ou o caminho de falha é concluído.

## Mídia, divisão em partes e entrega

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de requisição autenticada por token) e gravados no armazenamento de mídia quando a busca é bem-sucedida e os limites de tamanho permitem. Placeholders de arquivo incluem o `fileId` do Slack para que agentes possam buscar o arquivo original com `download-file`.

    Downloads usam timeouts delimitados de inatividade e tempo total. Se a recuperação de arquivo do Slack travar ou falhar, o OpenClaw continua processando a mensagem e usa o placeholder de arquivo como fallback.

    O limite de tamanho de entrada em runtime tem padrão `20MB`, a menos que seja substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - partes de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão priorizando parágrafos
    - envios de arquivo usam APIs de upload do Slack e podem incluir respostas em threads (`thread_ts`)
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam padrões por tipo MIME do pipeline de mídia

  </Accordion>

  <Accordion title="Delivery targets">
    Destinos explícitos preferenciais:

    - `user:<id>` para DMs
    - `channel:<id>` para canais

    DMs do Slack apenas com texto/blocos podem postar diretamente para IDs de usuário; uploads de arquivo e envios em thread abrem primeiro a DM por APIs de conversa do Slack porque esses caminhos exigem um ID de conversa concreto.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de barra

Comandos de barra aparecem no Slack como um único comando configurado ou vários comandos nativos. Configure `channels.slack.slashCommand` para alterar os padrões de comando:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Comandos nativos exigem [configurações adicionais de manifesto](#additional-manifest-settings) no seu app Slack e, em vez disso, são habilitados com `channels.slack.commands.native: true` ou `commands.native: true` em configurações globais.

- O modo automático de comando nativo fica **desativado** para Slack, então `commands.native: "auto"` não habilita comandos nativos do Slack.

```txt
/help
```

Menus de argumentos nativos usam uma estratégia de renderização adaptativa que mostra um modal de confirmação antes de despachar um valor de opção selecionado:

- até 5 opções: blocos de botões
- 6-100 opções: menu de seleção estático
- mais de 100 opções: seleção externa com filtragem assíncrona de opções quando manipuladores de opções de interatividade estão disponíveis
- limites do Slack excedidos: valores de opção codificados recorrem a botões

```txt
/think
```

Sessões de slash usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda roteiam execuções de comando para a sessão de conversa de destino usando `CommandTargetSessionKey`.

## Respostas interativas

O Slack pode renderizar controles de resposta interativa escritos pelo agente, mas esse recurso fica desabilitado por padrão.
Para novas saídas de agente, CLI e Plugin, prefira os botões ou blocos de seleção
`presentation` compartilhados. Eles usam o mesmo caminho de interação do Slack
e também degradam em outros canais.

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

Ou habilite apenas para uma conta Slack:

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

Quando habilitado, agentes ainda podem emitir diretivas de resposta obsoletas exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas em Slack Block Kit e roteiam cliques ou seleções
de volta pelo caminho de evento de interação existente do Slack. Mantenha-as para
prompts antigos e escapes específicos do Slack; use apresentação compartilhada para novos
controles portáteis.

As APIs do compilador de diretivas também estão obsoletas para novo código produtor:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Use payloads `presentation` e `buildSlackPresentationBlocks(...)` para novos
controles renderizados no Slack.

Observações:

- Esta é uma interface legada específica do Slack. Outros canais não traduzem diretivas Slack Block
  Kit para seus próprios sistemas de botões.
- Os valores de callback interativo são tokens opacos gerados pelo OpenClaw, não valores brutos escritos pelo agente.
- Se blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw recorre à resposta de texto original em vez de enviar um payload de blocos inválido.

### Envios de modal pertencentes ao Plugin

Plugins do Slack que registram um manipulador interativo também podem receber eventos de ciclo de vida
`view_submission` e `view_closed` antes que o OpenClaw compacte
o payload para o evento de sistema visível ao agente. Use um destes padrões de roteamento
ao abrir um modal do Slack:

- Defina `callback_id` como `openclaw:<namespace>:<payload>`.
- Ou mantenha um `callback_id` existente e coloque `pluginInteractiveData:
"<namespace>:<payload>"` no `private_metadata` do modal.

O manipulador recebe `ctx.interaction.kind` como `view_submission` ou
`view_closed`, `inputs` normalizados e o objeto bruto completo `stateValues` do
Slack. O roteamento somente por ID de callback é suficiente para invocar o manipulador do plugin; inclua
os campos de roteamento de usuário/sessão existentes em `private_metadata` do modal quando o
modal também deve produzir um evento de sistema visível ao agente. O agente recebe um
evento de sistema compacto e redigido `Slack interaction: ...`. Se o manipulador retornar
`systemEvent.summary`, `systemEvent.reference` ou `systemEvent.data`, esses
campos serão incluídos nesse evento compacto para que o agente possa referenciar
armazenamento pertencente ao plugin sem ver o payload completo do formulário.

## Aprovações nativas no Slack

O Slack pode atuar como um cliente de aprovação nativo com botões e interações interativos, em vez de recorrer à Web UI ou ao terminal.

- Aprovações de exec e plugin podem ser renderizadas como prompts Slack-native Block Kit.
- `channels.slack.execApprovals.*` continua sendo a configuração de habilitação do cliente nativo de aprovação de exec e de roteamento para DM/canal.
- DMs de aprovação de exec usam `channels.slack.execApprovals.approvers` ou `commands.ownerAllowFrom`.
- Aprovações de Plugin usam botões nativos do Slack quando o Slack está habilitado como cliente de aprovação nativo para a sessão de origem, ou quando `approvals.plugin` roteia para a sessão Slack de origem ou para um destino Slack.
- DMs de aprovação de Plugin usam aprovadores do plugin Slack de `channels.slack.allowFrom`, `allowFrom` de conta nomeada ou a rota padrão da conta.
- A autorização do aprovador ainda é imposta: aprovadores somente de exec não podem aprovar solicitações de plugin, a menos que também sejam aprovadores de plugin.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do seu app Slack, prompts de aprovação são renderizados como botões Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX de aprovação principal; o OpenClaw
só deve incluir um comando manual `/approve` quando o resultado da ferramenta diz que aprovações
por chat estão indisponíveis ou que a aprovação manual é o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações nativas de exec quando `enabled` não está definido ou é `"auto"` e pelo menos um
aprovador de exec é resolvido. O Slack também pode lidar com aprovações nativas de plugin por esse caminho de cliente nativo
quando aprovadores do plugin Slack são resolvidos e a solicitação corresponde aos filtros de cliente nativo. Defina
`enabled: false` para desabilitar explicitamente o Slack como cliente de aprovação nativo. Defina `enabled: true` para
forçar aprovações nativas quando aprovadores forem resolvidos. Desabilitar aprovações de exec do Slack não desabilita
a entrega de aprovação nativa de plugin do Slack habilitada por meio de `approvals.plugin`; a entrega de aprovação de plugin
usa aprovadores do plugin Slack em vez disso.

Comportamento padrão sem configuração explícita de aprovação de exec do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Configuração explícita Slack-native só é necessária quando você quer substituir aprovadores, adicionar filtros ou
aderir à entrega no chat de origem:

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

O encaminhamento compartilhado `approvals.exec` é separado. Use-o apenas quando prompts de aprovação de exec também precisarem
ser roteados para outros chats ou destinos explícitos fora de banda. O encaminhamento compartilhado `approvals.plugin` também é
separado; a entrega nativa do Slack suprime esse fallback apenas quando o Slack consegue lidar com a solicitação de aprovação de plugin
nativamente.

`/approve` no mesmo chat também funciona em canais e DMs do Slack que já dão suporte a comandos. Veja [Aprovações de exec](/pt-BR/tools/exec-approvals) para o modelo completo de encaminhamento de aprovação.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens são mapeadas para eventos de sistema.
- Transmissões de threads (respostas de thread com "Também enviar para o canal") são processadas como mensagens normais de usuário.
- Eventos de adicionar/remover reação são mapeados para eventos de sistema.
- Eventos de entrada/saída de membro, canal criado/renomeado e adicionar/remover fixação são mapeados para eventos de sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O contexto inicial de iniciador de thread e histórico de thread é filtrado por allowlists de remetentes configuradas quando aplicável.
- Ações de bloco, atalhos e interações de modal emitem eventos de sistema estruturados `Slack interaction: ...` com campos de payload ricos:
  - ações de bloco: valores selecionados, rótulos, valores de seletor e metadados `workflow_*`
  - atalhos globais: metadados de callback e ator, roteados para a sessão direta do ator
  - atalhos de mensagem: callback, ator, canal, thread e contexto da mensagem selecionada
  - eventos de modal `view_submission` e `view_closed` com metadados de canal roteados e entradas de formulário

Defina atalhos globais ou de mensagem na configuração do seu app Slack e use qualquer ID de callback não vazio. O OpenClaw confirma payloads de atalho correspondentes, aplica a mesma política de remetente de DM/canal que outras interações do Slack e enfileira o evento sanitizado para a sessão de agente roteada. IDs de acionamento e URLs de resposta são redigidos do contexto do agente.

## Referência de configuração

Referência principal: [Referência de configuração - Slack](/pt-BR/gateway/config-channels#slack).

<Accordion title="Campos Slack de alto sinal">

- modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternância de compatibilidade: `dangerouslyAllowNameMatching` (emergência; mantenha desativado, a menos que seja necessário)
- acesso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurls: `unfurlLinks` (padrão: `false`), `unfurlMedia` para controle de prévia de link/mídia de `chat.postMessage`; defina `unfurlLinks: true` para reativar prévias de links
- ops/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, em ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`) — **as chaves devem ser IDs de canal** (`C12345678`), não nomes (`#channel-name`). Chaves baseadas em nome falham silenciosamente com `groupPolicy: "allowlist"` porque o roteamento de canal é por ID por padrão. Para encontrar um ID: clique com o botão direito no canal no Slack → **Copiar link** — o valor `C...` no fim da URL é o ID do canal.
    - `requireMention`
    - allowlist de `users` por canal
    - `messages.groupChat.visibleReplies`: solicitações normais de grupo/canal usam `"automatic"` por padrão. Se você aderiu a `"message_tool"` e os logs mostram texto do assistente sem chamada `message(action=send)`, o modelo perdeu o caminho da ferramenta de mensagem visível. O texto final permanece privado nesse modo; inspecione o log detalhado do Gateway em busca de metadados de payload suprimidos ou defina como `"automatic"` se quiser que toda resposta final normal do assistente seja publicada pelo caminho legado.
    - `messages.groupChat.unmentionedInbound`: se for `"room_event"`, conversa de canal permitida sem menção é contexto ambiente e permanece silenciosa, a menos que o agente chame a ferramenta `message`. Veja [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events).

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
    - `channels.slack.dmPolicy` (ou legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas de allowlist (`dmPolicy: "open"` ainda exige `channels.slack.allowFrom: ["*"]`)
    - DMs de grupo usam tratamento MPIM; habilite `channels.slack.dm.groupEnabled` e, se configurado, inclua o MPIM em `channels.slack.dm.groupChannels`
    - Eventos de DM do Slack Assistant: logs detalhados mencionando `drop message_changed`
      geralmente significam que o Slack enviou um evento de thread do Assistant editado sem um
      remetente humano recuperável nos metadados da mensagem

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Modo Socket não conecta">
    Valide os tokens do bot e do app e a habilitação do Socket Mode nas configurações do app Slack.
    O token de nível de app precisa de `connections:write`, e o token de bot
    Bot User OAuth Token deve pertencer ao mesmo app/workspace do Slack que o token do app.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o runtime atual não conseguiu resolver o valor apoiado por
    SecretRef.

    Logs como `slack socket mode failed to start; retry ...` são falhas de
    inicialização recuperáveis. Escopos ausentes, tokens revogados e autenticação inválida falham rapidamente.
    Um log `slack token mismatch ...` significa que o token do bot e o token do app
    parecem pertencer a apps Slack diferentes; corrija as credenciais do app Slack.

  </Accordion>

  <Accordion title="Modo HTTP não recebe eventos">
    Valide:

    - segredo de assinatura
    - caminho do Webhook
    - URLs de solicitação do Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` exclusivo por conta HTTP
    - a URL pública termina TLS e encaminha solicitações para o caminho do Gateway
    - o caminho `request_url` do app Slack corresponde exatamente a `channels.slack.webhookPath` (padrão `/slack/events`)

    Se `signingSecretStatus: "configured_unavailable"` aparecer em snapshots de
    conta, a conta HTTP está configurada, mas o runtime atual não conseguiu
    resolver o segredo de assinatura apoiado por SecretRef.

    Um log repetido `slack: webhook path ... already registered` significa que duas contas HTTP
    estão usando o mesmo `webhookPath`; dê a cada conta um caminho distinto.

  </Accordion>

  <Accordion title="Comandos nativos/slash não disparam">
    Verifique qual era sua intenção:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos slash correspondentes registrados no Slack
    - ou modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    O Slack não cria nem remove comandos slash automaticamente. `commands.native: "auto"` não habilita comandos nativos do Slack; use `true` e crie os comandos correspondentes no app Slack. No modo HTTP, todo comando slash do Slack deve incluir a URL do Gateway. No Socket Mode, os payloads de comandos chegam pelo websocket e o Slack ignora `slash_commands[].url`.

    Verifique também `commands.useAccessGroups`, autorização por DM, allowlists de canais
    e allowlists `users` por canal. O Slack retorna erros efêmeros para
    remetentes bloqueados de comandos slash, incluindo:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referência de visão para anexos

O Slack pode anexar mídia baixada ao turno do agente quando os downloads de arquivos do Slack são bem-sucedidos e os limites de tamanho permitem. Arquivos de imagem podem passar pelo caminho de entendimento de mídia ou diretamente para um modelo de resposta com suporte a visão; outros arquivos são mantidos como contexto de arquivo baixável, em vez de tratados como entrada de imagem.

### Tipos de mídia compatíveis

| Tipo de mídia                  | Origem               | Comportamento atual                                                               | Observações                                                               |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imagens JPEG / PNG / GIF / WebP | URL de arquivo do Slack | Baixadas e anexadas ao turno para processamento com suporte a visão              | Limite por arquivo: `channels.slack.mediaMaxMb` (padrão 20 MB)            |
| Arquivos PDF                   | URL de arquivo do Slack | Baixados e expostos como contexto de arquivo para ferramentas como `download-file` ou `pdf` | A entrada do Slack não converte PDFs em entrada de visão por imagem automaticamente |
| Outros arquivos                | URL de arquivo do Slack | Baixados quando possível e expostos como contexto de arquivo                     | Arquivos binários não são tratados como entrada de imagem                 |
| Respostas em thread            | Arquivos do início da thread | Arquivos da mensagem raiz podem ser hidratados como contexto quando a resposta não tem mídia direta | Inícios contendo apenas arquivos usam um placeholder de anexo             |
| Mensagens com várias imagens   | Vários arquivos do Slack | Cada arquivo é avaliado de forma independente                                    | O processamento do Slack é limitado a oito arquivos por mensagem          |

### Pipeline de entrada

Quando uma mensagem do Slack com anexos de arquivo chega:

1. O OpenClaw baixa o arquivo da URL privada do Slack usando o token do bot.
2. O arquivo é gravado no armazenamento de mídia em caso de sucesso.
3. Caminhos de mídia baixados e tipos de conteúdo são adicionados ao contexto de entrada.
4. Caminhos de modelo/ferramenta com suporte a imagem podem usar anexos de imagem desse contexto.
5. Arquivos que não são imagens continuam disponíveis como metadados de arquivo ou referências de mídia para ferramentas capazes de processá-los.

### Herança de anexos da raiz da thread

Quando uma mensagem chega em uma thread (tem um pai `thread_ts`):

- Se a própria resposta não tiver mídia direta e a mensagem raiz incluída tiver arquivos, o Slack pode hidratar os arquivos raiz como contexto de início da thread.
- Anexos diretos da resposta têm precedência sobre anexos da mensagem raiz.
- Uma mensagem raiz que tem apenas arquivos e nenhum texto é representada com um placeholder de anexo para que o fallback ainda possa incluir seus arquivos.

### Tratamento de vários anexos

Quando uma única mensagem do Slack contém vários anexos de arquivo:

- Cada anexo é processado de forma independente pelo pipeline de mídia.
- Referências de mídia baixadas são agregadas ao contexto da mensagem.
- A ordem de processamento segue a ordem dos arquivos do Slack no payload do evento.
- Uma falha no download de um anexo não bloqueia os outros.

### Limites de tamanho, download e modelo

- **Limite de tamanho**: padrão de 20 MB por arquivo. Configurável via `channels.slack.mediaMaxMb`.
- **Falhas de download**: arquivos que o Slack não consegue servir, URLs expiradas, arquivos inacessíveis, arquivos acima do tamanho permitido e respostas HTML de autenticação/login do Slack são ignorados em vez de relatados como formatos incompatíveis.
- **Modelo de visão**: a análise de imagem usa o modelo de resposta ativo quando ele oferece suporte a visão, ou o modelo de imagem configurado em `agents.defaults.imageModel`.

### Limites conhecidos

| Cenário                                | Comportamento atual                                                          | Solução alternativa                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de arquivo do Slack expirada       | Arquivo ignorado; nenhum erro exibido                                        | Reenvie o arquivo no Slack                                                 |
| Modelo de visão não configurado        | Anexos de imagem são armazenados como referências de mídia, mas não analisados como imagens | Configure `agents.defaults.imageModel` ou use um modelo de resposta com suporte a visão |
| Imagens muito grandes (> 20 MB por padrão) | Ignoradas pelo limite de tamanho                                            | Aumente `channels.slack.mediaMaxMb` se o Slack permitir                    |
| Anexos encaminhados/compartilhados     | Texto e mídia de imagem/arquivo hospedada no Slack são processados em melhor esforço | Compartilhe novamente diretamente na thread do OpenClaw                    |
| Anexos PDF                             | Armazenados como contexto de arquivo/mídia, não roteados automaticamente por visão de imagem | Use `download-file` para metadados de arquivo ou a ferramenta `pdf` para análise de PDF |

### Documentação relacionada

- [Pipeline de entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Ferramenta PDF](/pt-BR/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitação de visão para anexos do Slack
- Testes de regressão: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificação ao vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Slack ao gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de canais e DMs de grupo.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Layout e precedência de configuração.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Catálogo e comportamento de comandos.
  </Card>
</CardGroup>
