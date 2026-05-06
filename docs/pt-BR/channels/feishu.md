---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-06T09:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2498c3b800563105c00345426a70a95914486633a07894cd74dbe487b167a6f4
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark é uma plataforma de colaboração tudo-em-um em que equipes conversam, compartilham documentos, gerenciam calendários e trabalham juntas.

**Status:** pronto para produção para DMs de bot + chats em grupo. WebSocket é o modo padrão; o modo Webhook é opcional.

---

## Início rápido

<Note>
Requer OpenClaw 2026.4.25 ou superior. Execute `openclaw --version` para verificar. Atualize com `openclaw update`.
</Note>

<Steps>
  <Step title="Execute o assistente de configuração do canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escaneie o código QR com seu app móvel Feishu/Lark para criar automaticamente um bot Feishu/Lark.
  </Step>
  
  <Step title="Depois que a configuração for concluída, reinicie o gateway para aplicar as alterações">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controle de acesso

### Mensagens diretas

Configure `dmPolicy` para controlar quem pode enviar DM ao bot:

- `"pairing"` - usuários desconhecidos recebem um código de pareamento; aprove via CLI
- `"allowlist"` - somente usuários listados em `allowFrom` podem conversar (padrão: apenas o proprietário do bot)
- `"open"` - permite DMs públicas somente quando `allowFrom` inclui `"*"`; com entradas restritivas, apenas usuários correspondentes podem conversar
- `"disabled"` - desativa todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats em grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responder a todas as mensagens em grupos                                                            |
| `"allowlist"` | Responder somente a grupos em `groupAllowFrom` ou configurados explicitamente em `groups.<chat_id>` |
| `"disabled"`  | Desativar todas as mensagens de grupo; entradas explícitas em `groups.<chat_id>` não substituem isto         |

Padrão: `allowlist`

**Requisito de menção** (`channels.feishu.requireMention`):

- `true` - exige @menção (padrão)
- `false` - responde sem @menção
- Substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` e `@_all` somente para transmissão não são tratados como menções ao bot. Uma mensagem que menciona tanto `@all` quanto o bot diretamente ainda conta como uma menção ao bot.

---

## Exemplos de configuração de grupo

### Permitir todos os grupos, sem @menção obrigatória

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Permitir todos os grupos, ainda exigindo @menção

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

No modo `allowlist`, você também pode admitir um grupo adicionando uma entrada explícita `groups.<chat_id>`. Entradas explícitas não substituem `groupPolicy: "disabled"`. Padrões com curinga em `groups.*` configuram grupos correspondentes, mas não admitem grupos por si só.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
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
          // User open_ids look like: ou_xxx
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

Abra o grupo no Feishu/Lark, clique no ícone de menu no canto superior direito e acesse **Configurações**. O ID do grupo (`chat_id`) está listado na página de configurações.

![Obter ID do grupo](/images/feishu-get-group-id.png)

### IDs de usuário (`open_id`, formato: `ou_xxx`)

Inicie o gateway, envie uma DM para o bot e então verifique os logs:

```bash
openclaw logs --follow
```

Procure por `open_id` na saída do log. Você também pode verificar solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição                 |
| --------- | --------------------------- |
| `/status` | Mostrar status do bot             |
| `/reset`  | Redefinir a sessão atual   |
| `/model`  | Mostrar ou alternar o modelo de IA |

<Note>
Feishu/Lark não oferece suporte a menus nativos de comandos de barra, então envie esses comandos como mensagens de texto simples.
</Note>

---

## Solução de problemas

### O bot não responde em chats em grupo

1. Verifique se o bot foi adicionado ao grupo
2. Verifique se você @menciona o bot (exigido por padrão)
3. Verifique se `groupPolicy` não é `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Verifique se o bot foi publicado e aprovado na Feishu Open Platform / Lark Developer
2. Verifique se a assinatura de eventos inclui `im.message.receive_v1`
3. Verifique se a **conexão persistente** (WebSocket) está selecionada
4. Verifique se todos os escopos de permissão necessários foram concedidos
5. Verifique se o gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### App Secret vazado

1. Redefina o App Secret na Feishu Open Platform / Lark Developer
2. Atualize o valor na sua configuração
3. Reinicie o gateway: `openclaw gateway restart`

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qual conta é usada quando APIs de saída não especificam um `accountId`.
`accounts.<id>.tts` usa o mesmo formato de `messages.tts` e faz merge profundo sobre
a configuração global de TTS, para que configurações Feishu com vários bots possam manter
credenciais compartilhadas de provedores globalmente enquanto substituem apenas voz, modelo, persona ou modo automático
por conta.

### Limites de mensagem

- `textChunkLimit` - tamanho do trecho de texto de saída (padrão: `2000` caracteres)
- `mediaMaxMb` - limite de upload/download de mídia (padrão: `30` MB)

### Streaming

Feishu/Lark oferece suporte a respostas em streaming por meio de cartões interativos. Quando ativado, o bot atualiza o cartão em tempo real enquanto gera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Defina `streaming: false` para enviar a resposta completa em uma mensagem. `blockStreaming` fica desativado por padrão; ative-o somente quando quiser que blocos concluídos do assistente sejam enviados antes da resposta final.

### Otimização de cota

Reduza o número de chamadas à API Feishu/Lark com duas flags opcionais:

- `typingIndicator` (padrão `true`): defina como `false` para ignorar chamadas de reação de digitação
- `resolveSenderNames` (padrão `true`): defina como `false` para ignorar consultas de perfil do remetente

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

Feishu/Lark oferece suporte a ACP para DMs e mensagens de thread em grupo. O ACP do Feishu/Lark é orientado por comandos de texto - não há menus nativos de comandos de barra, então use mensagens `/acp ...` diretamente na conversa.

#### Associação persistente de ACP

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

#### Gerar ACP pelo chat

Em uma DM ou thread do Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens de thread do Feishu/Lark. Mensagens de acompanhamento na conversa associada são roteadas diretamente para essa sessão ACP.

### Roteamento multiagente

Use `bindings` para rotear DMs ou grupos do Feishu/Lark para diferentes agentes.

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
- `match.peer.id`: Open ID de usuário (`ou_xxx`) ou ID de grupo (`oc_xxx`)

Consulte [Obter IDs de grupo/usuário](#get-groupuser-ids) para dicas de consulta.

---

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                      | Descrição                                                                                         | Padrão           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Habilita/desabilita o canal                                                                       | `true`           |
| `channels.feishu.domain`                          | Domínio da API (`feishu` ou `lark`)                                                               | `feishu`         |
| `channels.feishu.connectionMode`                  | Transporte de eventos (`websocket` ou `webhook`)                                                  | `websocket`      |
| `channels.feishu.defaultAccount`                  | Conta padrão para roteamento de saída                                                             | `default`        |
| `channels.feishu.verificationToken`               | Obrigatório para o modo webhook                                                                   | -                |
| `channels.feishu.encryptKey`                      | Obrigatório para o modo webhook                                                                   | -                |
| `channels.feishu.webhookPath`                     | Caminho da rota de Webhook                                                                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de vinculação do Webhook                                                                     | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta de vinculação do Webhook                                                                    | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID do app                                                                                         | -                |
| `channels.feishu.accounts.<id>.appSecret`         | Segredo do app                                                                                    | -                |
| `channels.feishu.accounts.<id>.domain`            | Substituição de domínio por conta                                                                 | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Substituição de TTS por conta                                                                     | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Política de DM                                                                                    | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista de permissões de DM (lista de open_id)                                                      | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Política de grupo                                                                                 | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista de permissões de grupo                                                                      | -                |
| `channels.feishu.requireMention`                  | Exigir @menção em grupos                                                                          | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Substituição de @menção por grupo; IDs explícitos também admitem o grupo no modo de lista de permissões | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Habilita/desabilita um grupo específico                                                           | `true`           |
| `channels.feishu.textChunkLimit`                  | Tamanho do fragmento da mensagem                                                                  | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de tamanho de mídia                                                                        | `30`             |
| `channels.feishu.streaming`                       | Saída de cartão em streaming                                                                      | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming de resposta de bloco concluído                                                          | `false`          |
| `channels.feishu.typingIndicator`                 | Enviar reações de digitação                                                                       | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolver nomes de exibição dos remetentes                                                         | `true`           |

---

## Tipos de mensagem compatíveis

### Receber

- ✅ Texto
- ✅ Rich text (post)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Figurinhas

As mensagens de áudio recebidas do Feishu/Lark são normalizadas como placeholders de mídia em vez
de JSON `file_key` bruto. Quando `tools.media.audio` está configurado, o OpenClaw
baixa o recurso de nota de voz e executa a transcrição de áudio compartilhada antes da
vez do agente, para que o agente receba a transcrição falada. Se o Feishu incluir
texto de transcrição diretamente no payload de áudio, esse texto será usado sem outra
chamada de ASR. Sem um provedor de transcrição de áudio, o agente ainda recebe um
placeholder `<media:audio>` mais o anexo salvo, não o payload bruto do recurso
do Feishu.

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos (incluindo atualizações em streaming)
- ⚠️ Rich text (formatação no estilo post; não oferece suporte completo aos recursos de autoria do Feishu/Lark)

Os balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu e exigem
mídia enviada em Ogg/Opus (`file_type: "opus"`). Mídias `.opus` e `.ogg` existentes
são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros formatos de áudio prováveis são
transcodificados para Ogg/Opus a 48 kHz com `ffmpeg` somente quando a resposta solicita entrega
por voz (`audioAsVoice` / ferramenta de mensagem `asVoice`, incluindo respostas de nota de voz
TTS). Anexos MP3 comuns continuam como arquivos normais. Se `ffmpeg` estiver ausente ou
a conversão falhar, o OpenClaw usa um anexo de arquivo como fallback e registra o motivo.

### Threads e respostas

- ✅ Respostas inline
- ✅ Respostas em thread
- ✅ Respostas de mídia continuam cientes da thread ao responder a uma mensagem em thread

Para `groupSessionScope: "group_topic"` e `"group_topic_sender"`, grupos de tópico nativos
do Feishu/Lark usam o `thread_id` (`omt_*`) do evento como a chave canônica da sessão
do tópico. Se um evento inicial de tópico nativo omitir `thread_id`, o OpenClaw
o hidrata a partir do Feishu antes de rotear a vez. Respostas normais de grupo que
o OpenClaw transforma em threads continuam usando o ID da mensagem raiz da resposta (`om_*`) para que a
primeira vez e a vez de acompanhamento permaneçam na mesma sessão.

---

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
