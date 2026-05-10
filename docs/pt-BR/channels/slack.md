---
read_when:
    - Configurando o Slack ou depurando o modo socket/HTTP do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Modo Socket + URLs de solicitação HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

Pronto para produção em DMs e canais via integrações de aplicativo Slack. O modo padrão é Socket Mode; URLs de solicitação HTTP também são suportadas.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do Slack usam o modo de emparelhamento por padrão.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento nativo de comandos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
</CardGroup>

## Escolhendo Socket Mode ou URLs de solicitação HTTP

Ambos os transportes estão prontos para produção e alcançam paridade de recursos para mensagens, comandos slash, App Home e interatividade. Escolha pelo formato de implantação, não pelos recursos.

| Preocupação                  | Socket Mode (padrão)                                                                 | URLs de solicitação HTTP                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL pública do Gateway       | Não obrigatória                                                                       | Obrigatória (DNS, TLS, proxy reverso ou túnel)                                                                 |
| Rede de saída                | WSS de saída para `wss-primary.slack.com` deve estar acessível                        | Sem WS de saída; somente HTTPS de entrada                                                                      |
| Tokens necessários           | Token de bot (`xoxb-...`) + Token de nível de aplicativo (`xapp-...`) com `connections:write` | Token de bot (`xoxb-...`) + Signing Secret                                                                     |
| Notebook de dev / atrás de firewall | Funciona como está                                                                    | Precisa de um túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou Gateway de staging                 |
| Escala horizontal            | Uma sessão Socket Mode por aplicativo por host; múltiplos Gateways precisam de aplicativos Slack separados | Handler POST sem estado; múltiplas réplicas do Gateway podem compartilhar um aplicativo atrás de um balanceador de carga |
| Múltiplas contas em um Gateway | Suportado; cada conta abre seu próprio WS                                             | Suportado; cada conta precisa de um `webhookPath` único (padrão `/slack/events`) para que os registros não colidam |
| Transporte de comandos slash | Entregue pela conexão WS; `slash_commands[].url` é ignorado                           | O Slack envia POST para `slash_commands[].url`; o campo é obrigatório para o comando ser despachado            |
| Assinatura de solicitações   | Não usada (a autenticação é o Token de nível de aplicativo)                           | O Slack assina cada solicitação; o OpenClaw verifica com `signingSecret`                                       |
| Recuperação em queda de conexão | O SDK do Slack reconecta automaticamente; o ajuste de transporte por tempo limite de pong do Gateway se aplica | Sem conexão persistente para cair; novas tentativas são por solicitação a partir do Slack                      |

<Note>
  **Escolha Socket Mode** para hosts com um único Gateway, notebooks de dev e redes locais que conseguem acessar `*.slack.com` na saída, mas não conseguem aceitar HTTPS de entrada.

**Escolha URLs de solicitação HTTP** ao executar múltiplas réplicas do Gateway atrás de um balanceador de carga, quando WSS de saída está bloqueado mas HTTPS de entrada é permitido, ou quando você já encerra webhooks do Slack em um proxy reverso.
</Note>

