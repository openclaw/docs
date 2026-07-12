---
read_when:
    - Você quer conectar um bot do Yuanbao
    - Você está configurando o canal Yuanbao
summary: Visão geral, recursos e configuração do bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-11T23:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao é a plataforma de assistente de IA da Tencent. O Plugin `openclaw-plugin-yuanbao`, mantido pela comunidade, conecta bots do Yuanbao ao OpenClaw via WebSocket para mensagens diretas e conversas em grupo.

**Status:** pronto para produção com mensagens diretas para bots e conversas em grupo. WebSocket é o único modo de conexão compatível. Este Plugin é mantido pela equipe do Tencent Yuanbao como uma entrada de catálogo externa, não pelo núcleo do OpenClaw; os detalhes de configuração e comportamento abaixo (além da instalação e da interface genérica da CLI) vêm da documentação do próprio Plugin e não foram verificados em relação ao código-fonte do núcleo do OpenClaw.

## Início rápido

Requer OpenClaw 2026.4.10 ou superior. Verifique com `openclaw --version`; atualize com `openclaw update`.

<Steps>
  <Step title="Add the Yuanbao channel with your credentials">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` usa `appKey:appSecret` separados por dois-pontos. Obtenha esses valores no aplicativo Yuanbao criando um bot nas configurações do aplicativo.
  </Step>

  <Step title="Restart the gateway to apply the change">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuração interativa (alternativa)

```bash
openclaw channels login --channel yuanbao
```

Siga as instruções para informar seu App ID e App Secret.

## Controle de acesso

### Mensagens diretas

`channels.yuanbao.dm.policy`:

| Valor            | Comportamento                                                    |
| ---------------- | ---------------------------------------------------------------- |
| `open` (padrão)  | Permite todos os usuários                                        |
| `pairing`        | Usuários desconhecidos recebem um código de pareamento; aprove pela CLI |
| `allowlist`      | Somente usuários em `allowFrom` podem conversar                  |
| `disabled`       | Desativa todas as mensagens diretas                              |

Aprove uma solicitação de pareamento:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Conversas em grupo

`channels.yuanbao.requireMention` (padrão `true`): exige uma @menção antes que o bot responda em um grupo. Responder à própria mensagem do bot é tratado como uma menção implícita.

## Exemplos de configuração

Configuração básica com política aberta para mensagens diretas:

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

Restrinja mensagens diretas a usuários específicos:

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

Desative a exigência de @menção em grupos:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Ajuste da entrega de saída:

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

Defina `outboundQueueStrategy: "immediate"` para enviar cada segmento sem armazenamento em buffer.

## Comandos comuns

| Comando    | Descrição                         |
| ---------- | --------------------------------- |
| `/help`    | Mostra os comandos disponíveis    |
| `/status`  | Mostra o status do bot            |
| `/new`     | Inicia uma nova sessão            |
| `/stop`    | Interrompe a execução atual       |
| `/restart` | Reinicia o OpenClaw               |
| `/compact` | Compacta o contexto da sessão     |

O Yuanbao oferece suporte a menus nativos de comandos com barra; os comandos são sincronizados automaticamente com a plataforma quando o Gateway é iniciado.

## Solução de problemas

**O bot não responde em conversas em grupo:**

1. Confirme que o bot foi adicionado ao grupo
2. Confirme que você @mencionou o bot (exigido por padrão)
3. Verifique os logs: `openclaw logs --follow`

**O bot não recebe mensagens:**

1. Confirme que o bot foi criado e aprovado no aplicativo Yuanbao
2. Confirme que `appKey` e `appSecret` estão configurados corretamente
3. Confirme que o Gateway está em execução: `openclaw gateway status`
4. Verifique os logs: `openclaw logs --follow`

**O bot envia respostas vazias ou alternativas:**

1. Verifique se o modelo de IA está retornando conteúdo válido
2. Resposta alternativa padrão: "暂时无法解答，你可以换个问题问问我哦"
3. Personalize com `channels.yuanbao.fallbackReply`

**O App Secret vazou:**

1. Redefina o App Secret no aplicativo Yuanbao
2. Atualize o valor na sua configuração
3. Reinicie o Gateway: `openclaw gateway restart`

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

`defaultAccount` controla qual conta é usada quando as APIs de saída não especificam um `accountId`.

### Limites de mensagens

- `maxChars`: número máximo de caracteres de uma única mensagem (padrão `3000`)
- `mediaMaxMb`: limite para upload/download de mídia (padrão `20` MB)
- `overflowPolicy`: comportamento quando uma mensagem excede o limite, `"split"` (padrão) ou `"stop"`

### Transmissão contínua

O Yuanbao oferece suporte a saída em transmissão contínua no nível de blocos; o bot envia o texto em segmentos conforme ele é gerado.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Defina `disableBlockStreaming: true` para enviar a resposta completa em uma única mensagem.

### Contexto do histórico de conversas em grupo

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

Controla quantas mensagens do histórico são incluídas no contexto da IA para conversas em grupo.

### Modo de resposta com citação

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Valor   | Comportamento                                                        |
| ------- | -------------------------------------------------------------------- |
| `off`   | Não cita a mensagem na resposta                                      |
| `first` | Cita somente a primeira resposta de cada mensagem recebida (padrão)  |
| `all`   | Cita todas as respostas                                               |

### Injeção de orientação sobre Markdown

Por padrão, o bot injeta uma instrução no prompt do sistema para impedir que o modelo envolva toda a resposta em um bloco de código Markdown.

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

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Ativa a saída de logs sem sanitização para os IDs de bot listados.

### Roteamento entre vários agentes

Use `bindings` para encaminhar mensagens diretas ou grupos do Yuanbao a agentes diferentes:

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

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (mensagem direta) ou `"group"` (conversa em grupo)
- `match.peer.id`: ID do usuário ou código do grupo

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                | Descrição                                                       | Padrão                                 |
| ------------------------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                  | Ativa/desativa o canal                                          | `true`                                 |
| `channels.yuanbao.defaultAccount`           | Conta padrão para roteamento de saída                            | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`     | App Key (assinatura + geração de tíquete)                        | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret`  | App Secret (assinatura)                                         | -                                      |
| `channels.yuanbao.accounts.<id>.token`      | Token pré-assinado (ignora a assinatura automática de tíquete)  | -                                      |
| `channels.yuanbao.accounts.<id>.name`       | Nome de exibição da conta                                       | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`    | Ativa/desativa uma conta específica                             | `true`                                 |
| `channels.yuanbao.dm.policy`                | Política de mensagens diretas                                   | `open`                                 |
| `channels.yuanbao.dm.allowFrom`             | Lista de permissões de mensagens diretas (lista de IDs de usuário) | -                                   |
| `channels.yuanbao.requireMention`           | Exige @menção em grupos                                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`           | Tratamento de mensagens longas (`split` ou `stop`)               | `split`                                |
| `channels.yuanbao.replyToMode`              | Estratégia de resposta com citação em grupos (`off`, `first`, `all`) | `first`                            |
| `channels.yuanbao.outboundQueueStrategy`    | Estratégia de saída (`merge-text` ou `immediate`)                | `merge-text`                           |
| `channels.yuanbao.minChars`                 | Mesclagem de texto: mínimo de caracteres para acionar o envio    | `2800`                                 |
| `channels.yuanbao.maxChars`                 | Mesclagem de texto: máximo de caracteres por mensagem            | `3000`                                 |
| `channels.yuanbao.idleMs`                   | Mesclagem de texto: tempo limite de inatividade antes do envio automático (ms) | `5000`                    |
| `channels.yuanbao.mediaMaxMb`               | Limite de tamanho de mídia (MB)                                  | `20`                                   |
| `channels.yuanbao.historyLimit`             | Entradas de contexto do histórico de conversas em grupo          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`    | Desativa a saída em transmissão contínua no nível de blocos      | `false`                                |
| `channels.yuanbao.fallbackReply`            | Resposta alternativa quando o modelo não retorna conteúdo        | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`      | Injeta instruções para evitar que toda a resposta seja envolvida em Markdown | `true`                      |
| `channels.yuanbao.debugBotIds`              | IDs de bot na lista de permissões de depuração (logs sem sanitização) | `[]`                              |

## Tipos de mensagem compatíveis

**Recebimento:** texto, imagens, arquivos, áudio/voz, vídeo, figurinhas/emojis personalizados e elementos personalizados (cartões de link).

**Envio:** texto (Markdown), imagens, arquivos, áudio, vídeo e figurinhas.

**Tópicos e respostas:** respostas com citação (configuráveis por `replyToMode`); a plataforma não oferece suporte a respostas em tópicos.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção adicional
