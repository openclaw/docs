---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-23T13:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11bf136cecb26dc939c5e78e020c0e6aa3312d9f143af0cab7568743c728cf13
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark é uma plataforma de colaboração completa em que equipes conversam, compartilham documentos, gerenciam calendários e trabalham em conjunto.

**Status:** pronto para produção para DMs de bot e chats em grupo. WebSocket é o modo padrão; o modo Webhook é opcional.

---

## Início rápido

> **Requer OpenClaw 2026.4.10 ou superior.** Execute `openclaw --version` para verificar. Atualize com `openclaw update`.

<Steps>
  <Step title="Execute o assistente de configuração do canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escaneie o código QR com o aplicativo móvel do Feishu/Lark para criar automaticamente um bot do Feishu/Lark.
  </Step>
  
  <Step title="Depois que a configuração for concluída, reinicie o Gateway para aplicar as alterações">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controle de acesso

### Mensagens diretas

Configure `dmPolicy` para controlar quem pode enviar mensagem direta ao bot:

- `"pairing"` — usuários desconhecidos recebem um código de pareamento; aprove via CLI
- `"allowlist"` — somente usuários listados em `allowFrom` podem conversar (padrão: apenas o proprietário do bot)
- `"open"` — permitir todos os usuários
- `"disabled"` — desabilitar todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats em grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamento                              |
| ------------- | ------------------------------------------ |
| `"open"`      | Responde a todas as mensagens em grupos    |
| `"allowlist"` | Só responde a grupos em `groupAllowFrom`   |
| `"disabled"`  | Desabilita todas as mensagens em grupos    |

Padrão: `allowlist`

**Exigência de menção** (`channels.feishu.requireMention`):

- `true` — exigir @menção (padrão)
- `false` — responder sem @menção
- Substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`

---

## Exemplos de configuração de grupo

### Permitir todos os grupos, sem exigir @menção

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Permitir todos os grupos, mas ainda exigir @menção

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Permitir apenas grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // IDs de grupo têm este formato: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restringir remetentes dentro de um grupo

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_ids de usuário têm este formato: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obter IDs de grupo/usuário

### IDs de grupo (`chat_id`, formato: `oc_xxx`)

Abra o grupo no Feishu/Lark, clique no ícone de menu no canto superior direito e vá para **Settings**. O ID do grupo (`chat_id`) está listado na página de configurações.

![Get Group ID](/images/feishu-get-group-id.png)

### IDs de usuário (`open_id`, formato: `ou_xxx`)

Inicie o Gateway, envie uma DM para o bot e depois verifique os logs:

```bash
openclaw logs --follow
```

Procure por `open_id` na saída do log. Você também pode verificar solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição                     |
| --------- | ----------------------------- |
| `/status` | Mostrar o status do bot       |
| `/reset`  | Redefinir a sessão atual      |
| `/model`  | Mostrar ou trocar o modelo de IA |

> Feishu/Lark não oferece suporte a menus nativos de comandos com barra, então envie estes comandos como mensagens de texto simples.

---

## Solução de problemas

### O bot não responde em chats em grupo

1. Verifique se o bot foi adicionado ao grupo
2. Verifique se você fez @menção ao bot (obrigatório por padrão)
3. Verifique se `groupPolicy` não está como `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Verifique se o bot foi publicado e aprovado no Feishu Open Platform / Lark Developer
2. Verifique se a assinatura de eventos inclui `im.message.receive_v1`
3. Verifique se **persistent connection** (WebSocket) está selecionado
4. Verifique se todos os escopos de permissão obrigatórios foram concedidos
5. Verifique se o Gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### App Secret vazou

1. Redefina o App Secret no Feishu Open Platform / Lark Developer
2. Atualize o valor na sua configuração
3. Reinicie o Gateway: `openclaw gateway restart`

---

## Configuração avançada

### Várias contas

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot principal",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot de backup",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qual conta é usada quando as APIs de saída não especificam um `accountId`.

### Limites de mensagem

- `textChunkLimit` — tamanho do bloco de texto de saída (padrão: `2000` caracteres)
- `mediaMaxMb` — limite de upload/download de mídia (padrão: `30` MB)

### Streaming

