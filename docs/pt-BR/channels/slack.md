---
read_when:
    - Configuração do Slack ou depuração dos modos de socket, HTTP ou relay do Slack
summary: Configuração do Slack e comportamento em tempo de execução (Socket Mode, URLs de solicitação HTTP e modo de retransmissão)
title: Slack
x-i18n:
    generated_at: "2026-07-12T14:59:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
    source_path: channels/slack.md
    workflow: 16
---

O suporte ao Slack abrange mensagens diretas e canais por meio de integrações de aplicativos do Slack. O transporte padrão é o Socket Mode; URLs de solicitação HTTP também são compatíveis. O modo de retransmissão destina-se a implantações gerenciadas nas quais um roteador confiável controla a entrada do Slack.

<CardGroup cols={3}>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As mensagens diretas do Slack usam o modo de pareamento por padrão.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Comportamento dos comandos nativos e catálogo de comandos.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e procedimentos de reparo.
  </Card>
</CardGroup>

## Escolha de um transporte

O Socket Mode e as URLs de solicitação HTTP oferecem os mesmos recursos para mensagens, comandos de barra, App Home e interatividade. Escolha com base na arquitetura da implantação, não nos recursos.

| Aspecto                      | Socket Mode (padrão)                                                                                                                                | URLs de solicitação HTTP                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL pública do Gateway           | Não obrigatória                                                                                                                                         | Obrigatória (DNS, TLS, proxy reverso ou túnel)                                                                   |
| Rede de saída             | O WSS de saída para `wss-primary.slack.com` deve estar acessível                                                                                            | Sem WS de saída; somente HTTPS de entrada                                                                             |
| Tokens necessários                | Token do bot + App-Level Token com `connections:write`                                                                                                 | Token do bot + Signing Secret                                                                                     |
| Notebook de desenvolvimento/atrás de firewall | Funciona sem alterações                                                                                                                                          | Requer um túnel público (ngrok, Cloudflare Tunnel, Tailscale Funnel) ou um Gateway de homologação                          |
| Escalabilidade horizontal           | Uma sessão do Socket Mode por aplicativo em cada host; vários Gateways exigem aplicativos do Slack separados                                                                 | Manipulador POST sem estado; várias réplicas do Gateway podem compartilhar um aplicativo atrás de um balanceador de carga                     |
| Várias contas em um Gateway | Compatível; cada conta abre seu próprio WS                                                                                                             | Compatível; cada conta precisa de um `webhookPath` exclusivo (padrão `/slack/events`) para evitar conflitos entre os registros |
| Transporte de comandos de barra      | Entregues pela conexão WS; `slash_commands[].url` é ignorado                                                                                  | O Slack envia solicitações POST para `slash_commands[].url`; o campo é obrigatório para o comando ser encaminhado                           |
| Assinatura de solicitações              | Não utilizada (a autenticação usa o App-Level Token)                                                                                                               | O Slack assina cada solicitação; o OpenClaw verifica usando `signingSecret`                                              |
| Recuperação após queda da conexão  | A reconexão automática do SDK do Slack está ativada; o OpenClaw também reinicia sessões do Socket Mode com falha usando espera progressiva limitada. Aplicam-se os ajustes de transporte para tempo limite de pong. | Não há conexão persistente sujeita a queda; as novas tentativas são feitas pelo Slack para cada solicitação                                           |

<Note>
  **Escolha o Socket Mode** para hosts com um único Gateway, notebooks de desenvolvimento e redes locais que possam acessar `*.slack.com` externamente, mas não possam aceitar HTTPS de entrada.

**Escolha URLs de solicitação HTTP** ao executar várias réplicas do Gateway atrás de um balanceador de carga, quando o WSS de saída estiver bloqueado, mas o HTTPS de entrada for permitido, ou quando você já encaminhar Webhooks do Slack por meio de um proxy reverso.
</Note>

