---
read_when:
    - Configurando o Slack ou depurando o modo socket/HTTP do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Modo Socket + URLs de Requisição HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

Pronto para produção para DMs e canais por meio de integrações de apps do Slack. O modo padrão é o Modo Socket; URLs de requisição HTTP também são compatíveis.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    DMs do Slack usam o modo de pareamento por padrão.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
</CardGroup>

## Escolhendo Modo Socket ou URLs de requisição HTTP

Ambos os transportes estão prontos para produção e alcançam paridade de recursos para mensagens, comandos de barra, App Home e interatividade. Escolha pelo formato de implantação, não pelos recursos.

| Aspecto                      | Modo Socket (padrão)                                                                 | URLs de requisição HTTP                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL pública do Gateway       | Não obrigatória                                                                      | Obrigatória (DNS, TLS, proxy reverso ou túnel)                                                                 |
| Rede de saída                | WSS de saída para `wss-primary.slack.com` deve estar acessível                       | Sem WS de saída; apenas HTTPS de entrada                                                                       |
| Tokens necessários           | Token do bot (`xoxb-...`) + Token em nível de app (`xapp-...`) com `connections:write` | Token do bot (`xoxb-...`) + segredo de assinatura                                                              |
| Laptop de dev / atrás de firewall | Funciona como está                                                              | Precisa de um túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou Gateway de staging                 |
| Escalonamento horizontal     | Uma sessão de Modo Socket por app por host; múltiplos Gateways precisam de apps Slack separados | Handler POST sem estado; várias réplicas do Gateway podem compartilhar um app atrás de um balanceador de carga |
| Múltiplas contas em um Gateway | Compatível; cada conta abre seu próprio WS                                         | Compatível; cada conta precisa de um `webhookPath` único (padrão `/slack/events`) para que os registros não colidam |
| Transporte de comando de barra | Entregue pela conexão WS; `slash_commands[].url` é ignorado                        | O Slack envia POSTs para `slash_commands[].url`; o campo é obrigatório para o comando ser despachado           |
| Assinatura de requisições    | Não usada (a autenticação é o Token em nível de app)                                 | O Slack assina cada requisição; o OpenClaw verifica com `signingSecret`                                        |
| Recuperação em queda de conexão | O SDK do Slack reconecta automaticamente; o ajuste de transporte por timeout de pong do Gateway se aplica | Sem conexão persistente para cair; novas tentativas são por requisição a partir do Slack                       |

<Note>
  **Escolha Modo Socket** para hosts com um único Gateway, laptops de dev e redes on-prem que conseguem acessar `*.slack.com` via saída, mas não conseguem aceitar HTTPS de entrada.

