---
read_when:
    - Conectando o OpenClaw a um espaço de trabalho do ClickClack
    - Testando identidades de bot do ClickClack
summary: Configuração do canal ClickClack com token de bot e sintaxe do destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-11T23:43:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

O ClickClack conecta o OpenClaw a um espaço de trabalho ClickClack auto-hospedado por meio de tokens de bot ClickClack com suporte nativo.

Use esta opção quando quiser que um agente do OpenClaw apareça como um usuário bot do ClickClack. O ClickClack oferece suporte a bots de serviço independentes e bots pertencentes a usuários; os bots pertencentes a usuários mantêm um `owner_user_id` e recebem somente os escopos de token que você conceder.

## Configuração rápida

Crie um token de bot no servidor ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Para um bot pertencente a um usuário, adicione `--owner <user_id>`.

Configure o OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Em seguida, execute:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Uma conta só é considerada configurada quando `baseUrl`, `token` e `workspace` estão todos definidos. `workspace` aceita um ID de espaço de trabalho (`wsp_...`), slug ou nome; o Gateway o resolve para o ID na inicialização.

### Chaves de configuração da conta

| Chave                   | Padrão              | Observações                                                                                         |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `baseUrl`               | nenhum (obrigatório) | URL do servidor ClickClack.                                                                        |
| `token`                 | nenhum (obrigatório) | String simples ou referência de segredo (`source: "env" \| "file" \| "exec"`).                      |
| `workspace`             | nenhum (obrigatório) | ID, slug ou nome do espaço de trabalho.                                                             |
| `replyMode`             | `"agent"`           | `"agent"` executa o pipeline completo do agente; `"model"` envia conclusões curtas e diretas do modelo. |
| `defaultTo`             | `"channel:general"` | Destino usado quando um caminho de saída não fornece um destino.                                    |
| `allowFrom`             | `["*"]`             | Lista de IDs de usuários permitidos para mensagens diretas e mensagens de canais recebidas.         |
| `botUserId`             | detectado automaticamente | Resolvido a partir da identidade do token do bot na inicialização.                              |
| `agentId`               | padrão da rota      | Vincula as mensagens recebidas desta conta a um único agente.                                       |
| `toolsAllow`            | nenhum              | Lista de ferramentas permitidas para respostas do agente provenientes desta conta.                  |
| `model`, `systemPrompt` | nenhum              | Usados pelas conclusões de `replyMode: "model"`.                                                     |
| `reconnectMs`           | `1500`              | Atraso de reconexão em tempo real (100 a 60000).                                                     |

Se `plugins.allow` for uma lista restritiva não vazia, selecionar explicitamente
o ClickClack na configuração do canal ou executar `openclaw plugins enable clickclack`
adicionará `clickclack` a essa lista. A instalação durante a integração inicial usa o mesmo
comportamento de seleção explícita. Esses caminhos não substituem `plugins.deny` nem uma
configuração global `plugins.enabled: false`. A execução direta de
`openclaw plugins install @openclaw/clickclack` segue a política normal de
instalação de plugins e também registra o ClickClack em uma lista de permissões existente.

## Vários bots

Cada conta abre sua própria conexão em tempo real com o ClickClack e usa seu próprio token de bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Modos de resposta

- `replyMode: "agent"` (padrão) encaminha as mensagens recebidas pelo pipeline normal do agente, incluindo o registro da sessão e a política de ferramentas.
- `replyMode: "model"` ignora o pipeline do agente e usa `llm.complete` do runtime do plugin para respostas curtas e diretas do bot (opcionalmente definidas por `model` e `systemPrompt`).

O modo de modelo executa conclusões usando o ID resolvido do agente do bot, o que exige
o sinalizador explícito de confiança `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

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
}
```

Mantenha o sinalizador de confiança desativado se você usar apenas o modo de resposta
`agent` padrão; ele não é necessário nesse modo.

Use o modo `agent` para obter evidências de correlação entre serviços. Para um ID de
mensagem ClickClack autoritativo em seu formato canônico `msg_<ulid>`, o canal deriva
o ID determinístico de execução do OpenClaw `clickclack:<message-id>`. Cada chamada de modelo
fica então visível nos diagnósticos como `clickclack:<message-id>:model:<n>`; quando esse
turno usa o ClawRouter, o mesmo ID de chamada do modelo é enviado como `X-Request-ID`.
O modo `model` ignora os diagnósticos normais de execução/sessão do agente e, portanto,
não é adequado para esse caminho de evidências.

