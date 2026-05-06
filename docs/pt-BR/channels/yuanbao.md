---
read_when:
    - Você quer conectar um bot Yuanbao
    - Você está configurando o canal Yuanbao
summary: Visão geral, recursos e configuração do bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T05:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao é a plataforma de assistente de IA da Tencent. O Plugin de canal do OpenClaw
conecta bots do Yuanbao ao OpenClaw via WebSocket para que eles possam interagir com usuários
por mensagens diretas e chats em grupo.

**Status:** pronto para produção para DMs de bot + chats em grupo. WebSocket é o único modo de conexão compatível.

---

## Início rápido

> **Requer OpenClaw 2026.4.10 ou superior.** Execute `openclaw --version` para verificar. Atualize com `openclaw update`.

<Steps>
  <Step title="Adicione o canal Yuanbao com suas credenciais">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  O valor de `--token` usa o formato `appKey:appSecret` separado por dois-pontos. Você pode obtê-los no app Yuanbao criando um robô nas configurações do seu aplicativo.
  </Step>

  <Step title="Depois que a configuração for concluída, reinicie o gateway para aplicar as mudanças">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuração interativa (alternativa)

Você também pode usar o assistente interativo:

```bash
openclaw channels login --channel yuanbao
```

Siga as instruções para inserir seu App ID e App Secret.

---

## Controle de acesso

### Mensagens diretas

Configure `dmPolicy` para controlar quem pode enviar DM para o bot:

- `"pairing"` - usuários desconhecidos recebem um código de pareamento; aprove via CLI
- `"allowlist"` - somente usuários listados em `allowFrom` podem conversar
- `"open"` - permite todos os usuários (padrão)
- `"disabled"` - desativa todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Chats em grupo

**Requisito de menção** (`channels.yuanbao.requireMention`):

- `true` - exige @menção (padrão)
- `false` - responde sem @menção

Responder à mensagem do bot em um chat em grupo é tratado como uma menção implícita.

---

## Exemplos de configuração

### Configuração básica com política de DM aberta

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### Restringir DMs a usuários específicos

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### Desativar o requisito de @menção em grupos

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Otimizar a entrega de mensagens de saída

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Ajustar a estratégia merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Comandos comuns

| Comando    | Descrição                         |
| ---------- | --------------------------------- |
| `/help`    | Mostrar comandos disponíveis      |
| `/status`  | Mostrar status do bot             |
| `/new`     | Iniciar uma nova sessão           |
| `/stop`    | Parar a execução atual            |
| `/restart` | Reiniciar o OpenClaw              |
| `/compact` | Compactar o contexto da sessão    |

> Yuanbao oferece suporte a menus nativos de comandos de barra. Os comandos são sincronizados automaticamente com a plataforma quando o gateway inicia.

---

## Solução de problemas

### O bot não responde em chats em grupo

1. Garanta que o bot foi adicionado ao grupo
2. Garanta que você @mencione o bot (obrigatório por padrão)
3. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Garanta que o bot foi criado e aprovado no app Yuanbao
2. Garanta que `appKey` e `appSecret` estejam configurados corretamente
3. Garanta que o gateway esteja em execução: `openclaw gateway status`
4. Verifique os logs: `openclaw logs --follow`

### O bot envia respostas vazias ou de fallback

1. Verifique se o modelo de IA está retornando conteúdo válido
2. A resposta de fallback padrão é: "暂时无法解答，你可以换个问题问问我哦"
3. Personalize-a via `channels.yuanbao.fallbackReply`

### App Secret vazado

1. Redefina o App Secret no YuanBao APP
2. Atualize o valor na sua configuração
3. Reinicie o gateway: `openclaw gateway restart`

---

## Configuração avançada

### Várias contas

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qual conta é usada quando APIs de saída não especificam um `accountId`.

### Limites de mensagem