**Escolha URLs de requisição HTTP** ao executar várias réplicas do Gateway atrás de um balanceador de carga, quando WSS de saída estiver bloqueado mas HTTPS de entrada for permitido, ou quando você já encerra Webhooks do Slack em um proxy reverso.
</Note>

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
          **Recommended** corresponde ao conjunto completo de recursos do Plugin Slack incluído: App Home, comandos de barra, arquivos, reações, pins, DMs em grupo e leituras de emojis/grupos de usuários. Escolha **Minimal** quando a política do workspace restringir escopos — ele cobre DMs, histórico de canais/grupos, menções e comandos de barra, mas remove arquivos, reações, pins, DMs em grupo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulte [Lista de verificação de manifesto e escopos](#manifest-and-scope-checklist) para ver a justificativa por escopo e opções aditivas, como comandos de barra extras.
        </Note>

        Depois que o Slack criar o app:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: adicione `connections:write`, salve, copie o valor `xapp-...`.
        - **Install App → Install to Workspace**: copie o Token OAuth de usuário do bot `xoxb-...`.

      </Step>

      <Step title="Configure OpenClaw">

        Configuração SecretRef recomendada:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
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

        Fallback por env (apenas conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
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
          **Recomendado** corresponde ao conjunto completo de recursos do Plugin Slack incluído; **Mínimo** remove arquivos, reações, pins, DMs de grupo (`mpim:*`), `emoji:read` e `usergroups:read` para workspaces restritivos. Consulte a [lista de verificação de manifesto e escopos](#manifest-and-scope-checklist) para a justificativa por escopo.
        </Note>

        <Info>
          Os três campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apontam todos para o mesmo endpoint do OpenClaw. O esquema de manifesto do Slack exige nomes separados para eles, mas o OpenClaw roteia pelo tipo de payload, então um único `webhookPath` (padrão `/slack/events`) é suficiente. Comandos de barra sem `slash_commands[].url` serão ignorados silenciosamente no modo HTTP.
        </Info>

        Depois que o Slack criar o aplicativo:

        - **Basic Information → App Credentials**: copie o **Signing Secret** para verificação de requisições.
        - **Install App → Install to Workspace**: copie o Token OAuth de usuário bot `xoxb-...`.

      </Step>

      <Step title="Configure OpenClaw">

        Configuração SecretRef recomendada:

```bash
export SLACK_BOT_TOKEN=xoxb-...
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
        Use caminhos de Webhook exclusivos para HTTP multi-conta

        Dê a cada conta um `webhookPath` distinto (padrão `/slack/events`) para que os registros não colidam.
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

O OpenClaw define o tempo limite de pong do cliente SDK do Slack como 15 segundos por padrão para o Socket Mode. Sobrescreva as configurações de transporte somente quando precisar de ajustes específicos para o workspace ou host:

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

Use isso somente para workspaces em Socket Mode que registrem tempos limite de pong/websocket ou server-ping do Slack, ou que sejam executados em hosts com starvation conhecida do loop de eventos. `clientPingTimeout` é a espera pelo pong depois que o SDK envia um ping de cliente; `serverPingTimeout` é a espera por pings do servidor Slack. Mensagens e eventos do aplicativo continuam sendo estado da aplicação, não sinais de atividade do transporte.

## Lista de verificação de manifesto e escopos

O manifesto base do aplicativo Slack é o mesmo para Socket Mode e URLs de requisição HTTP. Apenas o bloco `settings` (e o `url` do comando de barra) difere.

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

Para o **modo URLs de requisição HTTP**, substitua `settings` pela variante HTTP e adicione `url` a cada comando de barra. URL pública obrigatória:

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

### Configurações adicionais de manifesto

Exponha diferentes recursos que estendem os padrões acima.

O manifesto padrão habilita a aba **Home** do Slack App Home e assina `app_home_opened`. Quando um membro do workspace abre a aba Home, o OpenClaw publica uma visualização Home padrão segura com `views.publish`; nenhum payload de conversa nem configuração privada é incluído. A aba **Messages** permanece habilitada para DMs do Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Vários [comandos de barra nativos](#commands-and-slash-behavior) podem ser usados em vez de um único comando configurado, com alguns detalhes:

    - Use `/agentstatus` em vez de `/status`, porque o comando `/status` é reservado.
    - No máximo 25 comandos de barra podem ficar disponíveis de uma vez.

    Substitua sua seção `features.slash_commands` existente por um subconjunto de [comandos disponíveis](/pt-BR/tools/slash-commands#command-list):

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
  <Accordion title="Escopos opcionais de autoria (operações de escrita)">
    Adicione o escopo de bot `chat:write.customize` se quiser que mensagens de saída usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do app Slack.

    Se você usar um ícone de emoji, o Slack espera a sintaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Escopos opcionais de token de usuário (operações de leitura)">
    Se você configurar `channels.slack.userToken`, os escopos típicos de leitura são:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depende de leituras da busca do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de token

- `botToken` + `appToken` são obrigatórios para Socket Mode.
- O modo HTTP requer `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings de texto simples
  ou objetos SecretRef.
- Tokens de configuração substituem o fallback de env.
- O fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica apenas à conta padrão.
- `userToken` (`xoxp-...`) é somente por configuração (sem fallback de env) e assume como padrão o comportamento somente leitura (`userTokenReadOnly: true`).

Comportamento do snapshot de status:

- A inspeção da conta do Slack rastreia campos `*Source` e `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por SecretRef
  ou outra fonte de segredo não inline, mas o caminho atual de comando/runtime
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; em Socket Mode, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para leituras de ações/diretório, o token de usuário pode ser preferido quando configurado. Para escritas, o token de bot continua preferido; escritas com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot está indisponível.
</Tip>

## Ações e gates

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ações disponíveis nas ferramentas atuais do Slack:

| Grupo      | Padrão |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

As ações atuais de mensagem do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` aceita IDs de arquivo do Slack exibidos nos placeholders de arquivos recebidos e retorna prévias de imagem para imagens ou metadados de arquivo local para outros tipos de arquivo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso por DM. `channels.slack.allowFrom` é a allowlist canônica de DM.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `channels.slack.allowFrom` inclua `"*"`)
    - `disabled`

    Flags de DM:

    - `dm.enabled` (padrão true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (DMs em grupo têm padrão false)
    - `dm.groupChannels` (allowlist opcional de MPIM)

    Precedência em múltiplas contas:

    - `channels.slack.accounts.default.allowFrom` se aplica apenas à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    Os legados `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` ainda são lidos por compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

    O emparelhamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e **deve usar IDs estáveis de canal do Slack** (por exemplo `C12345678`) como chaves de configuração.

    Observação de runtime: se `channels.slack` estiver completamente ausente (configuração somente por env), o runtime faz fallback para `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas da allowlist de canais e entradas da allowlist de DM são resolvidas na inicialização quando o acesso por token permite
    - entradas de nome de canal não resolvidas são mantidas conforme configuradas, mas ignoradas para roteamento por padrão
    - autorização de entrada e roteamento de canal são ID-first por padrão; correspondência direta por nome de usuário/slug requer `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Chaves baseadas em nome (`#channel-name` ou `channel-name`) **não** correspondem em `groupPolicy: "allowlist"`. A busca de canal é ID-first por padrão, então uma chave baseada em nome nunca roteará com sucesso e todas as mensagens nesse canal serão bloqueadas silenciosamente. Isso difere de `groupPolicy: "open"`, em que a chave do canal não é necessária para roteamento e uma chave baseada em nome parece funcionar.

    Sempre use o ID do canal do Slack como chave. Para encontrá-lo: clique com o botão direito no canal no Slack → **Copiar link** — o ID (`C...`) aparece no fim da URL.

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
    - padrões de regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta a thread do bot (desabilitado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes apenas via resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato da chave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` ou curinga `"*"`
      (chaves legadas sem prefixo ainda mapeiam apenas para `id:`)

    `allowBots` é conservador para canais e canais privados: mensagens de sala criadas por bots são aceitas apenas quando o bot remetente está listado explicitamente na allowlist `users` dessa sala, ou quando pelo menos um ID explícito de proprietário do Slack em `channels.slack.allowFrom` é atualmente membro da sala. Curingas e entradas de proprietário por nome de exibição não satisfazem presença de proprietário. A presença de proprietário usa `conversations.members` do Slack; garanta que o app tenha o escopo de leitura correspondente para o tipo de sala (`channels:read` para canais públicos, `groups:read` para canais privados). Se a busca de membros falhar, o OpenClaw descarta a mensagem de sala criada por bot.

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- DMs roteiam como `direct`; canais como `channel`; MPIMs como `group`.
- Vinculações de rota do Slack aceitam IDs brutos de pares mais formas de destino do Slack como `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Com o padrão `session.dmScope=main`, DMs do Slack são colapsadas para a sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desabilitar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em threads para que o bot responda apenas a menções explícitas `@bot` dentro de threads, mesmo quando o bot já participou da thread. Sem isso, respostas em uma thread da qual o bot participou ignoram o gate de `requireMention`.

Controles de threading de resposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para conversas diretas: `channels.slack.dm.replyToMode`

Tags manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` desabilita **todo** threading de resposta no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, em que tags explícitas ainda são respeitadas no modo `"off"`. Threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram continuam visíveis inline.
</Note>

## Reações de ack

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback de emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

Observações:

- O Slack espera shortcodes (por exemplo `"eyes"`).
- Use `""` para desabilitar a reação para a conta Slack ou globalmente.

## Streaming de texto

`channels.slack.streaming` controla o comportamento de prévia ao vivo:

- `off`: desabilita streaming de prévia ao vivo.
- `partial` (padrão): substitui o texto da prévia pela saída parcial mais recente.
- `block`: anexa atualizações de prévia em chunks.
- `progress`: mostra texto de status de progresso enquanto gera e depois envia o texto final.
- `streaming.preview.toolProgress`: quando a prévia de rascunho está ativa, roteia atualizações de ferramenta/progresso para a mesma mensagem de prévia editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: defina como `status` para manter linhas compactas de progresso de ferramenta enquanto oculta texto bruto de comando/exec (padrão: `raw`).

Oculte texto bruto de comando/exec mantendo linhas compactas de progresso:

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

- Uma thread de resposta deve estar disponível para que streaming de texto nativo e status de thread do assistente do Slack apareçam. A seleção de thread ainda segue `replyToMode`.
- Raízes de canal, conversa em grupo e DM de nível superior ainda podem usar a prévia normal de rascunho quando o streaming nativo está indisponível ou não existe thread de resposta.
- DMs do Slack de nível superior ficam fora de thread por padrão, então não mostram a prévia de stream/status nativa em estilo de thread do Slack; o OpenClaw publica e edita uma prévia de rascunho na DM.
- Payloads de mídia e não texto fazem fallback para entrega normal.
- Finais de mídia/erro cancelam edições de prévia pendentes; finais de texto/bloco elegíveis são descarregados somente quando conseguem editar a prévia no lugar.
- Se o streaming falhar no meio da resposta, o OpenClaw faz fallback para entrega normal dos payloads restantes.

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

Chaves legadas:

- `channels.slack.streamMode` (`replace | status_final | append`) é um alias de runtime legado para `channels.slack.streaming.mode`.
- booleano `channels.slack.streaming` é um alias de runtime legado para `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legado é um alias de runtime para `channels.slack.streaming.nativeTransport`.
- Execute `openclaw doctor --fix` para reescrever a configuração persistida de streaming do Slack para as chaves canônicas.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem recebida no Slack enquanto o OpenClaw processa uma resposta e a remove quando a execução termina. Isso é mais útil fora de respostas em threads, que usam um indicador de status padrão "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera shortcodes (por exemplo, `"hourglass_flowing_sand"`).
- A reação é de melhor esforço, e a limpeza é tentada automaticamente depois que o caminho de resposta ou falha é concluído.

## Mídia, divisão em partes e entrega

<AccordionGroup>
  <Accordion title="Anexos de entrada">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de solicitação autenticado por token) e gravados no armazenamento de mídia quando a busca tem sucesso e os limites de tamanho permitem. Os placeholders de arquivo incluem o `fileId` do Slack para que agentes possam buscar o arquivo original com `download-file`.

    Os downloads usam tempos limite delimitados de inatividade e total. Se a recuperação de arquivo do Slack travar ou falhar, o OpenClaw continua processando a mensagem e recorre ao placeholder de arquivo.

    O limite de tamanho de entrada em runtime é `20MB` por padrão, a menos que seja substituído por `channels.slack.mediaMaxMb`.

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

    DMs do Slack somente com texto/blocos podem publicar diretamente em IDs de usuário; uploads de arquivo e envios em thread abrem a DM primeiro via APIs de conversa do Slack, porque esses caminhos exigem um ID concreto de conversa.

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

Comandos nativos exigem [configurações adicionais de manifesto](#additional-manifest-settings) no seu app do Slack e são habilitados com `channels.slack.commands.native: true` ou `commands.native: true` em configurações globais.

- O modo automático de comandos nativos fica **desativado** para Slack, então `commands.native: "auto"` não habilita comandos nativos do Slack.

```txt
/help
```

Menus de argumentos nativos usam uma estratégia de renderização adaptativa que mostra um modal de confirmação antes de despachar um valor de opção selecionado:

- até 5 opções: blocos de botão
- 6-100 opções: menu de seleção estático
- mais de 100 opções: seleção externa com filtragem assíncrona de opções quando handlers de opções de interatividade estão disponíveis
- limites do Slack excedidos: valores de opção codificados recorrem a botões

```txt
/think
```

Sessões de barra usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda roteiam execuções de comando para a sessão da conversa de destino usando `CommandTargetSessionKey`.

## Respostas interativas

O Slack pode renderizar controles de resposta interativa criados por agentes, mas esse recurso é desativado por padrão.

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

Ou habilite para apenas uma conta do Slack:

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

Quando habilitado, agentes podem emitir diretivas de resposta exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas para Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho existente de eventos de interação do Slack.

Observações:

- Esta é uma UI específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de callback interativo são tokens opacos gerados pelo OpenClaw, não valores brutos criados pelo agente.
- Se os blocos interativos gerados excederem os limites do Slack Block Kit, o OpenClaw recorre à resposta de texto original em vez de enviar um payload de blocos inválido.

## Aprovações de execução no Slack

O Slack pode atuar como um cliente de aprovação nativo com botões e interações interativas, em vez de recorrer à UI Web ou ao terminal.

- Aprovações de execução usam `channels.slack.execApprovals.*` para roteamento nativo de DM/canal.
- Aprovações de Plugin ainda podem ser resolvidas pela mesma superfície de botões nativa do Slack quando a solicitação já chega ao Slack e o tipo do ID de aprovação é `plugin:`.
- A autorização do aprovador ainda é aplicada: somente usuários identificados como aprovadores podem aprovar ou negar solicitações pelo Slack.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitado nas configurações do seu app do Slack, prompts de aprovação são renderizados como botões do Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX principal de aprovação; o OpenClaw
só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser que aprovações
por chat estão indisponíveis ou que a aprovação manual é o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente aprovações de execução nativas quando `enabled` está indefinido ou é `"auto"` e pelo menos um
aprovador é resolvido. Defina `enabled: false` para desabilitar explicitamente o Slack como cliente de aprovação nativo.
Defina `enabled: true` para forçar aprovações nativas quando aprovadores forem resolvidos.

Comportamento padrão sem configuração explícita de aprovação de execução do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Configuração explícita nativa do Slack só é necessária quando você quer substituir aprovadores, adicionar filtros ou
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

O encaminhamento compartilhado de `approvals.exec` é separado. Use-o somente quando prompts de aprovação de execução também precisarem
ser roteados para outros chats ou destinos explícitos fora de banda. O encaminhamento compartilhado de `approvals.plugin` também é
separado; botões nativos do Slack ainda podem resolver aprovações de Plugin quando essas solicitações já chegam
ao Slack.

`/approve` no mesmo chat também funciona em canais e DMs do Slack que já têm suporte a comandos. Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals) para o modelo completo de encaminhamento de aprovações.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens são mapeadas para eventos de sistema.
- Transmissões de thread ("Also send to channel" em respostas de thread) são processadas como mensagens normais de usuário.
- Eventos de adicionar/remover reação são mapeados para eventos de sistema.
- Eventos de entrada/saída de membro, canal criado/renomeado e adicionar/remover fixação são mapeados para eventos de sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/propósito do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O iniciador da thread e a semeadura inicial de contexto de histórico da thread são filtrados por allowlists de remetente configuradas quando aplicável.
- Ações de bloco e interações modais emitem eventos de sistema estruturados `Slack interaction: ...` com campos de payload ricos:
  - ações de bloco: valores selecionados, rótulos, valores de seletores e metadados `workflow_*`
  - eventos modais `view_submission` e `view_closed` com metadados de canal roteado e entradas de formulário

## Referência de configuração

Referência principal: [Referência de configuração - Slack](/pt-BR/gateway/config-channels#slack).

<Accordion title="Campos de alto sinal do Slack">

- modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acesso a DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternância de compatibilidade: `dangerouslyAllowNameMatching` (break-glass; mantenha desativado a menos que necessário)
- acesso a canal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, na ordem:

    - `groupPolicy`
    - allowlist de canais (`channels.slack.channels`) — **as chaves devem ser IDs de canal** (`C12345678`), não nomes (`#channel-name`). Chaves baseadas em nome falham silenciosamente sob `groupPolicy: "allowlist"` porque o roteamento de canal prioriza IDs por padrão. Para encontrar um ID: clique com o botão direito no canal no Slack → **Copy link** — o valor `C...` no fim da URL é o ID do canal.
    - `requireMention`
    - allowlist `users` por canal

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
    - aprovações de pareamento / entradas de allowlist
    - eventos de DM do Slack Assistant: logs detalhados mencionando `drop message_changed`
      geralmente significam que o Slack enviou um evento editado de thread do Assistant sem um
      remetente humano recuperável nos metadados da mensagem

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode não conecta">
    Valide tokens de bot + app e a habilitação do Socket Mode nas configurações do app do Slack.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o runtime atual não conseguiu resolver o valor apoiado por SecretRef.

  </Accordion>

  <Accordion title="Modo HTTP não recebe eventos">
    Valide:

    - signing secret
    - caminho do Webhook
    - URLs de solicitação do Slack (Eventos + Interatividade + Comandos de barra)
    - `webhookPath` exclusivo por conta HTTP

    Se `signingSecretStatus: "configured_unavailable"` aparecer em snapshots de conta,
    a conta HTTP está configurada, mas o runtime atual não conseguiu
    resolver o signing secret apoiado por SecretRef.

  </Accordion>

  <Accordion title="Comandos nativos/de barra não disparam">
    Verifique se você pretendia usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos de barra correspondentes registrados no Slack
    - ou modo de comando de barra único (`channels.slack.slashCommand.enabled: true`)

    Verifique também `commands.useAccessGroups` e allowlists de canal/usuário.

  </Accordion>
</AccordionGroup>

## Referência de visão de anexos

Slack pode anexar mídia baixada à rodada do agente quando os downloads de arquivos do Slack são bem-sucedidos e os limites de tamanho permitem. Arquivos de imagem podem passar pelo caminho de compreensão de mídia ou diretamente para um modelo de resposta compatível com visão; outros arquivos são mantidos como contexto de arquivo baixável, em vez de serem tratados como entrada de imagem.

### Tipos de mídia compatíveis

| Tipo de mídia                 | Origem               | Comportamento atual                                                              | Observações                                                               |
| ----------------------------- | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Imagens JPEG / PNG / GIF / WebP | URL de arquivo do Slack | Baixadas e anexadas à rodada para processamento compatível com visão             | Limite por arquivo: `channels.slack.mediaMaxMb` (padrão 20 MB)            |
| Arquivos PDF                  | URL de arquivo do Slack | Baixados e expostos como contexto de arquivo para ferramentas como `download-file` ou `pdf` | A entrada do Slack não converte PDFs automaticamente em entrada de visão por imagem |
| Outros arquivos               | URL de arquivo do Slack | Baixados quando possível e expostos como contexto de arquivo                     | Arquivos binários não são tratados como entrada de imagem                 |
| Respostas de thread           | Arquivos da mensagem inicial da thread | Arquivos da mensagem raiz podem ser hidratados como contexto quando a resposta não tem mídia direta | Mensagens iniciais somente com arquivo usam um placeholder de anexo       |
| Mensagens com várias imagens  | Vários arquivos do Slack | Cada arquivo é avaliado de forma independente                                    | O processamento do Slack é limitado a oito arquivos por mensagem          |

### Pipeline de entrada

Quando uma mensagem do Slack com anexos de arquivo chega:

1. OpenClaw baixa o arquivo da URL privada do Slack usando o token do bot (`xoxb-...`).
2. O arquivo é gravado no armazenamento de mídia em caso de sucesso.
3. Caminhos de mídia baixada e tipos de conteúdo são adicionados ao contexto de entrada.
4. Caminhos de modelo/ferramenta compatíveis com imagem podem usar anexos de imagem desse contexto.
5. Arquivos que não são imagens permanecem disponíveis como metadados de arquivo ou referências de mídia para ferramentas que podem processá-los.

### Herança de anexos da raiz da thread

Quando uma mensagem chega em uma thread (tem um pai `thread_ts`):

- Se a própria resposta não tiver mídia direta e a mensagem raiz incluída tiver arquivos, o Slack poderá hidratar os arquivos da raiz como contexto da mensagem inicial da thread.
- Anexos diretos da resposta têm precedência sobre anexos da mensagem raiz.
- Uma mensagem raiz que tem apenas arquivos e nenhum texto é representada com um placeholder de anexo para que o fallback ainda possa incluir seus arquivos.

### Processamento de múltiplos anexos

Quando uma única mensagem do Slack contém vários anexos de arquivo:

- Cada anexo é processado de forma independente pelo pipeline de mídia.
- Referências de mídia baixada são agregadas ao contexto da mensagem.
- A ordem de processamento segue a ordem dos arquivos do Slack no payload do evento.
- Uma falha no download de um anexo não bloqueia os outros.

### Limites de tamanho, download e modelo

- **Limite de tamanho**: padrão de 20 MB por arquivo. Configurável por `channels.slack.mediaMaxMb`.
- **Falhas de download**: arquivos que o Slack não consegue servir, URLs expiradas, arquivos inacessíveis, arquivos grandes demais e respostas HTML de autenticação/login do Slack são ignorados em vez de serem relatados como formatos não compatíveis.
- **Modelo de visão**: a análise de imagem usa o modelo de resposta ativo quando ele oferece suporte a visão, ou o modelo de imagem configurado em `agents.defaults.imageModel`.

### Limites conhecidos

| Cenário                                | Comportamento atual                                                           | Solução alternativa                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL de arquivo do Slack expirada       | Arquivo ignorado; nenhum erro é mostrado                                      | Reenvie o arquivo no Slack                                                 |
| Modelo de visão não configurado        | Anexos de imagem são armazenados como referências de mídia, mas não analisados como imagens | Configure `agents.defaults.imageModel` ou use um modelo de resposta compatível com visão |
| Imagens muito grandes (> 20 MB por padrão) | Ignoradas pelo limite de tamanho                                           | Aumente `channels.slack.mediaMaxMb` se o Slack permitir                    |
| Anexos encaminhados/compartilhados     | Texto e mídia de imagem/arquivo hospedada no Slack são tratados em modo best-effort | Recompartilhe diretamente na thread do OpenClaw                            |
| Anexos PDF                             | Armazenados como contexto de arquivo/mídia, não roteados automaticamente pela visão de imagem | Use `download-file` para metadados de arquivo ou a ferramenta `pdf` para análise de PDF |

### Documentação relacionada

- [Pipeline de compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Ferramenta PDF](/pt-BR/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitação de visão para anexos do Slack
- Testes de regressão: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificação ao vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Slack ao Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/pt-BR/channels/groups">
    Comportamento de canais e DMs de grupo.
  </Card>
  <Card title="Channel routing" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Security" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e hardening.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pt-BR/gateway/configuration">
    Layout e precedência da configuração.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/pt-BR/tools/slash-commands">
    Catálogo e comportamento de comandos.
  </Card>
</CardGroup>
