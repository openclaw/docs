---
read_when:
    - Conectando o OpenClaw a um espaço de trabalho do ClickClack
    - Teste de identidades de bots do ClickClack
summary: Configuração do canal bot-token do ClickClack e sintaxe de destino
title: ClickClack
x-i18n:
    generated_at: "2026-05-10T19:20:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4860b5f0a40d38af99bec0b8187f723a30c9b4b78d2d1de50ba8a97954baeb
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta o OpenClaw a um espaço de trabalho ClickClack auto-hospedado por meio de tokens de bot do ClickClack de primeira classe.

Use isto quando você quiser que um agente do OpenClaw apareça como um usuário bot do ClickClack. O ClickClack oferece suporte a bots de serviço independentes e bots pertencentes a usuários; bots pertencentes a usuários mantêm um `owner_user_id` e recebem apenas os escopos de token que você concede.

## Configuração rápida

Crie um token de bot no ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Para um bot pertencente a um usuário, adicione `--owner <user_id>`.

Configure o OpenClaw:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

Em seguida, execute:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## Vários bots

Cada conta abre sua própria conexão em tempo real com o ClickClack e usa seu próprio token de bot.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` usa `api.runtime.llm.complete` diretamente para respostas curtas do bot.
Quando uma conta define `agentId`, o OpenClaw exige o bit de confiança explícito
`plugins.entries.clickclack.llm.allowAgentIdOverride` para que o plugin
possa executar conclusões para esse agente bot. Mantenha desativado se você usa apenas a rota
do agente padrão.

## Destinos

- `channel:<name-or-id>` envia para um canal do espaço de trabalho. Destinos sem prefixo usam `channel:` por padrão.
- `dm:<user_id>` cria ou reutiliza uma conversa direta com esse usuário.
- `thread:<message_id>` responde em uma thread existente.

Exemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permissões

Os escopos de token do ClickClack são aplicados pela API do ClickClack.

- `bot:read`: lê dados de espaço de trabalho/canal/mensagem/thread/DM/tempo real/perfil.
- `bot:write`: `bot:read` mais mensagens de canal, respostas em threads, DMs e uploads.
- `bot:admin`: `bot:write` mais criação de canais.

O OpenClaw precisa apenas de `bot:write` para conversas normais de agente.

## Solução de problemas

- `ClickClack is not configured`: defina `channels.clickclack.token` ou `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: defina `workspace` como o ID ou slug do espaço de trabalho retornado pelo ClickClack.
- Sem respostas recebidas: confirme que o token tem acesso de leitura em tempo real e que o bot não está respondendo às próprias mensagens.
- Falhas ao enviar para canais: verifique se o bot é membro do espaço de trabalho e tem `bot:write`.
