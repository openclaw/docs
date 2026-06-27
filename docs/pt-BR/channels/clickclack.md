---
read_when:
    - Conectando o OpenClaw a um workspace do ClickClack
    - Testando identidades de bot do ClickClack
summary: Configuração do canal de token de bot do ClickClack e sintaxe de destino
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta o OpenClaw a um workspace ClickClack auto-hospedado por meio de tokens de bot ClickClack de primeira classe.

Use isto quando quiser que um agente OpenClaw apareça como um usuário bot do ClickClack. O ClickClack oferece suporte a bots de serviço independentes e bots pertencentes a usuários; bots pertencentes a usuários mantêm um `owner_user_id` e recebem apenas os escopos de token que você concede.

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

Se `plugins.allow` for uma lista restritiva não vazia, selecionar explicitamente
ClickClack na configuração do canal ou executar `openclaw plugins enable clickclack`
acrescenta `clickclack` a essa lista. A instalação de integração usa o mesmo
comportamento de seleção explícita. Esses caminhos não substituem `plugins.deny` nem uma
configuração global `plugins.enabled: false`. O uso direto de
`openclaw plugins install @openclaw/clickclack` segue a política normal de
instalação de Plugin e também registra o ClickClack em uma allowlist existente.

## Vários bots

Cada conta abre sua própria conexão em tempo real do ClickClack e usa seu próprio token de bot.

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
`plugins.entries.clickclack.llm.allowAgentIdOverride` para que o Plugin
possa executar conclusões para esse agente bot. Mantenha-o desativado se você usa apenas a rota
padrão do agente.

## Destinos

- `channel:<name-or-id>` envia para um canal do workspace. Destinos simples usam `channel:` por padrão.
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

- `bot:read`: lê dados de workspace/canal/mensagem/thread/DM/tempo real/perfil.
- `bot:write`: `bot:read` mais mensagens de canal, respostas em threads, DMs e uploads.
- `bot:admin`: `bot:write` mais criação de canais.

O OpenClaw precisa apenas de `bot:write` para chat normal de agente.

## Solução de problemas

- `ClickClack is not configured`: defina `channels.clickclack.token` ou `CLICKCLACK_BOT_TOKEN`.
- `workspace not found`: defina `workspace` como o ID ou slug do workspace retornado pelo ClickClack.
- Nenhuma resposta recebida: confirme que o token tem acesso de leitura em tempo real e que o bot não está respondendo às próprias mensagens.
- Falha no envio para canais: verifique se o bot é membro do workspace e tem `bot:write`.