- `maxChars` - contagem máxima de caracteres em uma única mensagem (padrão: `3000` caracteres)
- `mediaMaxMb` - limite de upload/download de mídia (padrão: `20` MB)
- `overflowPolicy` - comportamento quando a mensagem excede o limite: `"split"` (padrão) ou `"stop"`

### Streaming

Yuanbao oferece suporte à saída de streaming em nível de bloco. Quando ativado, o bot envia texto em partes conforme gera.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Defina `disableBlockStreaming: true` para enviar a resposta completa em uma mensagem.

### Contexto do histórico de chats em grupo

Controle quantas mensagens históricas são incluídas no contexto de IA para chats em grupo:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Modo de resposta

Controle como o bot cita mensagens ao responder em chats em grupo:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Valor     | Comportamento                                             |
| --------- | ---------------------------------------------------------- |
| `"off"`   | Sem resposta com citação                                   |
| `"first"` | Cita apenas a primeira resposta por mensagem recebida (padrão) |
| `"all"`   | Cita todas as respostas                                    |

### Injeção de dica de Markdown

Por padrão, o bot injeta instruções no prompt do sistema para impedir que o modelo de IA envolva a resposta inteira em blocos de código markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Modo de depuração

Ative a saída de log não sanitizada para IDs de bot específicos:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Roteamento multiagente

Use `bindings` para rotear DMs ou grupos do Yuanbao para agentes diferentes.

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Campos de roteamento:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) ou `"group"` (chat em grupo)
- `match.peer.id`: ID de usuário ou código de grupo

---

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                              | Descrição                                         | Padrão                                 |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Ativar/desativar o canal                          | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Conta padrão para roteamento de saída             | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (usado para assinatura e geração de ticket) | -                                    |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (usado para assinatura)                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Token pré-assinado (ignora a assinatura automática de ticket) | -                         |
| `channels.yuanbao.accounts.<id>.name`      | Nome de exibição da conta                         | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Ativar/desativar uma conta específica             | `true`                                 |
| `channels.yuanbao.dm.policy`               | Política de DM                                    | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Lista de permissões de DM (lista de IDs de usuário) | -                                    |
| `channels.yuanbao.requireMention`          | Exigir @menção em grupos                          | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Tratamento de mensagens longas (`split` ou `stop`) | `split`                               |
| `channels.yuanbao.replyToMode`             | Estratégia de resposta com citação em grupos (`off`, `first`, `all`) | `first`              |
| `channels.yuanbao.outboundQueueStrategy`   | Estratégia de saída (`merge-text` ou `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: mínimo de caracteres para acionar o envio | `2800`                              |
| `channels.yuanbao.maxChars`                | Merge-text: máximo de caracteres por mensagem     | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: tempo limite de inatividade antes do auto-flush (ms) | `5000`              |
| `channels.yuanbao.mediaMaxMb`              | Limite de tamanho de mídia (MB)                   | `20`                                   |
| `channels.yuanbao.historyLimit`            | Entradas de contexto do histórico de chat em grupo | `100`                                 |
| `channels.yuanbao.disableBlockStreaming`   | Desativar saída de streaming em nível de bloco    | `false`                                |
| `channels.yuanbao.fallbackReply`           | Resposta de fallback quando a IA não retorna conteúdo | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Injetar instruções contra encapsulamento em markdown | `true`                              |
| `channels.yuanbao.debugBotIds`             | IDs de bot na lista de permissões de depuração (logs não sanitizados) | `[]`                |

---

## Tipos de mensagem compatíveis

### Receber

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio / Voz
- ✅ Vídeo
- ✅ Stickers / Emoji personalizado
- ✅ Elementos personalizados (cartões de link etc.)

### Enviar

- ✅ Texto (com suporte a markdown)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo
- ✅ Stickers

### Threads e respostas

- ✅ Respostas com citação (configurável via `replyToMode`)
- ❌ Respostas em thread (não compatível com a plataforma)

---

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chats em grupo e bloqueio por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
