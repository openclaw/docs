---
read_when:
    - Você quer conectar um bot do Yuanbao
    - Você está configurando o canal Yuanbao
summary: Visão geral, recursos e configuração do bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T15:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao é a plataforma de assistente de IA da Tencent. O plugin `openclaw-plugin-yuanbao`, mantido pela comunidade, conecta bots do Yuanbao ao OpenClaw por WebSocket para mensagens diretas e conversas em grupo.

**Status:** pronto para produção para DMs com bots e conversas em grupo. WebSocket é o único modo de conexão compatível. Este plugin é mantido pela equipe do Tencent Yuanbao como uma entrada de catálogo externa, não pelo núcleo do OpenClaw; os detalhes de configuração/comportamento abaixo (além da instalação e da superfície genérica da CLI) vêm da própria documentação do plugin e não foram verificados em relação ao código-fonte do núcleo do OpenClaw.

## Início rápido

Requer OpenClaw 2026.4.10 ou superior. Verifique com `openclaw --version`; atualize com `openclaw update`.

<Steps>
  <Step title="Adicione o canal Yuanbao com suas credenciais">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` usa `appKey:appSecret` separados por dois-pontos. Obtenha-os no aplicativo Yuanbao criando um bot nas configurações do seu aplicativo.
  </Step>

  <Step title="Reinicie o Gateway para aplicar a alteração">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Configuração interativa (alternativa)

```bash
openclaw channels login --channel yuanbao
```

Siga as instruções para inserir seu App ID e App Secret.

## Controle de acesso

### Mensagens diretas

`channels.yuanbao.dm.policy`:

| Valor            | Comportamento                                                   |
| ---------------- | --------------------------------------------------------------- |
| `open` (padrão)  | Permite todos os usuários                                       |
| `pairing`        | Usuários desconhecidos recebem um código de pareamento; aprove pela CLI |
| `allowlist`      | Apenas usuários em `allowFrom` podem conversar                  |
| `disabled`       | Desativa todas as DMs                                           |

Aprove uma solicitação de pareamento:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Conversas em grupo

`channels.yuanbao.requireMention` (padrão `true`): exige uma @menção antes que o bot responda em um grupo. Responder à própria mensagem do bot é tratado como uma menção implícita.

## Exemplos de configuração

Configuração básica, política de DM aberta:

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

Restrinja DMs a usuários específicos:

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
      minChars: 2800, // armazena no buffer até atingir esta quantidade de caracteres
      maxChars: 3000, // força a divisão acima deste limite
      idleMs: 5000, // envia automaticamente após o tempo limite de inatividade (ms)
    },
  },
}
```

Defina `outboundQueueStrategy: "immediate"` para enviar cada fragmento sem armazenamento em buffer.

## Comandos comuns

| Comando    | Descrição                       |
| ---------- | ------------------------------- |
| `/help`    | Mostra os comandos disponíveis  |
| `/status`  | Mostra o status do bot          |
| `/new`     | Inicia uma nova sessão          |
| `/stop`    | Interrompe a execução atual     |
| `/restart` | Reinicia o OpenClaw             |
| `/compact` | Compacta o contexto da sessão   |

O Yuanbao oferece suporte a menus nativos de comandos com barra; os comandos são sincronizados automaticamente com a plataforma quando o Gateway é iniciado.

## Solução de problemas

**O bot não responde em conversas em grupo:**

1. Confirme que o bot foi adicionado ao grupo
2. Confirme que você fez uma @menção ao bot (exigida por padrão)
3. Verifique os logs: `openclaw logs --follow`

**O bot não recebe mensagens:**

1. Confirme que o bot foi criado e aprovado no aplicativo Yuanbao
2. Confirme que `appKey` e `appSecret` estão configurados corretamente
3. Confirme que o Gateway está em execução: `openclaw gateway status`
4. Verifique os logs: `openclaw logs --follow`

**O bot envia respostas vazias ou de contingência:**

1. Verifique se o modelo de IA está retornando conteúdo válido
2. Resposta de contingência padrão: "暂时无法解答，你可以换个问题问问我哦"
3. Personalize com `channels.yuanbao.fallbackReply`

**App Secret exposto:**

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
          name: "Bot principal",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Bot de backup",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qual conta é usada quando as APIs de saída não especificam um `accountId`.

