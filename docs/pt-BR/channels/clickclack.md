---
read_when:
    - Conectando o OpenClaw a um espaço de trabalho do ClickClack
    - Testando identidades de bots ClickClack
summary: Configuração do canal com token de bot do ClickClack e sintaxe de destino
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:53:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack conecta o OpenClaw a um espaço de trabalho ClickClack auto-hospedado por meio de tokens de bot ClickClack de primeira classe.

Use esta opção quando quiser que um agente do OpenClaw apareça como um usuário bot do ClickClack. O ClickClack oferece suporte a bots de serviço independentes e bots pertencentes a usuários; os bots pertencentes a usuários mantêm um `owner_user_id` e recebem apenas os escopos de token que você conceder.

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

| Chave                   | Padrão              | Observações                                                                                      |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `baseUrl`               | nenhum (obrigatório) | URL do servidor ClickClack.                                                                      |
| `token`                 | nenhum (obrigatório) | String simples ou referência de segredo (`source: "env" \| "file" \| "exec"`).                   |
| `workspace`             | nenhum (obrigatório) | ID, slug ou nome do espaço de trabalho.                                                          |
| `replyMode`             | `"agent"`           | `"agent"` executa o pipeline completo do agente; `"model"` envia conclusões curtas diretamente pelo modelo. |
| `defaultTo`             | `"channel:general"` | Destino usado quando um caminho de saída não fornece um destino.                                 |
| `allowFrom`             | `["*"]`             | Lista de IDs de usuários permitidos para DMs e mensagens de canal recebidas.                     |
| `botUserId`             | detectado automaticamente | Resolvido com base na identidade do token de bot durante a inicialização.                    |
| `agentId`               | padrão da rota       | Fixa as mensagens recebidas desta conta a um agente.                                             |
| `toolsAllow`            | nenhum              | Lista de ferramentas permitidas para respostas do agente provenientes desta conta.              |
| `model`, `systemPrompt` | nenhum              | Usados pelas conclusões de `replyMode: "model"`.                                                 |
| `reconnectMs`           | `1500`              | Atraso de reconexão em tempo real (100 a 60000).                                                 |

Se `plugins.allow` for uma lista restritiva não vazia, selecionar explicitamente
o ClickClack na configuração de canais ou executar `openclaw plugins enable clickclack`
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

O modo de modelo executa conclusões com o ID resolvido do agente do bot, o que exige
o sinalizador de confiança explícito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

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

Mantenha o sinalizador de confiança desativado se você usar apenas o modo de resposta `agent` padrão; ele
não é necessário nesse caso.

Use o modo `agent` para evidências de correlação entre serviços. Para um
ID de mensagem ClickClack autoritativo em seu formato canônico `msg_<ulid>`, o canal deriva
o ID de execução determinístico do OpenClaw `clickclack:<message-id>`. Cada chamada de modelo fica
então visível nos diagnósticos como `clickclack:<message-id>:model:<n>`; quando esse
turno usa o ClawRouter, o mesmo ID de chamada de modelo é enviado como `X-Request-ID`.
O modo `model` ignora os diagnósticos normais de execução/sessão do agente e, portanto,
não é adequado para esse caminho de evidência.

Quando um evento em tempo real contém um `payload.correlation_id` validado, o
canal o transporta como `X-Correlation-ID` na busca autoritativa da mensagem e
nas solicitações de resposta resultantes do ClickClack. Os valores usam o conjunto seguro
de 128 caracteres do ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` e `-`); valores inválidos
são omitidos. Essas associações contêm apenas identificadores, nunca corpos de mensagens,
prompts, conclusões, credenciais ou saída de ferramentas.

## Linhas de atividade do agente

Por padrão, um canal ClickClack não mostra nada enquanto um turno do agente está em execução; apenas a resposta final é publicada. Defina `agentActivity: true` em uma conta para publicar linhas de mensagem persistentes `agent_commentary` e `agent_tool` enquanto o turno estiver em andamento:

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

- **Desativado por padrão.** Configurações padrão e servidores ClickClack mais antigos não são afetados.
- **Exige o escopo de token `agent_activity:write`.** Esse escopo é separado de `bot:write` e não é herdado dele; crie o token de bot com `--scopes bot:write,agent_activity:write` (ou conceda o escopo a um token existente) antes de habilitar a opção.
- **Degradação pelo melhor esforço.** Se o token não tiver `agent_activity:write` ou o servidor rejeitar gravações de atividade, as falhas serão registradas e a resposta final ainda será entregue normalmente; nenhuma linha de atividade aparecerá.
- As linhas são agrupadas por turno (`turn_id`) e combinadas para que uma etapa lógica corresponda a uma linha; as linhas de ferramentas usam a mesma formatação de progresso do Discord/Slack/Telegram (nome da ferramenta mais detalhes do comando).
- **Metadados de atribuição.** Publicações criadas pelo agente (linhas de atividade e a resposta final) contêm os campos `author_model` e `author_thinking`, resolvidos com base no modelo realmente usado no turno (inclusive após fallback). Servidores que não definem essas colunas ignoram os campos JSON desconhecidos; servidores que os persistem podem responder “qual modelo disse esta linha e em qual nível de raciocínio” para cada mensagem.

## Destinos

- `channel:<name-or-id>` envia para um canal do espaço de trabalho. Destinos sem prefixo usam `channel:` por padrão.
- `dm:<user_id>` cria ou reutiliza uma conversa direta com esse usuário.
- `thread:<message_id>` responde na thread iniciada por essa mensagem.

Destinos de saída explícitos também podem conter o prefixo de provedor `clickclack:` ou `cc:`.

Exemplos:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Permissões

Os escopos de token do ClickClack são aplicados pela API do ClickClack.

- `bot:read`: lê dados de espaço de trabalho, canal, mensagem, thread, DM, tempo real e perfil.
- `bot:write`: `bot:read` mais mensagens de canal, respostas em threads, DMs e uploads.
- `bot:admin`: `bot:write` mais criação de canais.
- `agent_activity:write`: linhas persistentes de atividade do agente (`agent_commentary` / `agent_tool`). Não é herdado por `bot:write` nem `bot:admin`; é obrigatório apenas quando `agentActivity: true` está definido.

O OpenClaw precisa apenas de `bot:write` para conversas normais do agente. Adicione `agent_activity:write` ao habilitar [linhas de atividade do agente](#agent-activity-rows).

## Solução de problemas

- `ClickClack is not configured for account "<id>"`: defina `baseUrl`, `token` (por exemplo, por meio de `CLICKCLACK_BOT_TOKEN`) e `workspace` para essa conta.
- `ClickClack workspace not found: <value>`: defina `workspace` como o ID, slug ou nome do espaço de trabalho retornado pelo ClickClack.
- Nenhuma resposta recebida: confirme que o token tem acesso de leitura em tempo real e observe que o bot ignora as próprias mensagens e as mensagens de outros bots.
- Falha no envio para canais: verifique se o bot é membro do espaço de trabalho e tem `bot:write`.