## Configuração rápida

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Crie um novo aplicativo Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifests abaixo → **Next** → **Create**.

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
          **Recomendado** corresponde ao conjunto completo de recursos do Plugin Slack incluído: App Home, comandos slash, arquivos, reações, pins, DMs em grupo e leituras de emojis/grupos de usuários. Escolha **Mínimo** quando a política do workspace restringir escopos — ele cobre DMs, histórico de canais/grupos, menções e comandos slash, mas remove arquivos, reações, pins, DM em grupo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulte [Checklist de manifest e escopo](#manifest-and-scope-checklist) para a justificativa por escopo e opções aditivas, como comandos slash extras.
        </Note>

        Depois que o Slack criar o aplicativo:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: adicione `connections:write`, salve, copie o valor `xapp-...`.
        - **Install App → Install to Workspace**: copie o Bot User OAuth Token `xoxb-...`.

      </Step>

      <Step title="Configure o OpenClaw">

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

        Fallback por env (somente conta padrão):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Inicie o Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URLs de solicitação HTTP">
    <Steps>
      <Step title="Crie um novo aplicativo Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifests abaixo → substitua `https://gateway-host.example.com/slack/events` pela URL pública do seu Gateway → **Next** → **Create**.

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
          **Recomendado** corresponde ao conjunto completo de recursos do plugin Slack incluído; **Mínimo** remove arquivos, reações, pins, DM em grupo (`mpim:*`), `emoji:read` e `usergroups:read` para workspaces restritivos. Consulte [Lista de verificação de manifesto e escopos](#manifest-and-scope-checklist) para a justificativa de cada escopo.
        </Note>

        <Info>
          Os três campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apontam todos para o mesmo endpoint do OpenClaw. O esquema de manifesto do Slack exige que eles sejam nomeados separadamente, mas o OpenClaw roteia por tipo de payload, então um único `webhookPath` (padrão `/slack/events`) é suficiente. Comandos slash sem `slash_commands[].url` não farão nada silenciosamente no modo HTTP.
        </Info>

        Depois que o Slack criar o app:

        - **Informações Básicas → Credenciais do App**: copie o **Signing Secret** para verificação de requisições.
        - **Instalar App → Instalar no Workspace**: copie o Token OAuth de Usuário Bot `xoxb-...`.

      </Step>

      <Step title="Configurar o OpenClaw">

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
        Use caminhos de Webhook exclusivos para HTTP com várias contas

        Dê a cada conta um `webhookPath` distinto (padrão `/slack/events`) para que os registros não entrem em conflito.
        </Note>

      </Step>

      <Step title="Iniciar o gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Ajuste do transporte Socket Mode

O OpenClaw define o tempo limite de pong do cliente Slack SDK como 15 segundos por padrão para Socket Mode. Substitua as configurações de transporte somente quando precisar de ajustes específicos para o workspace ou host:

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

Use isso somente para workspaces em Socket Mode que registram timeouts de pong/websocket ou server-ping do Slack, ou que rodam em hosts com esgotamento conhecido do loop de eventos. `clientPingTimeout` é a espera pelo pong depois que o SDK envia um ping do cliente; `serverPingTimeout` é a espera pelos pings do servidor Slack. Mensagens e eventos do app continuam sendo estado da aplicação, não sinais de vivacidade do transporte.

## Lista de verificação de manifesto e escopos

O manifesto base do app Slack é o mesmo para Socket Mode e URLs de Requisição HTTP. Somente o bloco `settings` (e a `url` do comando slash) difere.

Manifesto base (padrão de Socket Mode):

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

Para o **modo URLs de Requisição HTTP**, substitua `settings` pela variante HTTP e adicione `url` a cada comando slash. URL pública obrigatória:

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

### Configurações adicionais do manifesto

Exponha recursos diferentes que estendem os padrões acima.

O manifesto padrão habilita a aba **Início** do Slack App Home e assina `app_home_opened`. Quando um membro do workspace abre a aba Início, o OpenClaw publica uma visualização Home padrão segura com `views.publish`; nenhum payload de conversa ou configuração privada é incluído. A aba **Mensagens** permanece habilitada para DMs do Slack.

<AccordionGroup>
  <Accordion title="Comandos slash nativos opcionais">

    Vários [comandos slash nativos](#commands-and-slash-behavior) podem ser usados em vez de um único comando configurado, com nuances:

    - Use `/agentstatus` em vez de `/status` porque o comando `/status` é reservado.
    - No máximo 25 comandos slash podem ser disponibilizados de uma vez.

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
      <Tab title="URLs de Requisição HTTP">
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
    Adicione o escopo de bot `chat:write.customize` se quiser que as mensagens enviadas usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do app Slack.

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
- `botToken`, `appToken`, `signingSecret` e `userToken` aceitam strings de texto simples
  ou objetos SecretRef.
- Tokens de configuração substituem o fallback de env.
- O fallback de env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` se aplica somente à conta padrão.
- `userToken` (`xoxp-...`) existe somente na configuração (sem fallback de env) e assume como padrão o comportamento somente leitura (`userTokenReadOnly: true`).

Comportamento de snapshot de status:

- A inspeção da conta Slack acompanha campos `*Source` e `*Status`
  por credencial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por SecretRef
  ou outra fonte de segredo não inline, mas o caminho de comando/runtime atual
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; no Socket Mode, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para ações/leituras de diretório, o token de usuário pode ser preferido quando configurado. Para escritas, o token de bot continua sendo preferido; escritas com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot está indisponível.
</Tip>

## Ações e gates

As ações do Slack são controladas por `channels.slack.actions.*`.

Grupos de ação disponíveis no ferramental atual do Slack:

| Grupo      | Padrão |
| ---------- | ------- |
| messages   | habilitado |
| reactions  | habilitado |
| pins       | habilitado |
| memberInfo | habilitado |
| emojiList  | habilitado |

As ações de mensagem atuais do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` aceita IDs de arquivo do Slack mostrados em placeholders de arquivos recebidos e retorna pré-visualizações de imagem para imagens ou metadados de arquivo local para outros tipos de arquivo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.slack.dmPolicy` controla o acesso a DMs. `channels.slack.allowFrom` é a allowlist canônica de DMs.

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

    Precedência de múltiplas contas:

    - `channels.slack.accounts.default.allowFrom` se aplica somente à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` legados ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando consegue fazer isso sem alterar o acesso.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canal">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A allowlist de canais fica em `channels.slack.channels` e **deve usar IDs estáveis de canal do Slack** (por exemplo, `C12345678`) como chaves de configuração.

    Observação de runtime: se `channels.slack` estiver completamente ausente (configuração somente por env), o runtime faz fallback para `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nome/ID:

    - entradas de allowlist de canais e entradas de allowlist de DMs são resolvidas na inicialização quando o acesso por token permite
    - entradas de nome de canal não resolvidas são mantidas como configuradas, mas ignoradas para roteamento por padrão
    - autorização recebida e roteamento de canais priorizam ID por padrão; correspondência direta por nome de usuário/slug requer `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Chaves baseadas em nome (`#channel-name` ou `channel-name`) **não** correspondem em `groupPolicy: "allowlist"`. A busca de canal prioriza ID por padrão, então uma chave baseada em nome nunca será roteada com sucesso e todas as mensagens nesse canal serão bloqueadas silenciosamente. Isso difere de `groupPolicy: "open"`, em que a chave do canal não é necessária para roteamento e uma chave baseada em nome parece funcionar.

    Sempre use o ID do canal Slack como chave. Para encontrá-lo: clique com o botão direito no canal no Slack → **Copy link** — o ID (`C...`) aparece no fim da URL.

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

  <Tab title="Menções e usuários do canal">
    Mensagens de canal exigem menção por padrão.

    Fontes de menção:

    - menção explícita ao app (`<@botId>`)
    - menção a grupo de usuários do Slack (`<!subteam^S...>`) quando o usuário bot é membro desse grupo de usuários; requer `usergroups:read`
    - padrões regex de menção (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta a thread do bot (desabilitado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes somente via resolução na inicialização ou `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato de chave de `toolsBySender`: `id:`, `e164:`, `username:`, `name:` ou wildcard `"*"`
      (chaves legadas sem prefixo ainda mapeiam somente para `id:`)

    `allowBots` é conservador para canais e canais privados: mensagens de sala criadas por bot são aceitas somente quando o bot remetente está explicitamente listado na allowlist `users` dessa sala, ou quando pelo menos um ID explícito de proprietário do Slack de `channels.slack.allowFrom` é atualmente membro da sala. Wildcards e entradas de proprietário por nome de exibição não satisfazem a presença do proprietário. A presença do proprietário usa `conversations.members` do Slack; garanta que o app tenha o escopo de leitura correspondente para o tipo de sala (`channels:read` para canais públicos, `groups:read` para canais privados). Se a busca de membros falhar, o OpenClaw descarta a mensagem de sala criada por bot.

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- DMs são roteadas como `direct`; canais como `channel`; MPIMs como `group`.
- Bindings de rota do Slack aceitam IDs brutos de peers e formas de destino do Slack, como `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Com `session.dmScope=main` padrão, DMs do Slack são consolidadas na sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Respostas em thread podem criar sufixos de sessão de thread (`:thread:<threadTs>`) quando aplicável.
- Em canais nos quais o OpenClaw trata mensagens de nível superior sem exigir uma menção explícita, `replyToMode` diferente de `off` roteia cada raiz tratada para `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, para que a thread visível do Slack mapeie para uma sessão do OpenClaw desde o primeiro turno.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread começa (padrão `20`; defina `0` para desabilitar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em threads para que o bot responda somente a menções explícitas `@bot` dentro de threads, mesmo quando o bot já participou da thread. Sem isso, respostas em uma thread da qual o bot participou contornam o gate de `requireMention`.

Controles de threading de resposta:

- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para chats diretos: `channels.slack.dm.replyToMode`

Tags manuais de resposta são compatíveis:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respostas explícitas em thread do Slack pela ferramenta `message`, defina `replyBroadcast: true` com `action: "send"` e `threadId` ou `replyTo` para pedir ao Slack que também transmita a resposta da thread para o canal pai. Isso mapeia para a flag `reply_broadcast` de `chat.postMessage` do Slack e só é compatível com envios de texto ou Block Kit, não uploads de mídia.

Quando uma chamada à ferramenta `message` é executada dentro de uma thread do Slack e tem como alvo o mesmo canal, o OpenClaw normalmente herda a thread atual do Slack de acordo com `replyToMode`. Defina `topLevel: true` em `action: "send"` ou `action: "upload-file"` para forçar uma nova mensagem no canal pai. `threadId: null` é aceito como a mesma opção de nível superior.

<Note>
`replyToMode="off"` desabilita **todo** o threading de resposta no Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso difere do Telegram, onde tags explícitas ainda são respeitadas no modo `"off"`. Threads do Slack ocultam mensagens do canal, enquanto respostas do Telegram permanecem visíveis inline.
</Note>

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida.

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback de emoji da identidade do agente (`agents.list[].identity.emoji`, senão "👀")

Observações:

- O Slack espera shortcodes (por exemplo, `"eyes"`).
- Use `""` para desabilitar a reação para a conta Slack ou globalmente.

## Streaming de texto

`channels.slack.streaming` controla o comportamento de pré-visualização ao vivo:

- `off`: desabilita streaming de pré-visualização ao vivo.
- `partial` (padrão): substitui o texto de pré-visualização pela saída parcial mais recente.
- `block`: acrescenta atualizações de pré-visualização em blocos.
- `progress`: mostra texto de status de progresso durante a geração e depois envia o texto final.
- `streaming.preview.toolProgress`: quando a pré-visualização de rascunho está ativa, roteia atualizações de ferramenta/progresso para a mesma mensagem de pré-visualização editada (padrão: `true`). Defina `false` para manter mensagens separadas de ferramenta/progresso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: defina como `status` para manter linhas compactas de progresso de ferramenta enquanto oculta o texto bruto de comando/exec (padrão: `raw`).

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

`channels.slack.streaming.nativeTransport` controla o streaming nativo de texto do Slack quando `channels.slack.streaming.mode` é `partial` (padrão: `true`).

- Uma conversa encadeada de resposta deve estar disponível para que o streaming de texto nativo e o status da conversa encadeada do assistente do Slack apareçam. A seleção da conversa encadeada ainda segue `replyToMode`.
- Raízes de canais, chats em grupo e mensagens diretas de nível superior ainda podem usar a prévia de rascunho normal quando o streaming nativo está indisponível ou não existe conversa encadeada de resposta.
- Mensagens diretas de nível superior do Slack permanecem fora de conversas encadeadas por padrão, então elas não mostram a prévia nativa de stream/status no estilo de conversas encadeadas do Slack; em vez disso, o OpenClaw publica e edita uma prévia de rascunho na mensagem direta.
- Payloads de mídia e não texto recorrem à entrega normal.
- Resultados finais de mídia/erro cancelam edições de prévia pendentes; resultados finais elegíveis de texto/bloco só são enviados quando conseguem editar a prévia no próprio lugar.
- Se o streaming falhar no meio da resposta, o OpenClaw recorre à entrega normal para os payloads restantes.

Use a prévia de rascunho em vez do streaming de texto nativo do Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) é um alias legado em tempo de execução para `channels.slack.streaming.mode`.
- booleano `channels.slack.streaming` é um alias legado em tempo de execução para `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legado é um alias em tempo de execução para `channels.slack.streaming.nativeTransport`.
- Execute `openclaw doctor --fix` para reescrever a configuração persistida de streaming do Slack para as chaves canônicas.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem recebida do Slack enquanto o OpenClaw processa uma resposta, depois a remove quando a execução termina. Isso é mais útil fora de respostas em conversas encadeadas, que usam um indicador de status padrão "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera códigos curtos (por exemplo `"hourglass_flowing_sand"`).
- A reação é de melhor esforço, e a limpeza é tentada automaticamente após a conclusão do caminho de resposta ou falha.

## Mídia, divisão em partes e entrega

<AccordionGroup>
  <Accordion title="Anexos recebidos">
    Anexos de arquivo do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de requisição autenticado por token) e gravados no armazenamento de mídia quando a busca é bem-sucedida e os limites de tamanho permitem. Marcadores de posição de arquivo incluem o `fileId` do Slack para que agentes possam buscar o arquivo original com `download-file`.

    Downloads usam timeouts limitados de ociosidade e total. Se a recuperação de arquivo do Slack parar ou falhar, o OpenClaw continua processando a mensagem e recorre ao marcador de posição do arquivo.

    O limite de tamanho recebido em tempo de execução usa `20MB` por padrão, salvo se substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos enviados">
    - partes de texto usam `channels.slack.textChunkLimit` (padrão 4000)
    - `channels.slack.chunkMode="newline"` habilita divisão priorizando parágrafos
    - envios de arquivo usam APIs de upload do Slack e podem incluir respostas em conversas encadeadas (`thread_ts`)
    - o limite de mídia enviada segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, envios de canal usam padrões por tipo MIME do pipeline de mídia

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferenciais:

    - `user:<id>` para mensagens diretas
    - `channel:<id>` para canais

    Mensagens diretas do Slack somente com texto/blocos podem publicar diretamente em IDs de usuário; uploads de arquivo e envios em conversas encadeadas abrem a mensagem direta primeiro pelas APIs de conversa do Slack, porque esses caminhos exigem um ID de conversa concreto.

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

- O modo automático de comandos nativos fica **desativado** para o Slack, então `commands.native: "auto"` não habilita comandos nativos do Slack.

```txt
/help
```

Menus de argumentos nativos usam uma estratégia de renderização adaptativa que mostra um modal de confirmação antes de enviar um valor de opção selecionado:

- até 5 opções: blocos de botões
- 6-100 opções: menu de seleção estática
- mais de 100 opções: seleção externa com filtragem assíncrona de opções quando manipuladores de opções de interatividade estão disponíveis
- limites do Slack excedidos: valores de opções codificados recorrem a botões

```txt
/think
```

Sessões de comandos de barra usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda roteiam execuções de comandos para a sessão da conversa de destino usando `CommandTargetSessionKey`.

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

Quando habilitado, agentes podem emitir diretivas de resposta exclusivas do Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Essas diretivas são compiladas para Slack Block Kit e roteiam cliques ou seleções de volta pelo caminho de eventos de interação existente do Slack.

Observações:

- Esta é uma interface de usuário específica do Slack. Outros canais não traduzem diretivas do Slack Block Kit para seus próprios sistemas de botões.
- Os valores de retorno de chamada interativos são tokens opacos gerados pelo OpenClaw, não valores brutos escritos pelo agente.
- Se blocos interativos gerados excederiam os limites do Slack Block Kit, o OpenClaw recorre à resposta de texto original em vez de enviar um payload de blocos inválido.

## Aprovações de execução no Slack

O Slack pode atuar como um cliente de aprovação nativo com botões e interações interativas, em vez de recorrer à interface web ou ao terminal.

- Aprovações de execução usam `channels.slack.execApprovals.*` para roteamento nativo de mensagens diretas/canais.
- Aprovações de Plugin ainda podem ser resolvidas pela mesma superfície de botões nativa do Slack quando a solicitação já chega ao Slack e o tipo de ID de aprovação é `plugin:`.
- A autorização de aprovadores ainda é aplicada: apenas usuários identificados como aprovadores podem aprovar ou negar solicitações pelo Slack.

Isso usa a mesma superfície compartilhada de botões de aprovação de outros canais. Quando `interactivity` está habilitado nas configurações do seu app do Slack, as solicitações de aprovação são renderizadas como botões do Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a experiência principal de aprovação; o OpenClaw
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

A configuração nativa do Slack explícita só é necessária quando você quer substituir aprovadores, adicionar filtros ou
optar pela entrega na conversa de origem:

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

O encaminhamento compartilhado de `approvals.exec` é separado. Use-o apenas quando solicitações de aprovação de execução também precisam
ser roteadas para outras conversas ou destinos explícitos fora de banda. O encaminhamento compartilhado de `approvals.plugin` também é
separado; botões nativos do Slack ainda podem resolver aprovações de Plugin quando essas solicitações já chegam
ao Slack.

`/approve` na mesma conversa também funciona em canais e mensagens diretas do Slack que já dão suporte a comandos. Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals) para o modelo completo de encaminhamento de aprovação.

## Eventos e comportamento operacional

- Edições/exclusões de mensagens são mapeadas para eventos de sistema.
- Transmissões de conversas encadeadas (respostas em conversas encadeadas "Também enviar para o canal") são processadas como mensagens de usuário normais.
- Eventos de adição/remoção de reações são mapeados para eventos de sistema.
- Eventos de entrada/saída de membros, canal criado/renomeado e adição/remoção de fixação são mapeados para eventos de sistema.
- `channel_id_changed` pode migrar chaves de configuração de canal quando `configWrites` está habilitado.
- Metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- O iniciador da conversa encadeada e o preenchimento inicial de contexto do histórico da conversa encadeada são filtrados por listas de permissão de remetentes configuradas quando aplicável.
- Ações de bloco e interações modais emitem eventos de sistema estruturados `Slack interaction: ...` com campos ricos de carga útil:
  - ações de bloco: valores selecionados, rótulos, valores de seletores e metadados `workflow_*`
  - eventos modais `view_submission` e `view_closed` com metadados de canal roteados e entradas de formulário

## Referência de configuração

Referência principal: [Referência de configuração - Slack](/pt-BR/gateway/config-channels#slack).

<Accordion title="Campos do Slack mais relevantes">

- modo/autenticação: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acesso a mensagens diretas: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternância de compatibilidade: `dangerouslyAllowNameMatching` (emergencial; mantenha desativado salvo necessidade)
- acesso a canais: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- conversas encadeadas/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- pré-visualizações: `unfurlLinks`, `unfurlMedia` para controle de prévia de links/mídia de `chat.postMessage`
- operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas em canais">
    Verifique, na ordem:

    - `groupPolicy`
    - lista de permissão de canais (`channels.slack.channels`) — **as chaves devem ser IDs de canal** (`C12345678`), não nomes (`#channel-name`). Chaves baseadas em nome falham silenciosamente com `groupPolicy: "allowlist"` porque o roteamento de canais prioriza IDs por padrão. Para encontrar um ID: clique com o botão direito no canal no Slack → **Copiar link** — o valor `C...` no final da URL é o ID do canal.
    - `requireMention`
    - lista de permissão `users` por canal

    Comandos úteis:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Mensagens diretas ignoradas">
    Verifique:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (ou legado `channels.slack.dm.policy`)
    - aprovações de pareamento / entradas de lista de permissão
    - Eventos de mensagens diretas do Slack Assistant: logs detalhados que mencionam `drop message_changed`
      geralmente significam que o Slack enviou um evento editado de conversa encadeada do Assistant sem um
      remetente humano recuperável nos metadados da mensagem

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode não conecta">
    Valide os tokens de bot e de aplicativo e a habilitação do Socket Mode nas configurações do app do Slack.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o runtime atual não conseguiu resolver o valor baseado em
    SecretRef.

  </Accordion>

  <Accordion title="Modo HTTP não recebe eventos">
    Valide:

    - segredo de assinatura
    - caminho do webhook
    - URLs de solicitação do Slack (Eventos + Interatividade + Comandos slash)
    - `webhookPath` exclusivo por conta HTTP

    Se `signingSecretStatus: "configured_unavailable"` aparecer nos snapshots
    da conta, a conta HTTP está configurada, mas o runtime atual não conseguiu
    resolver o segredo de assinatura baseado em SecretRef.

  </Accordion>

  <Accordion title="Comandos nativos/slash não disparam">
    Verifique se você pretendia usar:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos slash correspondentes registrados no Slack
    - ou modo de comando slash único (`channels.slack.slashCommand.enabled: true`)

    Verifique também `commands.useAccessGroups` e as listas de permissões de canais/usuários.

  </Accordion>
</AccordionGroup>

## Referência de visão para anexos

O Slack pode anexar mídia baixada ao turno do agente quando os downloads de arquivos do Slack são bem-sucedidos e os limites de tamanho permitem. Arquivos de imagem podem passar pelo caminho de compreensão de mídia ou diretamente para um modelo de resposta com capacidade de visão; outros arquivos são mantidos como contexto de arquivo baixável, em vez de serem tratados como entrada de imagem.

### Tipos de mídia compatíveis

| Tipo de mídia                 | Origem                   | Comportamento atual                                                              | Observações                                                                    |
| ----------------------------- | ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Imagens JPEG / PNG / GIF / WebP | URL de arquivo do Slack | Baixadas e anexadas ao turno para tratamento com capacidade de visão             | Limite por arquivo: `channels.slack.mediaMaxMb` (padrão 20 MB)                 |
| Arquivos PDF                  | URL de arquivo do Slack  | Baixados e expostos como contexto de arquivo para ferramentas como `download-file` ou `pdf` | A entrada do Slack não converte PDFs automaticamente em entrada de visão de imagem |
| Outros arquivos               | URL de arquivo do Slack  | Baixados quando possível e expostos como contexto de arquivo                     | Arquivos binários não são tratados como entrada de imagem                      |
| Respostas em thread           | Arquivos do início da thread | Arquivos da mensagem raiz podem ser hidratados como contexto quando a resposta não tem mídia direta | Inícios apenas com arquivo usam um placeholder de anexo                         |
| Mensagens com várias imagens  | Vários arquivos do Slack | Cada arquivo é avaliado independentemente                                       | O processamento do Slack é limitado a oito arquivos por mensagem              |

### Pipeline de entrada

Quando uma mensagem do Slack com anexos de arquivo chega:

1. O OpenClaw baixa o arquivo da URL privada do Slack usando o token do bot (`xoxb-...`).
2. O arquivo é gravado no armazenamento de mídia em caso de sucesso.
3. Caminhos de mídia baixada e tipos de conteúdo são adicionados ao contexto de entrada.
4. Caminhos de modelo/ferramenta com capacidade de imagem podem usar anexos de imagem desse contexto.
5. Arquivos que não são imagem permanecem disponíveis como metadados de arquivo ou referências de mídia para ferramentas que conseguem lidar com eles.

### Herança de anexos da raiz da thread

Quando uma mensagem chega em uma thread (tem um pai `thread_ts`):

- Se a própria resposta não tiver mídia direta e a mensagem raiz incluída tiver arquivos, o Slack pode hidratar os arquivos raiz como contexto de início da thread.
- Anexos diretos da resposta têm precedência sobre anexos da mensagem raiz.
- Uma mensagem raiz que tem apenas arquivos e nenhum texto é representada com um placeholder de anexo para que o fallback ainda possa incluir seus arquivos.

### Tratamento de vários anexos

Quando uma única mensagem do Slack contém vários anexos de arquivo:

- Cada anexo é processado independentemente pelo pipeline de mídia.
- Referências de mídia baixada são agregadas ao contexto da mensagem.
- A ordem de processamento segue a ordem dos arquivos do Slack no payload do evento.
- Uma falha no download de um anexo não bloqueia os outros.

### Limites de tamanho, download e modelo

- **Limite de tamanho**: padrão de 20 MB por arquivo. Configurável via `channels.slack.mediaMaxMb`.
- **Falhas de download**: arquivos que o Slack não consegue servir, URLs expiradas, arquivos inacessíveis, arquivos grandes demais e respostas HTML de autenticação/login do Slack são ignorados em vez de serem relatados como formatos não compatíveis.
- **Modelo de visão**: a análise de imagem usa o modelo de resposta ativo quando ele oferece suporte a visão, ou o modelo de imagem configurado em `agents.defaults.imageModel`.

### Limites conhecidos

| Cenário                                | Comportamento atual                                                           | Solução alternativa                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL de arquivo do Slack expirada       | Arquivo ignorado; nenhum erro exibido                                         | Reenvie o arquivo no Slack                                                    |
| Modelo de visão não configurado        | Anexos de imagem são armazenados como referências de mídia, mas não analisados como imagens | Configure `agents.defaults.imageModel` ou use um modelo de resposta com capacidade de visão |
| Imagens muito grandes (> 20 MB por padrão) | Ignoradas pelo limite de tamanho                                           | Aumente `channels.slack.mediaMaxMb` se o Slack permitir                       |
| Anexos encaminhados/compartilhados     | Texto e mídia de imagem/arquivo hospedados no Slack são tratados em melhor esforço | Compartilhe novamente diretamente na thread do OpenClaw                       |
| Anexos PDF                             | Armazenados como contexto de arquivo/mídia, não roteados automaticamente pela visão de imagem | Use `download-file` para metadados de arquivo ou a ferramenta `pdf` para análise de PDF |

### Documentação relacionada

- [Pipeline de compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Ferramenta PDF](/pt-BR/tools/pdf)
- Épico: [#51349](https://github.com/openclaw/openclaw/issues/51349) — habilitação de visão para anexos do Slack
- Testes de regressão: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verificação ao vivo: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Relacionado

<CardGroup cols={2}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Pareie um usuário do Slack com o Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de canais e DMs de grupo.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Roteie mensagens de entrada para agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaça e reforço de segurança.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Layout e precedência da configuração.
  </Card>
  <Card title="Comandos slash" icon="terminal" href="/pt-BR/tools/slash-commands">
    Catálogo e comportamento dos comandos.
  </Card>
</CardGroup>