### Limites de mensagens

- `maxChars`: quantidade máxima de caracteres por mensagem (padrão `3000`)
- `mediaMaxMb`: limite de upload/download de mídia (padrão `20` MB)
- `overflowPolicy`: comportamento quando uma mensagem excede o limite, `"split"` (padrão) ou `"stop"`

### Streaming

O Yuanbao oferece saída em streaming no nível de blocos; o bot envia o texto em fragmentos à medida que o gera.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // streaming em blocos ativado (padrão)
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
      historyLimit: 100, // padrão: 100, defina como 0 para desativar
    },
  },
}
```

Controla quantas mensagens históricas são incluídas no contexto da IA para conversas em grupo.

### Modo de resposta

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (padrão: "first")
    },
  },
}
```

| Valor   | Comportamento                                                        |
| ------- | --------------------------------------------------------------------- |
| `off`   | Sem resposta com citação                                              |
| `first` | Cita apenas a primeira resposta por mensagem recebida (padrão)        |
| `all`   | Cita todas as respostas                                               |

### Injeção de dica de Markdown

Por padrão, o bot injeta uma instrução no prompt do sistema para impedir que o modelo envolva a resposta inteira em um bloco de código Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // padrão: true
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

Use `bindings` para encaminhar DMs ou grupos do Yuanbao a diferentes agentes:

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
- `match.peer.kind`: `"direct"` (DM) ou `"group"` (conversa em grupo)
- `match.peer.id`: ID do usuário ou código do grupo

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                | Descrição                                                        | Padrão                                 |
| ------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                  | Ativa/desativa o canal                                           | `true`                                 |
| `channels.yuanbao.defaultAccount`           | Conta padrão para roteamento de saída                            | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`     | App Key (assinatura + geração de ticket)                         | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret`  | App Secret (assinatura)                                          | -                                      |
| `channels.yuanbao.accounts.<id>.token`      | Token pré-assinado (ignora a assinatura automática de tickets)  | -                                      |
| `channels.yuanbao.accounts.<id>.name`       | Nome de exibição da conta                                        | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`    | Ativa/desativa uma conta específica                              | `true`                                 |
| `channels.yuanbao.dm.policy`                | Política de DM                                                   | `open`                                 |
| `channels.yuanbao.dm.allowFrom`             | Lista de permissões de DM (lista de IDs de usuário)              | -                                      |
| `channels.yuanbao.requireMention`           | Exige @menção em grupos                                          | `true`                                 |
| `channels.yuanbao.overflowPolicy`           | Tratamento de mensagens longas (`split` ou `stop`)               | `split`                                |
| `channels.yuanbao.replyToMode`              | Estratégia de resposta em grupo (`off`, `first`, `all`)          | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`    | Estratégia de saída (`merge-text` ou `immediate`)                | `merge-text`                           |
| `channels.yuanbao.minChars`                 | Merge-text: mínimo de caracteres para acionar o envio            | `2800`                                 |
| `channels.yuanbao.maxChars`                 | Merge-text: máximo de caracteres por mensagem                    | `3000`                                 |
| `channels.yuanbao.idleMs`                   | Merge-text: tempo limite de inatividade antes do envio automático (ms) | `5000`                          |
| `channels.yuanbao.mediaMaxMb`               | Limite de tamanho de mídia (MB)                                  | `20`                                   |
| `channels.yuanbao.historyLimit`             | Entradas de contexto do histórico de conversas em grupo          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`    | Desativa a saída em streaming no nível de blocos                 | `false`                                |
| `channels.yuanbao.fallbackReply`            | Resposta de contingência quando o modelo não retorna conteúdo    | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`      | Injeta instruções para evitar o encapsulamento em Markdown       | `true`                                 |
| `channels.yuanbao.debugBotIds`              | IDs de bot na lista de permissões de depuração (logs sem sanitização) | `[]`                             |

## Tipos de mensagem compatíveis

**Recebimento:** texto, imagens, arquivos, áudio/voz, vídeo, figurinhas/emojis personalizados, elementos personalizados (cartões de link).

**Envio:** texto (Markdown), imagens, arquivos, áudio, vídeo, figurinhas.

**Threads e respostas:** respostas com citação (configuráveis por `replyToMode`); respostas em threads não são compatíveis com a plataforma.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