Feishu/Lark oferece suporte a respostas em streaming por meio de cartões interativos. Quando ativado, o bot atualiza o cartão em tempo real enquanto gera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // ativa a saída em streaming por cartão (padrão: true)
      blockStreaming: true, // ativa streaming em nível de bloco (padrão: true)
    },
  },
}
```

Defina `streaming: false` para enviar a resposta completa em uma única mensagem.

### Otimização de cota

Reduza o número de chamadas de API do Feishu/Lark com dois sinalizadores opcionais:

- `typingIndicator` (padrão `true`): defina como `false` para ignorar chamadas de reação de digitação
- `resolveSenderNames` (padrão `true`): defina como `false` para ignorar buscas de perfil do remetente

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sessões ACP

Feishu/Lark oferece suporte a ACP para DMs e mensagens em threads de grupo. O ACP no Feishu/Lark é guiado por comandos de texto — não há menus nativos de comandos com barra, então use mensagens `/acp ...` diretamente na conversa.

#### Vinculação ACP persistente

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Iniciar ACP a partir do chat

Em uma DM ou thread do Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens em thread do Feishu/Lark. As mensagens seguintes na conversa vinculada são encaminhadas diretamente para essa sessão ACP.

### Roteamento de vários agentes

Use `bindings` para encaminhar DMs ou grupos do Feishu/Lark para agentes diferentes.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campos de roteamento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) ou `"group"` (chat em grupo)
- `match.peer.id`: Open ID do usuário (`ou_xxx`) ou ID do grupo (`oc_xxx`)

Veja [Obter IDs de grupo/usuário](#get-groupuser-ids) para dicas de como localizar esses IDs.

---

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                     | Descrição                                  | Padrão           |
| ------------------------------------------------ | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                        | Ativar/desativar o canal                   | `true`           |
| `channels.feishu.domain`                         | Domínio da API (`feishu` ou `lark`)        | `feishu`         |
| `channels.feishu.connectionMode`                 | Transporte de eventos (`websocket` ou `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                 | Conta padrão para roteamento de saída      | `default`        |
| `channels.feishu.verificationToken`              | Obrigatório para o modo Webhook            | —                |
| `channels.feishu.encryptKey`                     | Obrigatório para o modo Webhook            | —                |
| `channels.feishu.webhookPath`                    | Caminho da rota do Webhook                 | `/feishu/events` |
| `channels.feishu.webhookHost`                    | Host de bind do Webhook                    | `127.0.0.1`      |
| `channels.feishu.webhookPort`                    | Porta de bind do Webhook                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`            | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`        | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`           | Substituição de domínio por conta          | `feishu`         |
| `channels.feishu.dmPolicy`                       | Política de DM                             | `allowlist`      |
| `channels.feishu.allowFrom`                      | Lista de permissões de DM (lista de `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                    | Política de grupo                          | `allowlist`      |
| `channels.feishu.groupAllowFrom`                 | Lista de permissões de grupo               | —                |
| `channels.feishu.requireMention`                 | Exigir @menção em grupos                   | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention`| Substituição de @menção por grupo          | herdado          |
| `channels.feishu.groups.<chat_id>.enabled`       | Ativar/desativar um grupo específico       | `true`           |
| `channels.feishu.textChunkLimit`                 | Tamanho do bloco de mensagem               | `2000`           |
| `channels.feishu.mediaMaxMb`                     | Limite de tamanho de mídia                 | `30`             |
| `channels.feishu.streaming`                      | Saída em streaming por cartão              | `true`           |
| `channels.feishu.blockStreaming`                 | Streaming em nível de bloco                | `true`           |
| `channels.feishu.typingIndicator`                | Enviar reações de digitação                | `true`           |
| `channels.feishu.resolveSenderNames`             | Resolver nomes de exibição do remetente    | `true`           |

---

## Tipos de mensagem compatíveis

### Receber

- ✅ Texto
- ✅ Texto rico (post)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Figurinhas

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos (incluindo atualizações em streaming)
- ⚠️ Texto rico (formatação no estilo post; não oferece suporte a todos os recursos de autoria do Feishu/Lark)

### Threads e respostas

- ✅ Respostas em linha
- ✅ Respostas em thread
- ✅ Respostas com mídia permanecem cientes de thread ao responder a uma mensagem em thread

---

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento da segurança