<Warning>
  O Slack pode manter várias conexões do Socket Mode para um aplicativo e entregar cada carga útil a qualquer uma dessas conexões. Portanto, Gateways do OpenClaw separados que compartilham um aplicativo do Slack precisam ter configurações equivalentes de roteamento e autorização. Caso contrário, use um aplicativo do Slack separado para cada Gateway, uma única entrada de retransmissão ou URLs de solicitação HTTP atrás de um balanceador de carga. Consulte [Como usar o Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Modo de retransmissão

O modo de retransmissão separa a entrada do Slack do Gateway do OpenClaw. Um roteador confiável controla a única conexão do Socket Mode com o Slack, escolhe um Gateway de destino e encaminha um evento tipado por um websocket autenticado. O Gateway ainda usa seu próprio token de bot para chamadas de saída à API Web do Slack.

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

A URL de retransmissão deve usar `wss://`, a menos que aponte para localhost. Trate o token de portador e a tabela de rotas do roteador como parte do limite de autorização do Slack: os eventos roteados entram no manipulador normal de mensagens do Slack como ativações autorizadas. Um `slack_identity` fornecido pelo roteador no quadro `hello` do websocket pode definir o nome de usuário e o ícone de saída padrão; uma identidade explícita fornecida pelo chamador ainda tem prioridade. A conexão de retransmissão é restabelecida com o mesmo intervalo de espera progressiva limitada do Socket Mode e limpa a identidade fornecida pelo roteador sempre que é desconectada.

### Instalações para toda a organização no Enterprise Grid

Uma conta do Slack pode receber mensagens de todos os espaços de trabalho abrangidos por uma
instalação para toda a organização do Enterprise Grid. Escolha o Socket Mode direto ou URLs de
solicitação HTTP; o modo de retransmissão não é compatível com contas corporativas. Ambos os
manifestos de privilégio mínimo abaixo habilitam somente o caminho de eventos V1 `message` e
`app_mention`, respostas imediatas e reações de status controladas pelo listener.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Peça a um Enterprise Grid Org Admin ou Org Owner para aprovar o aplicativo, instalá-lo no
nível da organização e escolher os espaços de trabalho abrangidos pela instalação.
Confirme se o aplicativo está disponível em todos os espaços de trabalho pretendidos antes de iniciar
o OpenClaw. Gere um token no nível do aplicativo com `connections:write` para o Socket Mode
e copie o token do bot da instalação da organização. Configure a conta que
usa o token do bot instalado na organização:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### URLs de solicitação HTTP

Use o modo HTTP quando o Gateway tiver um endpoint HTTPS público e não abrir uma
conexão do Socket Mode. Substitua a URL de exemplo pela URL pública de
`webhookPath` do Gateway (padrão `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Peça a um Enterprise Grid Org Admin ou Org Owner para aprovar o aplicativo, instalá-lo no
nível da organização e escolher os espaços de trabalho abrangidos pela instalação.
Depois que o Slack verificar a Request URL, copie o token do bot da instalação da organização e
o **Basic Information -> App Credentials -> Signing Secret** do aplicativo. Configure
a conta corporativa com o mesmo caminho da Request URL:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Na inicialização, o OpenClaw verifica `enterpriseOrgInstall` usando `auth.test` do Slack.
Um token instalado na organização sem o sinalizador, ou um token de espaço de trabalho com o sinalizador,
faz com que a inicialização falhe. O Slack continua sendo a fonte da verdade sobre quais espaços de trabalho
concederam a instalação; em seguida, o OpenClaw aplica as políticas configuradas de canal, usuário,
mensagem direta e menção a cada evento entregue. O Enterprise V1 rejeita todos os eventos
`message` e `app_mention` criados por bots antes do encaminhamento, independentemente de
`allowBots`, porque as instalações da organização não fornecem uma identidade de bot estável
qualificada pelo espaço de trabalho para impedir loops.

O suporte corporativo é intencionalmente limitado a eventos diretos `message` e
`app_mention` do Socket Mode ou HTTP e às suas respostas imediatas. O modo de retransmissão,
os comandos de barra, as interações, o App Home, os listeners de eventos de reação, os itens fixados, as
ferramentas de ação do Slack, as aprovações nativas do Slack, as associações, a entrega enfileirada ou agendada
e os envios proativos não estão disponíveis para uma conta corporativa. As reações de
confirmação, digitação e status de saída são compatíveis por meio do cliente Slack
controlado pelo listener e exigem `reactions:write`; as notificações de reação
de entrada e as ferramentas de ação de reação continuam indisponíveis.

As respostas imediatas reutilizam o comportamento padrão de entrega do Slack para blocos,
mídia, metadados, identidade alternativa, expansões de links e confirmações, mas somente enquanto o
cliente validado controlado pelo listener permanecer no turno ativo do evento. A
fila de envio em memória e os registros de participação em conversas são particionados pelo
espaço de trabalho desse evento; o próprio cliente nunca é serializado nem persistido.

As chaves de política de canal e as entradas de `dm.groupChannels` devem usar IDs de canal estáveis brutos do Slack ou o
formato `channel:<id>`. O OpenClaw normaliza qualquer um dos formatos para o ID bruto do canal para
correspondência em tempo de execução; os prefixos `slack:`, `group:` e `mpim:` impedem a inicialização.
As entradas de política de usuário devem usar IDs de usuário estáveis do Slack; nomes, slugs, nomes de exibição
e endereços de e-mail impedem a inicialização. Os IDs devem usar o prefixo e o corpo canônicos em maiúsculas
do Slack (por exemplo, `C0123456789` ou `U0123456789`); versões em minúsculas e
imitações mais curtas impedem a inicialização. Contas Enterprise não podem habilitar
`dangerouslyAllowNameMatching`. Contas Enterprise podem definir o
`mentionPatterns.mode` global, mas `mentionPatterns.allowIn` e
`mentionPatterns.denyIn` impedem a inicialização porque IDs de canal brutos do Slack não são
qualificados pelo workspace e podem ser reutilizados entre workspaces. Instalações em workspace
mantêm o comportamento existente de padrões de menção com escopo. Cada workspace aceito
recebe identidades separadas de roteamento, sessão, transcrição, desduplicação, histórico e cache,
mesmo quando os IDs do Slack se sobrepõem. No fluxo `message`, mensagens comuns de usuários
e eventos `file_share` criados por usuários são compatíveis; outros subtipos de mensagem são
rejeitados antes da autorização ou do tratamento de eventos do sistema.

As DMs Enterprise devem estar desabilitadas (`dm.enabled=false` ou
`dmPolicy="disabled"`) ou explicitamente abertas com `dmPolicy="open"` e
um `allowFrom` efetivo da conta contendo o literal `"*"`. Uma lista de permissões vazia
ou IDs específicos de usuários sem `"*"` impedem a inicialização. O pareamento e
as listas de permissões de DM por usuário são rejeitados porque os IDs de usuário do Slack não são
qualificados pelo workspace nesses armazenamentos de autorização. A política de canal e remetente
continua sendo aplicada às mensagens de canal.

## Instalação

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registra e habilita o plugin. Ele não faz nada até que você configure o aplicativo Slack e as definições de canal abaixo. Consulte [Plugins](/pt-BR/tools/plugin) para conhecer as regras gerais de instalação de plugins.

## Configuração rápida

Os manifestos desta seção criam uma instalação com escopo de workspace. Para uma
instalação em toda a organização do Enterprise Grid, use o
[manifesto e fluxo de trabalho para toda a organização](#enterprise-grid-org-wide-installs) dedicado.

<Tabs>
  <Tab title="Socket Mode (padrão)">
    <Steps>
      <Step title="Criar um novo aplicativo Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifestos abaixo → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "O OpenClaw conecta threads do assistente do Slack a agentes do OpenClaw.",
      "suggested_prompts": [
        { "title": "O que você pode fazer?", "message": "Com o que você pode me ajudar?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma a atividade recente neste canal."
        },
        { "title": "Elaborar uma resposta", "message": "Ajude-me a elaborar uma resposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar uma mensagem ao OpenClaw",
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
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "O OpenClaw conecta threads do assistente do Slack a agentes do OpenClaw.",
      "suggested_prompts": [
        { "title": "O que você pode fazer?", "message": "Com o que você pode me ajudar?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma a atividade recente neste canal."
        },
        { "title": "Elaborar uma resposta", "message": "Ajude-me a elaborar uma resposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar uma mensagem ao OpenClaw",
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
          **Recommended** corresponde ao conjunto completo de recursos do plugin Slack: App Home, comandos de barra, arquivos, reações, itens fixados, DMs em grupo e leituras de emojis/grupos de usuários. Escolha **Minimal** quando a política do workspace restringir escopos — ele abrange DMs, histórico de canais/grupos, menções e comandos de barra, mas remove arquivos, reações, itens fixados, DMs em grupo (`mpim:*`), `emoji:read` e `usergroups:read`. Consulte a [Lista de verificação de manifesto e escopos](#manifest-and-scope-checklist) para ver a justificativa de cada escopo e opções adicionais, como comandos de barra extras.
        </Note>

        Depois que o Slack criar o aplicativo:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: adicione `connections:write`, salve e copie o App-Level Token.
        - **Install App -> Install to Workspace**: copie o Bot User OAuth Token.

      </Step>

      <Step title="Configurar o OpenClaw">

        Configuração recomendada de SecretRef:

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

        Alternativa por variáveis de ambiente (somente conta padrão):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URLs de solicitação HTTP">
    <Steps>
      <Step title="Criar um novo aplicativo Slack">
        Abra [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → selecione seu workspace → cole um dos manifestos abaixo → substitua `https://gateway-host.example.com/slack/events` pela URL pública do Gateway → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "O OpenClaw conecta threads do assistente do Slack a agentes do OpenClaw.",
      "suggested_prompts": [
        { "title": "O que você pode fazer?", "message": "Com o que você pode me ajudar?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma a atividade recente neste canal."
        },
        { "title": "Elaborar uma resposta", "message": "Ajude-me a elaborar uma resposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar uma mensagem ao OpenClaw",
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
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "O OpenClaw conecta threads do assistente do Slack a agentes do OpenClaw.",
      "suggested_prompts": [
        { "title": "O que você pode fazer?", "message": "Com o que você pode me ajudar?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma a atividade recente neste canal."
        },
        { "title": "Redigir uma resposta", "message": "Ajude-me a redigir uma resposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar uma mensagem ao OpenClaw",
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
          **Recomendado** corresponde ao conjunto completo de recursos do plugin do Slack; **Mínimo** remove arquivos, reações, itens fixados, DMs em grupo (`mpim:*`), `emoji:read` e `usergroups:read` para espaços de trabalho restritivos. Consulte [Checklist de manifesto e escopos](#manifest-and-scope-checklist) para ver a justificativa de cada escopo.
        </Note>

        <Info>
          Os três campos de URL (`slash_commands[].url`, `event_subscriptions.request_url` e `interactivity.request_url` / `message_menu_options_url`) apontam para o mesmo endpoint do OpenClaw. O esquema de manifesto do Slack exige que eles sejam nomeados separadamente, mas o OpenClaw faz o roteamento por tipo de payload, portanto um único `webhookPath` (padrão `/slack/events`) é suficiente. Comandos de barra sem `slash_commands[].url` não fazem nada silenciosamente no modo HTTP.
        </Info>

        Depois que o Slack criar o aplicativo:

        - **Basic Information → App Credentials**: copie o **Signing Secret** para a verificação de solicitações.
        - **Install App -> Install to Workspace**: copie o Bot User OAuth Token.

      </Step>

      <Step title="Configurar o OpenClaw">

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

        Atribua a cada conta um `webhookPath` distinto (padrão `/slack/events`) para evitar conflitos entre os registros.
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

## Ajuste do transporte do Socket Mode

Por padrão, o OpenClaw define o tempo limite de pong do cliente do SDK do Slack como 15 segundos para o Socket Mode. Substitua as configurações de transporte somente quando precisar de ajustes específicos do espaço de trabalho ou do host:

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

Use isso somente em espaços de trabalho no Socket Mode que registrem tempos limite de pong/server-ping do websocket do Slack ou sejam executados em hosts com inanição conhecida do loop de eventos. `clientPingTimeout` é o tempo de espera pelo pong depois que o SDK envia um ping do cliente; `serverPingTimeout` é o tempo de espera pelos pings do servidor do Slack. Mensagens e eventos do aplicativo continuam sendo estado da aplicação, não sinais de atividade do transporte.

Observações:

- `socketMode` é ignorado no modo HTTP Request URL.
- As configurações básicas de `channels.slack.socketMode` se aplicam a todas as contas do Slack, salvo quando substituídas. As substituições por conta usam `channels.slack.accounts.<accountId>.socketMode`; como essa é uma substituição de objeto, inclua todos os campos de ajuste de socket desejados para essa conta.
- Somente `clientPingTimeout` tem um valor padrão do OpenClaw (`15000`). `serverPingTimeout` e `pingPongLoggingEnabled` são repassados ao SDK do Slack somente quando configurados.
- O recuo de reinicialização do Socket Mode começa em cerca de 2 segundos e tem um limite de aproximadamente 30 segundos. Falhas recuperáveis de inicialização, espera pela inicialização e desconexão são repetidas até que o canal seja interrompido. Erros permanentes de conta e credenciais, como autenticação inválida, tokens revogados ou escopos ausentes, falham imediatamente em vez de tentar novamente para sempre.

## Checklist de manifesto e escopos

O manifesto básico do aplicativo Slack é o mesmo para o Socket Mode e para HTTP Request URLs. Apenas o bloco `settings` (e a `url` do comando de barra) é diferente.

Manifesto básico (Socket Mode por padrão):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Conector do Slack para o OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "O OpenClaw conecta threads do assistente do Slack a agentes do OpenClaw.",
      "suggested_prompts": [
        { "title": "O que você pode fazer?", "message": "Com o que você pode me ajudar?" },
        {
          "title": "Resumir este canal",
          "message": "Resuma a atividade recente neste canal."
        },
        { "title": "Redigir uma resposta", "message": "Ajude-me a redigir uma resposta." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar uma mensagem ao OpenClaw",
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

Para o **modo HTTP Request URLs**, substitua `settings` pela variante HTTP e adicione `url` a cada comando de barra. URL pública obrigatória:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Enviar uma mensagem ao OpenClaw",
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

Disponibilize diferentes recursos que ampliem os padrões acima.

O manifesto padrão habilita a guia **Home** do Slack App Home e assina o evento `app_home_opened`. Quando um membro do espaço de trabalho abre a guia Home, o OpenClaw publica uma visualização inicial padrão segura com `views.publish`; nenhum payload de conversa ou configuração privada é incluído. Quando o modo de comando de barra único está habilitado, a dica do comando usa `channels.slack.slashCommand.name`; instalações que usam comandos nativos ou nenhum comando de barra omitem essa dica. A guia **Messages** permanece habilitada para DMs do Slack. O manifesto também habilita threads do assistente do Slack com `features.assistant_view`, `assistant:write`, `assistant_thread_started` e `assistant_thread_context_changed`; as threads do assistente são encaminhadas para suas próprias sessões de thread do OpenClaw e mantêm o contexto da thread fornecido pelo Slack disponível para o agente.

<AccordionGroup>
  <Accordion title="Comandos de barra nativos opcionais">

    Vários [comandos de barra nativos](#commands-and-slash-behavior) podem ser usados no lugar de um único comando configurado, com algumas ressalvas:

    - Use `/agentstatus` em vez de `/status`, pois o comando `/status` é reservado.
    - Não é possível registrar mais de 25 comandos de barra em um aplicativo Slack ao mesmo tempo (limite da plataforma Slack).

    Substitua a seção `features.slash_commands` existente por um subconjunto dos [comandos disponíveis](/pt-BR/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (padrão)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Iniciar uma nova sessão",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Redefinir a sessão atual"
    },
    {
      "command": "/compact",
      "description": "Compactar o contexto da sessão",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Interromper a execução atual"
    },
    {
      "command": "/session",
      "description": "Gerenciar a expiração da vinculação à thread",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Definir o nível de raciocínio",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Alternar a saída detalhada",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Exibir ou definir o modo rápido",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Alternar a visibilidade do raciocínio",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Alternar o modo elevado",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Exibir ou definir os padrões de execução",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Aprovar ou negar solicitações de aprovação pendentes",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Exibir ou definir o modelo",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Listar provedores/modelos",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Exibir o resumo breve da ajuda"
    },
    {
      "command": "/commands",
      "description": "Exibir o catálogo de comandos gerado"
    },
    {
      "command": "/tools",
      "description": "Exibir o que o agente atual pode usar neste momento",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Exibir o status do runtime, incluindo o uso/a cota do provedor quando disponível"
    },
    {
      "command": "/tasks",
      "description": "Listar tarefas em segundo plano ativas/recentes da sessão atual"
    },
    {
      "command": "/context",
      "description": "Explicar como o contexto é montado",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Exibir sua identidade de remetente"
    },
    {
      "command": "/skill",
      "description": "Executar uma skill pelo nome",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Fazer uma pergunta paralela sem alterar o contexto da sessão",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Fazer uma pergunta paralela sem alterar o contexto da sessão",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Controlar o rodapé de uso ou exibir o resumo de custos",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URLs de requisição HTTP">
        Use a mesma lista `slash_commands` do Socket Mode acima e adicione `"url": "https://gateway-host.example.com/slack/events"` a cada entrada. Exemplo:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Iniciar uma nova sessão",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Exibir o resumo breve da ajuda",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Repita esse valor de `url` em todos os comandos da lista.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Escopos opcionais de autoria (operações de gravação)">
    Adicione o escopo de bot `chat:write.customize` se quiser que as mensagens de saída usem a identidade do agente ativo (nome de usuário e ícone personalizados) em vez da identidade padrão do aplicativo Slack.

    Se você usar um ícone de emoji, o Slack espera a sintaxe `:emoji_name:`.

  </Accordion>
  <Accordion title="Escopos opcionais do token de usuário (operações de leitura)">
    Se você configurar `channels.slack.userToken`, os escopos de leitura típicos serão:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se você depender de leituras da pesquisa do Slack)

  </Accordion>
</AccordionGroup>

## Modelo de tokens

- `botToken` + `appToken` são obrigatórios para o Socket Mode.
- O modo HTTP requer `botToken` + `signingSecret`.
- O modo de retransmissão requer `botToken`, além de `relay.url`, `relay.authToken` e `relay.gatewayId`; ele não usa um token de aplicativo nem um segredo de assinatura.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` e `userToken` aceitam strings de texto simples
  ou objetos SecretRef.
- Os tokens da configuração substituem o fallback de variáveis de ambiente.
- O fallback das variáveis de ambiente `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` e `SLACK_USER_TOKEN` aplica-se, em cada caso, somente à conta padrão.
- `userToken` adota por padrão o comportamento somente leitura (`userTokenReadOnly: true`).

Comportamento do snapshot de status:

- A inspeção de contas do Slack rastreia campos `*Source` e `*Status` por credencial
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- O status é `available`, `configured_unavailable` ou `missing`.
- `configured_unavailable` significa que a conta está configurada por meio de SecretRef
  ou de outra fonte de segredo não incorporada, mas o caminho atual do comando/runtime
  não conseguiu resolver o valor real.
- No modo HTTP, `signingSecretStatus` é incluído; no Socket Mode, o
  par obrigatório é `botTokenStatus` + `appTokenStatus`.

<Tip>
Para ações/leituras de diretório, o token de usuário pode ser priorizado quando estiver configurado. Para gravações, o token de bot continua sendo priorizado; gravações com token de usuário só são permitidas quando `userTokenReadOnly: false` e o token de bot está indisponível.
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

As ações atuais de mensagens do Slack incluem `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` e `emoji-list`. `download-file` aceita IDs de arquivos do Slack exibidos nos placeholders de arquivos recebidos e retorna pré-visualizações para imagens ou metadados de arquivos locais para outros tipos de arquivo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de MD">
    `channels.slack.dmPolicy` controla o acesso por MD. `channels.slack.allowFrom` é a lista de permissões canônica para MDs.

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `channels.slack.allowFrom` inclua `"*"`)
    - `disabled`

    Sinalizadores de MD:

    - `dm.enabled` (padrão: true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legado)
    - `dm.groupEnabled` (MDs em grupo desabilitadas por padrão)
    - `dm.groupChannels` (lista de permissões MPIM opcional)

    Precedência de múltiplas contas:

    - `channels.slack.accounts.default.allowFrom` aplica-se somente à conta `default`.
    - Contas nomeadas herdam `channels.slack.allowFrom` quando seu próprio `allowFrom` não está definido.
    - Contas nomeadas não herdam `channels.slack.accounts.default.allowFrom`.

    Os campos legados `channels.slack.dm.policy` e `channels.slack.dm.allowFrom` ainda são lidos para compatibilidade. `openclaw doctor --fix` os migra para `dmPolicy` e `allowFrom` quando isso pode ser feito sem alterar o acesso.

    O pareamento em DMs usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Política de canais">
    `channels.slack.groupPolicy` controla o tratamento de canais:

    - `open`
    - `allowlist`
    - `disabled`

    A lista de permissões de canais fica em `channels.slack.channels` e **deve usar IDs estáveis de canais do Slack** (por exemplo, `C12345678`) como chaves de configuração.

    Observação de runtime: se `channels.slack` estiver completamente ausente (configuração somente por variáveis de ambiente), o runtime usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Resolução de nomes/IDs:

    - as entradas da lista de permissões de canais e da lista de permissões de DMs são resolvidas na inicialização quando o acesso pelo token permite
    - entradas de nomes de canais não resolvidas são mantidas conforme configuradas, mas, por padrão, são ignoradas no roteamento
    - por padrão, a autorização de entrada e o roteamento de canais priorizam IDs; a correspondência direta por nome de usuário/slug exige `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Chaves baseadas em nome (`#channel-name` ou `channel-name`) **não** correspondem quando `groupPolicy: "allowlist"`. Por padrão, a consulta de canais prioriza IDs; portanto, uma chave baseada em nome nunca será roteada com sucesso, e todas as mensagens nesse canal serão bloqueadas silenciosamente. Isso difere de `groupPolicy: "open"`, em que a chave do canal não é necessária para o roteamento e uma chave baseada em nome parece funcionar.

    Sempre use o ID do canal do Slack como chave. Para encontrá-lo: clique com o botão direito no canal no Slack → **Copy link** — o ID (`C...`) aparece no final da URL.

    Correto:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Incorreto (bloqueado silenciosamente quando `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Menções e usuários do canal">
    Por padrão, as mensagens de canais exigem menção.

    Fontes de menção:

    - menção explícita ao aplicativo (`<@botId>`)
    - menção a grupo de usuários do Slack (`<!subteam^S...>`) quando o usuário bot é membro desse grupo de usuários; exige `usergroups:read`
    - padrões de expressão regular para menções (`agents.list[].groupChat.mentionPatterns`, com fallback para `messages.groupChat.mentionPatterns`)
    - comportamento implícito de resposta ao bot em threads (desativado quando `thread.requireExplicitMention` é `true`)

    Controles por canal (`channels.slack.channels.<id>`; nomes somente por resolução na inicialização ou por `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; substitui o modo de resposta da conta/tipo de chat para este canal)
    - `users` (lista de permissões)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato das chaves de `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` ou curinga `"*"`
      (chaves legadas sem prefixo ainda são mapeadas somente para `id:`)

    `ignoreOtherMentions` (padrão: `false`) descarta mensagens de canais que mencionam outro usuário ou grupo de usuários, mas não este bot. DMs e DMs em grupo (MPIMs) não são afetadas. O filtro exige um ID de usuário do bot resolvido por `auth.test`; se essa identidade não estiver disponível (por exemplo, uma identidade somente com token de usuário), a verificação falha de forma aberta e as mensagens passam sem alterações.

    `allowBots` é conservador para canais e canais privados: mensagens de sala criadas por bots são aceitas somente quando o bot remetente está explicitamente listado na lista de permissões `users` dessa sala ou quando pelo menos um ID explícito de proprietário do Slack em `channels.slack.allowFrom` é atualmente membro da sala. Curingas e entradas de proprietário por nome de exibição não atendem ao requisito de presença do proprietário. A presença do proprietário usa `conversations.members` do Slack; verifique se o aplicativo tem o escopo de leitura correspondente ao tipo de sala (`channels:read` para canais públicos, `groups:read` para canais privados). Se a consulta de membros falhar, o OpenClaw descarta a mensagem de sala criada pelo bot.

    Mensagens do Slack aceitas e criadas por bots usam a [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection). Configure `channels.defaults.botLoopProtection` para o limite padrão e, quando um workspace ou canal precisar de um limite diferente, substitua-o com `channels.slack.botLoopProtection` ou `channels.slack.channels.<id>.botLoopProtection`.

  </Tab>
</Tabs>

## Threads, sessões e tags de resposta

- As DMs são roteadas como `direct`; os canais, como `channel`; e as MPIMs, como `group`.
- As associações de rota do Slack aceitam IDs brutos de pares, além de formatos de destino do Slack como `channel:C12345678`, `user:U12345678` e `<@U12345678>`.
- Com o padrão `session.dmScope=main`, as DMs do Slack são consolidadas na sessão principal do agente.
- Sessões de canal: `agent:<agentId>:slack:channel:<channelId>`.
- Mensagens comuns no nível superior do canal permanecem na sessão específica do canal, mesmo quando `replyToMode` não é `off`.
- As respostas em threads do Slack usam o `thread_ts` pai do Slack nos sufixos de sessão (`:thread:<threadTs>`), mesmo quando a criação de threads para respostas de saída está desativada com `replyToMode="off"`.
- O OpenClaw inicializa uma raiz de canal de nível superior elegível em `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` quando se espera que essa raiz inicie uma thread visível no Slack, para que a raiz e as respostas posteriores na thread compartilhem uma única sessão do OpenClaw. Isso se aplica a eventos `app_mention`, correspondências explícitas com o bot ou com padrões de menção configurados e canais com `requireMention: false` e `replyToMode` diferente de `off`.
- O padrão de `channels.slack.thread.historyScope` é `thread`; o padrão de `thread.inheritParent` é `false`.
- `channels.slack.thread.initialHistoryLimit` controla quantas mensagens existentes da thread são buscadas quando uma nova sessão de thread é iniciada (padrão `20`; defina como `0` para desativar).
- `channels.slack.thread.requireExplicitMention` (padrão `false`): quando `true`, suprime menções implícitas em threads, para que o bot responda somente a menções explícitas a `@bot` dentro das threads, mesmo que já tenha participado delas. Sem isso, as respostas em uma thread da qual o bot participou ignoram a restrição de `requireMention`.

Controles de criação de threads para respostas:

- `channels.slack.channels.<id>.replyToMode`: substituição por canal para mensagens de canais públicos/privados do Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (padrão `off`)
- `channels.slack.replyToModeByChatType`: por `direct|group|channel`
- fallback legado para conversas diretas: `channels.slack.dm.replyToMode`

Há suporte a tags manuais de resposta:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Para respostas explícitas em threads do Slack enviadas pela ferramenta `message`, defina `replyBroadcast: true` com `action: "send"` e `threadId` ou `replyTo` para solicitar que o Slack também transmita a resposta da thread no canal pai. Isso corresponde ao sinalizador `reply_broadcast` de `chat.postMessage` do Slack e só é compatível com envios de texto ou Block Kit, não com uploads de mídia.

Quando uma chamada da ferramenta `message` é executada dentro de uma thread do Slack e tem como destino o mesmo canal, o OpenClaw normalmente herda a thread atual do Slack de acordo com o `replyToMode` efetivo da conta, do tipo de conversa ou do canal. Respostas automáticas e chamadas `send` ou `upload-file` para o mesmo canal usam a mesma substituição por canal. Defina `topLevel: true` em `action: "send"` ou `action: "upload-file"` para forçar uma nova mensagem no canal pai. `threadId: null` é aceito como a mesma opção de não usar thread no nível superior.

<Note>
`replyToMode="off"` desativa a criação de threads para respostas de saída do Slack, incluindo tags explícitas `[[reply_to_*]]`. Isso não unifica as sessões de threads recebidas do Slack: mensagens já publicadas dentro de uma thread do Slack continuam sendo roteadas para a sessão `:thread:<threadTs>`. Isso é diferente do Telegram, no qual as tags explícitas continuam sendo respeitadas no modo `"off"`. As threads do Slack ocultam as mensagens do canal, enquanto as respostas do Telegram permanecem visíveis em linha.
</Note>

## Reações de confirmação

`ackReaction` envia um emoji de confirmação enquanto o OpenClaw processa uma mensagem recebida. `ackReactionScope` determina _quando_ esse emoji é realmente enviado.

Por padrão, a confirmação permanece estática enquanto o status nativo da thread do assistente do Slack mostra o progresso com mensagens de carregamento alternadas. Defina `messages.statusReactions.enabled: true` para habilitar o ciclo de vida de reações de fila/raciocínio/ferramenta/conclusão/erro.

### Emoji (`ackReaction`)

Ordem de resolução:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback para o emoji da identidade do agente (`agents.list[].identity.emoji`; caso contrário, `"eyes"` / 👀)

Observações:

- O Slack espera códigos curtos (por exemplo, `"eyes"`).
- Use `""` para desativar a reação na conta do Slack ou globalmente.

### Escopo (`messages.ackReactionScope`)

O provedor do Slack lê o escopo de `messages.ackReactionScope` (padrão `"group-mentions"`). Atualmente, não há substituição no nível da conta nem do canal do Slack; o valor é global para o Gateway.

Valores:

- `"all"`: reage em DMs e grupos, incluindo eventos ambientes de salas.
- `"direct"`: reage apenas em DMs.
- `"group-all"`: reage a todas as mensagens de grupo, exceto eventos ambientes de salas (sem DMs).
- `"group-mentions"` (padrão): reage em grupos, mas somente quando o bot é mencionado (ou em grupos com recursos de menção que habilitaram essa opção). **As DMs são excluídas.**
- `"off"` / `"none"`: nunca reage.

<Note>
O escopo padrão (`"group-mentions"`) não aciona reações de confirmação em mensagens diretas nem em eventos ambientes de salas. Para ver a `ackReaction` configurada (por exemplo, `"eyes"`) em DMs recebidas do Slack e eventos silenciosos de salas, defina `messages.ackReactionScope` como `"all"`. `messages.ackReactionScope` é lido na inicialização do provedor do Slack, portanto é necessário reiniciar o Gateway para que a alteração entre em vigor.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // reage em DMs e grupos
  },
}
```

## Streaming de texto

`channels.slack.streaming` controla o comportamento da visualização ao vivo:

- `off`: desativa o streaming da visualização ao vivo.
- `partial` (padrão): substitui o texto da visualização pela saída parcial mais recente.
- `block`: acrescenta atualizações da visualização em blocos.
- `progress`: mostra o texto de status do progresso durante a geração e depois envia o texto final.
- `streaming.preview.toolProgress`: quando a visualização de rascunho está ativa, direciona as atualizações de ferramentas/progresso para a mesma mensagem de visualização editada (padrão: `true`). Defina como `false` para manter mensagens separadas de ferramentas/progresso.
- `streaming.preview.commandText` / `streaming.progress.commandText`: defina como `status` para manter linhas compactas de progresso das ferramentas e ocultar o texto bruto de comandos/execução (padrão: `raw`).

Oculte o texto bruto de comandos/execução, mantendo linhas compactas de progresso:

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

Os cartões de tarefas de progresso nativos do Slack são opcionais no modo de progresso. Defina `channels.slack.streaming.progress.nativeTaskCards` como `true` com `channels.slack.streaming.mode="progress"` para enviar um cartão nativo do Slack de plano/tarefa enquanto o trabalho está em execução e, ao concluir, atualizar o mesmo cartão de tarefa. Sem esse sinalizador, o modo de progresso mantém o comportamento portátil de visualização de rascunho.

- Uma thread de resposta precisa estar disponível para que o streaming de texto nativo e o status da thread do assistente do Slack apareçam. A seleção da thread continua seguindo `replyToMode`.
- Canais, conversas em grupo e raízes de DMs no nível superior ainda podem usar a visualização normal de rascunho quando o streaming nativo não está disponível ou não existe uma thread de resposta.
- Por padrão, as DMs de nível superior do Slack permanecem fora de threads e, portanto, não mostram a visualização nativa de streaming/status no estilo de thread do Slack; em vez disso, o OpenClaw publica e edita uma visualização de rascunho na DM.
- Mídias e cargas úteis que não sejam texto usam como fallback a entrega normal.
- Resultados finais de mídia/erro cancelam edições pendentes da visualização; resultados finais elegíveis de texto/blocos só são concluídos quando podem editar a visualização no mesmo local.
- Se o streaming falhar durante a resposta, o OpenClaw usa como fallback a entrega normal para as cargas úteis restantes.

Use a visualização de rascunho em vez do streaming de texto nativo do Slack:

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

Habilite os cartões de tarefas de progresso nativos do Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) é um alias legado de `channels.slack.streaming.mode`.
- O valor booleano `channels.slack.streaming` é um alias legado de `channels.slack.streaming.mode` e `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` e `channels.slack.nativeStreaming` no nível superior são aliases legados de `channels.slack.streaming.chunkMode` e `channels.slack.streaming.nativeTransport`.
- Os aliases legados não são lidos em tempo de execução; execute `openclaw doctor --fix` para reescrever a configuração persistida de streaming do Slack com as chaves canônicas.

## Fallback de reação de digitação

`typingReaction` adiciona uma reação temporária à mensagem recebida do Slack enquanto o OpenClaw processa uma resposta e a remove quando a execução termina. Isso é mais útil fora de respostas em threads, que usam um indicador de status padrão "está digitando...".

Ordem de resolução:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Observações:

- O Slack espera códigos curtos (por exemplo, `"hourglass_flowing_sand"`).
- A reação funciona em regime de melhor esforço, e a limpeza é tentada automaticamente depois que o caminho de resposta ou falha é concluído.

## Entrada de voz

Atualmente, para falar com o OpenClaw no Slack, envie um clipe de áudio do Slack para o aplicativo OpenClaw. O microfone de ditado do Slackbot é um recurso separado pertencente ao Slack, não uma API de aplicativo.

- O **[ditado por voz do Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** funciona dentro da conversa privada do usuário com o Slackbot. O Slack transforma a gravação em um prompt do Slackbot, mas não emite arquivo de áudio, evento de ditado, prompt nem marcador da origem da entrada para aplicativos de terceiros do Slack por meio da Events API. O Plugin do Slack para OpenClaw não pode habilitá-lo nem recebê-lo.
- Os **[clipes de áudio do Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** são arquivos armazenados no Slack que podem ser publicados em uma DM, um canal ou uma thread do OpenClaw. O OpenClaw baixa um clipe acessível usando o token do bot, normaliza os metadados MIME do clipe do Slack e o envia pelo [pipeline compartilhado de transcrição de áudio](/pt-BR/nodes/audio). O manifesto recomendado do aplicativo inclui o escopo obrigatório `files:read`.

Os clipes de áudio e o ditado do Slackbot têm semânticas de privacidade diferentes: os clipes seguem a política de retenção de arquivos do Slack, e o OpenClaw os baixa para transcrição, enquanto o Slack informa que o áudio de ditado não é armazenado.

Em um canal com `requireMention: true`, um clipe de áudio sem legenda pode atender à restrição ao pronunciar um padrão de menção configurado (`agents.list[].groupChat.mentionPatterns`, usando `messages.groupChat.mentionPatterns` como fallback). O OpenClaw autoriza o remetente antes de baixar ou transcrever o clipe e só o admite quando a transcrição corresponde ao padrão. Uma transcrição especulativa com falha ou sem correspondência é descartada junto com o clipe baixado; ela não é mantida no histórico do canal. A identidade nativa `@bot` do Slack não pode ser inferida pela fala; portanto, configure um padrão de nome falado ou inclua uma menção digitada. Se a repetição da transcrição estiver habilitada, ela só será enviada após a admissão.

## Mídia, divisão em blocos e entrega

<AccordionGroup>
  <Accordion title="Anexos recebidos">
    Os anexos de arquivos do Slack são baixados de URLs privadas hospedadas pelo Slack (fluxo de solicitação autenticado por token) e gravados no armazenamento de mídia quando a busca é bem-sucedida e os limites de tamanho permitem. Os placeholders de arquivo incluem o `fileId` do Slack para que os agentes possam buscar o arquivo original com `download-file`.

    Os downloads usam tempos limite restritos de inatividade e duração total. Se a recuperação do arquivo do Slack travar ou falhar, o OpenClaw continua processando a mensagem e usa o placeholder do arquivo como fallback.

    O limite de tamanho de entrada em tempo de execução é `20MB` por padrão, a menos que seja substituído por `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Texto e arquivos de saída">
    - os blocos de texto usam `channels.slack.textChunkLimit` (padrão `8000`, limitado ao próprio limite de comprimento de mensagens do Slack)
    - `channels.slack.streaming.chunkMode="newline"` habilita a divisão priorizando parágrafos
    - os envios de arquivos usam as APIs de upload do Slack e podem incluir respostas em threads (`thread_ts`)
    - legendas longas de arquivos usam o primeiro bloco de texto compatível com o Slack como comentário do upload e enviam os blocos restantes como mensagens de acompanhamento
    - o limite de mídia de saída segue `channels.slack.mediaMaxMb` quando configurado; caso contrário, os envios do canal usam os padrões por tipo MIME do pipeline de mídia

  </Accordion>

  <Accordion title="Destinos de entrega">
    Destinos explícitos preferenciais:

    - `user:<id>` para mensagens diretas
    - `channel:<id>` para canais

    Mensagens diretas do Slack contendo apenas texto/blocos podem ser publicadas diretamente em IDs de usuários; uploads de arquivos e envios em threads primeiro abrem a mensagem direta pelas APIs de conversa do Slack, pois esses caminhos exigem um ID de conversa concreto.

  </Accordion>
</AccordionGroup>

## Comandos e comportamento de comandos de barra

Os comandos de barra aparecem no Slack como um único comando configurado ou como vários comandos nativos. Configure `channels.slack.slashCommand` para alterar os padrões dos comandos:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Os comandos nativos exigem [configurações adicionais do manifesto](#additional-manifest-settings) no seu aplicativo Slack e, como alternativa, são habilitados com `channels.slack.commands.native: true` ou `commands.native: true` nas configurações globais.

- O modo automático de comandos nativos fica **desativado** no Slack, portanto `commands.native: "auto"` não habilita os comandos nativos do Slack.

```txt
/help
```

Os menus de argumentos nativos são renderizados de uma das seguintes formas, em ordem de prioridade:

- 3-5 opções suficientemente curtas: um menu de overflow ("...")
- mais de 100 opções, com filtragem assíncrona disponível: seleção externa
- 1-2 opções ou qualquer opção cujo valor codificado seja longo demais para uma seleção: blocos de botões
- caso contrário (6-100 opções ou mais de 100 sem filtragem assíncrona): menu de seleção estática, dividido em 100 opções por menu

```txt
/think
```

As sessões de comandos de barra usam chaves isoladas como `agent:<agentId>:slack:slash:<userId>` e ainda encaminham as execuções dos comandos para a sessão da conversa de destino usando `CommandTargetSessionKey`.

## Gráficos nativos

O bloco público [`data_visualization` do Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
do Slack renderiza gráficos de linhas, barras, áreas e pizza nas mensagens. O OpenClaw mapeia o bloco
`chart` de `presentation` portátil para esse formato nativo; nenhum escopo OAuth adicional,
upload de arquivo, renderizador de imagens ou configuração do Slack é necessário além do acesso normal
`chat:write` para mensagens.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Receita trimestral",
      "categories": ["1º tri", "2º tri"],
      "series": [{ "name": "Receita", "values": [120, 145] }],
      "xLabel": "Trimestre"
    }
  ]
}
```

Os limites do Slack são aplicados antes da renderização nativa:

- título e rótulos opcionais dos eixos: 50 caracteres
- pizza: 1-12 segmentos positivos
- linha/barra/área: 1-12 séries com nomes exclusivos e 1-20 categorias compartilhadas
- rótulos de segmentos, categorias e séries: 20 caracteres
- cada série deve conter um valor finito para cada categoria; valores que não sejam de gráficos de pizza
  podem ser negativos

Cada gráfico nativo também inclui uma representação textual no nível superior para leitores
de tela, notificações, espelhamento de sessões e clientes que não conseguem renderizar o
bloco. Envios de apresentação padrão para outros canais do OpenClaw recebem os mesmos
dados determinísticos do gráfico como texto, a menos que anunciem suporte nativo a gráficos. Se
o Slack rejeitar o gráfico com `invalid_blocks` durante uma implantação gradual, o OpenClaw
remove os blocos de dados nativos rejeitados, mantém os controles adjacentes e envia
a representação completa do gráfico como texto visível.

Atualmente, o Slack aceita até dois blocos `data_visualization` por mensagem. Quando
uma apresentação contém mais de dois gráficos válidos, o OpenClaw mantém a ordem
e continua a renderização nativa em mensagens de acompanhamento, com no máximo dois
gráficos em cada mensagem.

O [lançamento para desenvolvedores](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
do Slack documenta o bloco como um recurso do Block Kit voltado a aplicativos e não publica nenhuma
restrição de plano pago. A linguagem de elegibilidade para Business+/Enterprise se aplica à
geração automática de gráficos por IA do Slackbot, que é separada do envio, por um aplicativo,
de um gráfico já estruturado do Block Kit. Os gráficos são blocos exclusivos de mensagens, não conteúdo
do App Home, de modais ou do Canvas.

## Tabelas nativas

O bloco atual [`data_table` do Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
do Slack renderiza linhas e colunas estruturadas nas mensagens. O OpenClaw mapeia um bloco
explícito e portátil `table` de `presentation` para `data_table`; ele não usa o
bloco [`table` legado](https://docs.slack.dev/reference/block-kit/blocks/table-block/) do Slack.
Nenhum escopo OAuth adicional nem configuração do Slack é necessário além do acesso normal
`chat:write` para mensagens.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Pipeline aberto",
      "headers": ["Conta", "Etapa", "ARR"],
      "rows": [
        ["Acme", "Ganho", 125000],
        ["Globex", "Revisão", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

O OpenClaw mapeia cabeçalhos e células de strings para células `raw_text` do Slack. Células numéricas
são mapeadas para `raw_number`, preservando o valor numérico finito para classificação
e filtragem nativas. `rowHeaderColumnIndex`, quando presente, marca essa
coluna de índice zero como cabeçalhos de linha do Slack.

Os limites publicados pelo Slack para `data_table` são aplicados antes da renderização nativa:

- 1-20 colunas
- 1-100 linhas de dados, além da linha de cabeçalho
- o mesmo número de células em cada linha
- no máximo 10.000 caracteres agregados em todas as células das tabelas de uma mensagem

Vários blocos de tabela válidos podem ser renderizados nativamente enquanto a mensagem permanecer
dentro do limite agregado de caracteres. Uma tabela que não puder ser renderizada dentro do
limite nativo se tornará um texto determinístico completo, em vez de perder linhas ou
células. Se esse texto exceder uma mensagem do Slack, os envios e as respostas aos comandos de barra usam
blocos de texto ordenados. As edições de tabelas falham com um erro de tamanho explícito, em vez de
truncar silenciosamente linhas de uma mensagem existente.

Cada tabela nativa produzida por uma apresentação portátil também inclui uma representação
textual no nível superior para leitores de tela, notificações, espelhamento de sessões e
clientes que não conseguem renderizar o bloco. Os valores brutos de gráficos e tabelas permanecem literais
no fallback, portanto dados de células como `<@U123>` não se tornam uma menção do Slack.
Se o Slack rejeitar blocos nativos de gráficos ou tabelas com `invalid_blocks`, o OpenClaw
remove todos os blocos de dados nativos em uma única etapa de recuperação limitada, mantém
blocos adjacentes válidos, como botões e seleções, e envia o texto completo e visível dos gráficos
e tabelas com a formatação do Slack desabilitada. A entrega de comandos de barra
controla o orçamento de cinco chamadas de `response_url` do Slack durante todo o comando. Antes de cada
lote de respostas, ela seleciona um plano completo que cabe nas chamadas restantes ou falha
antes de publicar esse lote.

Somente blocos de tabela `presentation` explícitos são promovidos a tabelas nativas.
Tabelas Markdown com barras verticais continuam sendo texto criado pelo autor; o OpenClaw não tenta inferir a estrutura
da tabela nem os tipos das células. Produtores nativos confiáveis existentes do Slack podem continuar
a passar blocos brutos por `channelData.slack.blocks`; o OpenClaw deriva o texto de fallback
de células `data_table` brutas válidas, enquanto blocos personalizados malformados podem
ser reduzidos à legenda ou ao fallback geral do Block Kit. Saídas portáteis de agentes, da CLI
e de plugins devem usar `presentation`.

## Respostas interativas

O Slack pode renderizar controles de resposta interativos criados por agentes, mas esse recurso está desabilitado por padrão.
Para novas saídas de agentes, da CLI e de plugins, prefira os botões ou blocos de seleção
compartilhados de `presentation`. Eles usam o mesmo caminho de interação do Slack
e também se adaptam em outros canais.

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

Essas diretivas são compiladas no Block Kit do Slack e encaminham cliques ou seleções
pelo caminho existente de eventos de interação do Slack. Mantenha-as para prompts antigos
e alternativas específicas do Slack; use a apresentação compartilhada para novos
controles portáteis.

As APIs do compilador de diretivas também estão obsoletas para novos códigos produtores:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Use payloads de `presentation` e `buildSlackPresentationBlocks(...)` para novos
controles renderizados no Slack.

Observações:

- Esta é uma interface legada específica do Slack. Outros canais não convertem diretivas do Block
  Kit do Slack em seus próprios sistemas de botões.
- Os valores dos callbacks interativos são tokens opacos gerados pelo OpenClaw, não valores brutos criados pelo agente.
- Se os blocos interativos gerados excederem os limites do Block Kit do Slack, o OpenClaw usa como fallback a resposta de texto original, em vez de enviar um payload de blocos inválido.

### Envios de modais pertencentes a plugins

Plugins do Slack que registram um manipulador interativo também podem receber eventos de ciclo de vida
`view_submission` e `view_closed` antes que o OpenClaw compacte
o payload para o evento de sistema visível ao agente. Use um destes padrões de roteamento
ao abrir um modal do Slack:

- Defina `callback_id` como `openclaw:<namespace>:<payload>`.
- Ou mantenha um `callback_id` existente e coloque `pluginInteractiveData:
"<namespace>:<payload>"` nos `private_metadata` do modal.

O manipulador recebe `ctx.interaction.kind` como `view_submission` ou
`view_closed`, os `inputs` normalizados e o objeto `stateValues` bruto completo do
Slack. O roteamento apenas por ID de callback é suficiente para invocar o manipulador do plugin; inclua
os campos de roteamento de usuário/sessão existentes em `private_metadata` do modal quando o
modal também precisar produzir um evento de sistema visível ao agente. O agente recebe um evento de
sistema `Slack interaction: ...` compacto e com dados confidenciais removidos. Se o manipulador retornar
`systemEvent.summary`, `systemEvent.reference` ou `systemEvent.data`, esses
campos serão incluídos nesse evento compacto para que o agente possa referenciar
o armazenamento pertencente ao plugin sem ver o payload completo do formulário.

## Aprovações nativas no Slack

O Slack pode atuar como um cliente de aprovação nativo com botões e interações, em vez de usar como fallback a interface Web ou o terminal.

- Aprovações de execução e de plugins podem ser renderizadas como solicitações nativas do Block Kit do Slack.
- `channels.slack.execApprovals.*` continua sendo a configuração de habilitação e roteamento para mensagens diretas/canais do cliente nativo de aprovação de execução.
- As mensagens diretas de aprovação de execução usam `channels.slack.execApprovals.approvers` ou `commands.ownerAllowFrom`.
- As aprovações de plugins usam botões nativos do Slack quando o Slack está habilitado como cliente de aprovação nativo para a sessão de origem ou quando `approvals.plugin` é roteado para a sessão de origem do Slack ou para um destino do Slack.
- As mensagens diretas de aprovação de plugins usam os aprovadores de plugins do Slack definidos em `channels.slack.allowFrom`, no `allowFrom` da conta nomeada ou na rota padrão da conta.
- A autorização do aprovador continua sendo aplicada: aprovadores exclusivos de execução não podem aprovar solicitações de plugins, a menos que também sejam aprovadores de plugins.

Isso usa a mesma superfície compartilhada de botões de aprovação que outros canais. Quando `interactivity` está habilitada nas configurações do seu aplicativo Slack, as solicitações de aprovação são renderizadas como botões do Block Kit diretamente na conversa.
Quando esses botões estão presentes, eles são a UX de aprovação principal; o OpenClaw
só deve incluir um comando manual `/approve` quando o resultado da ferramenta indicar que as
aprovações pelo chat estão indisponíveis ou que a aprovação manual é o único caminho.

Caminho de configuração:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opcional; recorre a `commands.ownerAllowFrom` quando possível)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, padrão: `dm`)
- `agentFilter`, `sessionFilter`

O Slack habilita automaticamente as aprovações nativas de execução quando `enabled` não está definido ou é `"auto"` e pelo menos um
aprovador de execução é resolvido. O Slack também pode processar aprovações nativas de Plugin por esse caminho de cliente nativo
quando os aprovadores de Plugin do Slack são resolvidos e a solicitação corresponde aos filtros do cliente nativo. Defina
`enabled: false` para desabilitar explicitamente o Slack como cliente nativo de aprovação. Defina `enabled: true` para
forçar a ativação das aprovações nativas quando os aprovadores forem resolvidos. Desabilitar as aprovações de execução do Slack não desabilita
a entrega de aprovações nativas de Plugin no Slack habilitada por meio de `approvals.plugin`; a entrega de aprovações de Plugin
usa os aprovadores de Plugin do Slack.

Comportamento padrão sem configuração explícita de aprovação de execução do Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

A configuração nativa do Slack só é necessária quando você deseja substituir os aprovadores, adicionar filtros ou
habilitar a entrega no chat de origem:

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

O encaminhamento compartilhado de `approvals.exec` é separado. Use-o somente quando as solicitações de aprovação de execução também precisarem
ser encaminhadas para outros chats ou destinos explícitos fora da banda. O encaminhamento compartilhado de `approvals.plugin` também é
separado; a entrega nativa do Slack só suprime esse fallback quando o Slack pode processar a solicitação de aprovação de Plugin
nativamente.

O `/approve` no mesmo chat também funciona em canais e DMs do Slack que já oferecem suporte a comandos. Consulte [Aprovações de execução](/pt-BR/tools/exec-approvals) para conhecer o modelo completo de encaminhamento de aprovações.

## Eventos e comportamento operacional

- Edições e exclusões de mensagens são mapeadas para eventos do sistema.
- Transmissões de threads (respostas de thread com "Also send to channel") são processadas como mensagens normais de usuário.
- Eventos de adição e remoção de reações são mapeados para eventos do sistema.
- Entrada e saída de membros, criação e renomeação de canais e eventos de adição e remoção de itens fixados são mapeados para eventos do sistema.
- `channel_id_changed` pode migrar chaves de configuração de canais quando `configWrites` está habilitado.
- Os metadados de tópico/finalidade do canal são tratados como contexto não confiável e podem ser injetados no contexto de roteamento.
- A mensagem inicial da thread e a propagação do contexto do histórico inicial da thread são filtradas pelas listas configuradas de remetentes permitidos, quando aplicável.
- Ações de blocos, atalhos e interações com modais emitem eventos estruturados de sistema `Slack interaction: ...` com campos de payload detalhados:
  - ações de blocos: valores selecionados, rótulos, valores de seletores e metadados `workflow_*`
  - atalhos globais: metadados de callback e ator, roteados para a sessão direta do ator
  - atalhos de mensagens: contexto do callback, ator, canal, thread e mensagem selecionada
  - eventos modais `view_submission` e `view_closed` com metadados do canal roteado e entradas de formulário

Defina atalhos globais ou de mensagens na configuração do seu aplicativo Slack e use qualquer ID de callback que não esteja vazio. O OpenClaw confirma o recebimento de payloads de atalhos correspondentes, aplica a mesma política de remetente de DM/canal usada por outras interações do Slack e enfileira o evento sanitizado para a sessão do agente roteada. IDs de acionamento e URLs de resposta são removidos do contexto do agente.

## Referência de configuração

Referência principal: [Referência de configuração — Slack](/pt-BR/gateway/config-channels#slack).

<Accordion title="Campos de alto impacto do Slack">

- modo/autenticação: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- acesso a DMs: `dm.enabled`, `dmPolicy`, `allowFrom` (legado: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- alternância de compatibilidade: `dangerouslyAllowNameMatching` (uso emergencial; mantenha desativada, salvo se necessário)
- acesso a canais: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threads/histórico: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- entrega: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- prévias: `unfurlLinks` (padrão: `false`), `unfurlMedia` para controlar prévias de links/mídia de `chat.postMessage`; defina `unfurlLinks: true` para reativar as prévias de links
- operações/recursos: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas nos canais">
    Verifique, nesta ordem:

    - `groupPolicy`
    - lista de canais permitidos (`channels.slack.channels`) — **as chaves devem ser IDs de canais** (`C12345678`), não nomes (`#channel-name`). Chaves baseadas em nomes falham silenciosamente com `groupPolicy: "allowlist"` porque, por padrão, o roteamento de canais prioriza o ID. Para encontrar um ID: clique com o botão direito no canal no Slack → **Copy link** — o valor `C...` no final da URL é o ID do canal.
    - `requireMention`
    - lista de `users` permitidos por canal
    - `messages.groupChat.visibleReplies`: por padrão, solicitações normais de grupo/canal usam `"automatic"`. Se você habilitou `"message_tool"` e os logs mostram texto do assistente sem uma chamada `message(action=send)`, o modelo não usou o caminho visível da ferramenta de mensagens. Nesse modo, o texto final permanece privado; inspecione o log detalhado do Gateway para verificar os metadados de payload suprimidos ou defina-o como `"automatic"` se quiser que todas as respostas finais normais do assistente sejam publicadas pelo caminho legado.
    - `messages.groupChat.unmentionedInbound`: se for `"room_event"`, as conversas permitidas do canal sem menção funcionam como contexto ambiente e permanecem silenciosas, a menos que o agente chame a ferramenta `message`. Consulte [Eventos ambientes de sala](/pt-BR/channels/ambient-room-events).

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
    - aprovações de pareamento/entradas na lista de permitidos (`dmPolicy: "open"` ainda exige `channels.slack.allowFrom: ["*"]`)
    - DMs de grupo usam o processamento de MPIM; habilite `channels.slack.dm.groupEnabled` e, se configurado, inclua o MPIM em `channels.slack.dm.groupChannels`
    - eventos de DM do Slack Assistant: logs detalhados que mencionam `drop message_changed`
      geralmente significam que o Slack enviou um evento editado de thread do Assistant sem um
      remetente humano recuperável nos metadados da mensagem

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="O modo Socket não está se conectando">
    Valide os tokens de bot e aplicativo e a ativação do Socket Mode nas configurações do aplicativo Slack.
    O App-Level Token precisa de `connections:write`, e o token de bot Bot User OAuth Token
    deve pertencer ao mesmo aplicativo/workspace do Slack que o token do aplicativo.

    Se `openclaw channels status --probe --json` mostrar `botTokenStatus` ou
    `appTokenStatus: "configured_unavailable"`, a conta do Slack está
    configurada, mas o runtime atual não conseguiu resolver o valor baseado em SecretRef.

    Logs como `slack socket mode failed to start; retry ...` indicam falhas de
    inicialização recuperáveis. Escopos ausentes, tokens revogados e autenticação inválida falham imediatamente.
    Um log `slack token mismatch ...` significa que o token do bot e o token do aplicativo
    parecem pertencer a aplicativos Slack diferentes; corrija as credenciais do aplicativo Slack.

  </Accordion>

  <Accordion title="O modo HTTP não está recebendo eventos">
    Valide:

    - segredo de assinatura
    - caminho do Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - um `webhookPath` exclusivo por conta HTTP
    - se a URL pública encerra o TLS e encaminha as solicitações para o caminho do Gateway
    - se o caminho `request_url` do aplicativo Slack corresponde exatamente a `channels.slack.webhookPath` (padrão `/slack/events`)

    Se `signingSecretStatus: "configured_unavailable"` aparecer nos snapshots
    da conta, a conta HTTP está configurada, mas o runtime atual não conseguiu
    resolver o segredo de assinatura baseado em SecretRef.

    Um log repetido `slack: webhook path ... already registered` significa que duas contas HTTP
    estão usando o mesmo `webhookPath`; atribua um caminho distinto a cada conta.

  </Accordion>

  <Accordion title="Comandos nativos/de barra não são acionados">
    Verifique qual era sua intenção:

    - modo de comando nativo (`channels.slack.commands.native: true`) com comandos de barra correspondentes registrados no Slack
    - ou modo de comando de barra único (`channels.slack.slashCommand.enabled: true`)

    O Slack não cria nem remove comandos de barra automaticamente. `commands.native: "auto"` não habilita os comandos nativos do Slack; use `true` e crie os comandos correspondentes no aplicativo Slack. No modo HTTP, cada comando de barra do Slack deve incluir a URL do Gateway. No Socket Mode, os payloads dos comandos chegam pelo websocket, e o Slack ignora `slash_commands[].url`.

    Verifique também `commands.useAccessGroups`, a autorização de DM, as listas de canais permitidos
    e as listas de `users` permitidos por canal. O Slack retorna erros efêmeros para
    remetentes bloqueados de comandos de barra, incluindo:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referência de mídia dos anexos

O Slack pode anexar mídias baixadas ao turno do agente quando os downloads de arquivos do Slack são bem-sucedidos e os limites de tamanho permitem. Clipes de áudio podem ser transcritos, arquivos de imagem podem passar pelo caminho de compreensão de mídia ou diretamente para um modelo de resposta com recursos de visão, e outros arquivos permanecem disponíveis como contexto de arquivo para download.

### Tipos de mídia compatíveis

| Tipo de mídia                  | Origem               | Comportamento atual                                                              | Observações                                                                 |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Clipes de áudio do Slack       | URL de arquivo Slack | Baixados e roteados pela transcrição de áudio compartilhada                      | Exige `files:read` e um modelo ou CLI `tools.media.audio` funcional         |
| Imagens JPEG / PNG / GIF / WebP | URL de arquivo Slack | Baixadas e anexadas ao turno para processamento com recursos de visão            | Limite por arquivo: `channels.slack.mediaMaxMb` (padrão de 20 MB)           |
| Arquivos PDF                   | URL de arquivo Slack | Baixados e expostos como contexto de arquivo para ferramentas como `download-file` ou `pdf` | A entrada do Slack não converte PDFs automaticamente em entrada de visão por imagem |
| Outros arquivos               | URL de arquivo Slack | Baixados quando possível e expostos como contexto de arquivo                     | Arquivos binários não são tratados como entrada de imagem                   |
| Respostas em threads           | Arquivos da mensagem inicial da thread | Os arquivos da mensagem raiz podem ser carregados como contexto quando a resposta não tem mídia direta | Mensagens iniciais somente com arquivos usam um placeholder de anexo |
| Mensagens com vários arquivos  | Vários arquivos Slack | Cada arquivo é avaliado de forma independente                                    | O processamento do Slack é limitado a oito arquivos por mensagem            |

### Pipeline de entrada

Quando chega uma mensagem do Slack com arquivos anexados:

1. O OpenClaw baixa o arquivo da URL privada do Slack usando o token do bot.
2. O arquivo é gravado no armazenamento de mídia quando o download é bem-sucedido.
3. Os caminhos e tipos de conteúdo das mídias baixadas são adicionados ao contexto de entrada.
4. Os clipes de áudio são encaminhados ao pipeline compartilhado de transcrição; os caminhos de modelos e ferramentas compatíveis com imagens podem usar anexos de imagem do mesmo contexto.
5. Outros arquivos permanecem disponíveis como metadados de arquivo ou referências de mídia para ferramentas capazes de processá-los.

### Herança de anexos da mensagem raiz da thread

Quando uma mensagem chega em uma thread (tem uma mensagem pai `thread_ts`):

- Se a própria resposta não tiver mídia direta e a mensagem raiz incluída tiver arquivos, o Slack poderá carregar os arquivos da raiz como contexto de início da thread.
- Os arquivos da raiz são carregados somente durante a inicialização de uma sessão de thread nova ou redefinida. Respostas posteriores contendo apenas texto reutilizam o contexto da sessão existente e não anexam novamente os arquivos da raiz como novas mídias.
- Os anexos diretos da resposta têm precedência sobre os anexos da mensagem raiz.
- Uma mensagem raiz que tenha apenas arquivos e nenhum texto é representada por um espaço reservado de anexo para que o fallback ainda possa incluir seus arquivos.

### Processamento de vários anexos

Quando uma única mensagem do Slack contém vários anexos de arquivo:

- Cada anexo é processado de forma independente pelo pipeline de mídia.
- As referências das mídias baixadas são agregadas ao contexto da mensagem.
- A ordem de processamento segue a ordem dos arquivos do Slack no payload do evento.
- Uma falha no download de um anexo não bloqueia os demais.

### Limites de tamanho, download e modelo

- **Limite de tamanho**: 20 MB por arquivo por padrão. Configurável por meio de `channels.slack.mediaMaxMb`.
- **Limite de transcrição de áudio**: `tools.media.audio.maxBytes` também se aplica quando o arquivo baixado é enviado a um provedor de transcrição ou à CLI.
- **Falhas de download**: Arquivos que o Slack não consegue fornecer, URLs expiradas, arquivos inacessíveis, arquivos acima do limite de tamanho e respostas HTML de autenticação/login do Slack são ignorados em vez de serem informados como formatos incompatíveis.
- **Modelo de visão**: A análise de imagens usa o modelo de resposta ativo quando ele é compatível com visão ou o modelo de imagem configurado em `agents.defaults.imageModel`.

### Limitações conhecidas

| Cenário                                       | Comportamento atual                                                                         | Solução alternativa                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| URL de arquivo do Slack expirada              | O arquivo é ignorado; nenhum erro é exibido                                                  | Reenvie o arquivo no Slack                                                                              |
| Transcrição de áudio indisponível             | O clipe permanece anexado, mas nenhuma transcrição é produzida                               | Configure `tools.media.audio` ou instale uma CLI de transcrição local compatível                        |
| Clipe sem legenda não passa pelo filtro de menção | Descartado após transcrição especulativa privada; a transcrição e o download são descartados | Configure um padrão de menção por nome falado, adicione uma menção digitada ao bot ou use uma mensagem direta |
| Modelo de visão não configurado               | Os anexos de imagem são armazenados como referências de mídia, mas não são analisados como imagens | Configure `agents.defaults.imageModel` ou use um modelo de resposta compatível com visão             |
| Imagens muito grandes (> 20 MB por padrão)    | Ignoradas de acordo com o limite de tamanho                                                  | Aumente `channels.slack.mediaMaxMb` se o Slack permitir                                                 |
| Anexos encaminhados/compartilhados            | O processamento de texto e mídia de imagem/arquivo hospedada no Slack é feito em regime de melhor esforço | Compartilhe novamente diretamente na thread do OpenClaw                                      |
| Anexos PDF                                    | Armazenados como contexto de arquivo/mídia, sem encaminhamento automático para visão de imagens | Use `download-file` para obter metadados do arquivo ou a ferramenta `pdf` para analisar o PDF         |

### Documentação relacionada

- [Pipeline de compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
- [Ferramenta de PDF](/pt-BR/tools/pdf)

## Relacionados

<CardGroup cols={2}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    Emparelhe um usuário do Slack com o Gateway.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de canais e mensagens diretas em grupo.
  </Card>
  <Card title="Roteamento de canais" icon="route" href="/pt-BR/channels/channel-routing">
    Encaminhe mensagens recebidas aos agentes.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de ameaças e proteção.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Estrutura e precedência da configuração.
  </Card>
  <Card title="Comandos de barra" icon="terminal" href="/pt-BR/tools/slash-commands">
    Catálogo e comportamento dos comandos.
  </Card>
</CardGroup>