Quando um evento em tempo real contém um `payload.correlation_id` validado, o
canal o encaminha como `X-Correlation-ID` na busca autoritativa da mensagem e
nas solicitações de resposta ClickClack resultantes. Os valores usam o conjunto seguro
de 128 caracteres do ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` e `-`); valores inválidos
são omitidos. Essas associações contêm apenas identificadores, nunca corpos de mensagens,
prompts, conclusões, credenciais ou saída de ferramentas.

## Linhas de atividade do agente

Por padrão, um canal do ClickClack não exibe nada enquanto um turno do agente está em execução; somente a resposta final é publicada. Defina `agentActivity: true` em uma conta para publicar linhas persistentes de mensagens `agent_commentary` e `agent_tool` enquanto o turno está em andamento:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Requisitos e comportamento:

- **Desativado por padrão.** As configurações padrão e os servidores ClickClack mais antigos não são afetados.
- **Exige o escopo de token `agent_activity:write`.** Esse escopo é separado de `bot:write` e não é herdado por ele; crie o token do bot com `--scopes bot:write,agent_activity:write` (ou conceda o escopo a um token existente) antes de ativar a opção.
- **Degradação por melhor esforço.** Se o token não tiver `agent_activity:write` ou o servidor rejeitar gravações de atividade, as falhas serão registradas e a resposta final ainda será entregue normalmente; nenhuma linha de atividade aparecerá.
- As linhas são agrupadas por turno (`turn_id`), consolidadas para que cada etapa lógica corresponda a uma linha, e as linhas de ferramentas usam a mesma formatação de progresso do Discord/Slack/Telegram (nome da ferramenta mais os detalhes do comando).
- **Metadados de atribuição.** As publicações criadas pelo agente (linhas de atividade e a resposta final) incluem os campos `author_model` e `author_thinking`, resolvidos a partir do modelo efetivamente usado no turno (inclusive após fallback). Servidores que não definem essas colunas ignoram os campos JSON desconhecidos; servidores que os persistem podem responder “qual modelo disse esta linha e em qual nível de raciocínio” para cada mensagem.

## Destinos

- `channel:<name-or-id>` envia para um canal do espaço de trabalho. Destinos sem prefixo usam `channel:` por padrão.
- `dm:<user_id>` cria ou reutiliza uma conversa direta com esse usuário.
- `thread:<message_id>` responde na thread iniciada por essa mensagem.

Os destinos de saída explícitos também podem incluir o prefixo de provedor `clickclack:` ou `cc:`.

Exemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permissões

Os escopos do token ClickClack são aplicados pela API do ClickClack.

- `bot:read`: lê dados de espaço de trabalho, canal, mensagem, thread, mensagem direta, tempo real e perfil.
- `bot:write`: `bot:read` mais mensagens de canal, respostas em threads, mensagens diretas e uploads.
- `bot:admin`: `bot:write` mais criação de canais.
- `agent_activity:write`: linhas persistentes de atividade do agente (`agent_commentary` / `agent_tool`). Não é herdado por `bot:write` nem `bot:admin`; é obrigatório somente quando `agentActivity: true` está definido.

O OpenClaw precisa somente de `bot:write` para o chat normal do agente. Adicione `agent_activity:write` ao ativar as [linhas de atividade do agente](#agent-activity-rows).

## Solução de problemas

- `ClickClack is not configured for account "<id>"`: defina `baseUrl`, `token` (por exemplo, por meio de `CLICKCLACK_BOT_TOKEN`) e `workspace` para essa conta.
- `ClickClack workspace not found: <value>`: defina `workspace` como o ID, slug ou nome do espaço de trabalho retornado pelo ClickClack.
- Não há respostas recebidas: confirme se o token tem acesso de leitura em tempo real e observe que o bot ignora as próprias mensagens e as mensagens de outros bots.
- Falha no envio para canais: verifique se o bot é membro do espaço de trabalho e tem `bot:write`.
