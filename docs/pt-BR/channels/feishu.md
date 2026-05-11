---
read_when:
    - Você deseja conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark é uma plataforma de colaboração tudo em um onde equipes conversam, compartilham documentos, gerenciam calendários e trabalham juntas.

**Status:** pronto para produção para DMs de bots + chats em grupo. WebSocket é o modo padrão; o modo webhook é opcional.

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
  Escolha a configuração manual para colar um App ID e App Secret da Feishu Open Platform, ou escolha a configuração por QR para criar um bot automaticamente. Se o aplicativo móvel doméstico Feishu não reagir ao código QR, execute a configuração novamente e escolha a configuração manual.
  </Step>
  
  <Step title="Após a conclusão da configuração, reinicie o gateway para aplicar as alterações">
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
- `"allowlist"` - somente usuários listados em `allowFrom` podem conversar (padrão: somente o proprietário do bot)
- `"open"` - permite DMs públicas somente quando `allowFrom` inclui `"*"`; com entradas restritivas, somente usuários correspondentes podem conversar
- `"disabled"` - desativa todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats em grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamento                                                                               |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responde a todas as mensagens em grupos                                                      |
| `"allowlist"` | Responde somente a grupos em `groupAllowFrom` ou configurados explicitamente em `groups.<chat_id>` |
| `"disabled"`  | Desativa todas as mensagens de grupo; entradas explícitas `groups.<chat_id>` não substituem isso |

Padrão: `allowlist`

**Requisito de menção** (`channels.feishu.requireMention`):

- `true` - exige @menção (padrão)
- `false` - responde sem @menção
- Substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` e `@_all` somente de broadcast não são tratados como menções ao bot. Uma mensagem que menciona tanto `@all` quanto o bot diretamente ainda conta como menção ao bot.

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

### Permitir todos os grupos, ainda exigir @menção

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

### Permitir somente grupos específicos

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

No modo `allowlist`, você também pode admitir um grupo adicionando uma entrada explícita `groups.<chat_id>`. Entradas explícitas não substituem `groupPolicy: "disabled"`. Padrões curinga em `groups.*` configuram grupos correspondentes, mas não admitem grupos por conta própria.

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

Abra o grupo no Feishu/Lark, clique no ícone de menu no canto superior direito e acesse **Configurações**. O ID do grupo (`chat_id`) é listado na página de configurações.

![Obter ID do grupo](/images/feishu-get-group-id.png)

### IDs de usuário (`open_id`, formato: `ou_xxx`)

Inicie o gateway, envie uma DM ao bot e verifique os logs:

```bash
openclaw logs --follow
```

Procure `open_id` na saída do log. Você também pode verificar solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição                    |
| --------- | ---------------------------- |
| `/status` | Mostra o status do bot       |
| `/reset`  | Redefine a sessão atual      |
| `/model`  | Mostra ou troca o modelo de IA |

<Note>
Feishu/Lark não oferece suporte a menus nativos de comandos com barra, então envie-os como mensagens de texto simples.
</Note>

---

## Solução de problemas

### O bot não responde em chats em grupo

1. Verifique se o bot foi adicionado ao grupo
2. Verifique se você @mencionou o bot (obrigatório por padrão)
3. Verifique se `groupPolicy` não é `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Verifique se o bot está publicado e aprovado na Feishu Open Platform / Lark Developer
2. Verifique se a assinatura de eventos inclui `im.message.receive_v1`
3. Verifique se **conexão persistente** (WebSocket) está selecionada
4. Verifique se todos os escopos de permissão necessários foram concedidos
5. Verifique se o gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### A configuração por QR não reage no aplicativo móvel Feishu

1. Execute a configuração novamente: `openclaw channels login --channel feishu`
2. Escolha a configuração manual
3. Na Feishu Open Platform, crie um app autoconstruído e copie seu App ID e App Secret
4. Cole essas credenciais no assistente de configuração

### App Secret vazou

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
a configuração global de TTS, para que configurações Feishu com vários bots possam manter credenciais
compartilhadas de provedores globalmente enquanto substituem apenas voz, modelo, persona ou modo automático
por conta.

### Limites de mensagens

- `textChunkLimit` - tamanho do bloco de texto de saída (padrão: `2000` caracteres)
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

Reduza o número de chamadas à API do Feishu/Lark com duas flags opcionais:

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

Feishu/Lark oferece suporte a ACP para DMs e mensagens de threads em grupo. O ACP do Feishu/Lark é orientado por comandos de texto - não há menus nativos de comandos com barra, então use mensagens `/acp ...` diretamente na conversa.

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

#### Gerar ACP a partir do chat

Em uma DM ou thread do Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens de thread do Feishu/Lark. Mensagens de acompanhamento na conversa vinculada são roteadas diretamente para essa sessão ACP.

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
- `match.peer.id`: Open ID do usuário (`ou_xxx`) ou ID do grupo (`oc_xxx`)

Consulte [Obter IDs de grupo/usuário](#get-groupuser-ids) para dicas de consulta.

---

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                      | Descrição                                                                        | Padrão           |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Ativa/desativa o canal                                                           | `true`           |
| `channels.feishu.domain`                          | Domínio da API (`feishu` ou `lark`)                                              | `feishu`         |
| `channels.feishu.connectionMode`                  | Transporte de eventos (`websocket` ou `webhook`)                                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | Conta padrão para roteamento de saída                                            | `default`        |
| `channels.feishu.verificationToken`               | Obrigatório para o modo Webhook                                                  | -                |
| `channels.feishu.encryptKey`                      | Obrigatório para o modo Webhook                                                  | -                |
| `channels.feishu.webhookPath`                     | Caminho da rota do Webhook                                                       | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de vinculação do Webhook                                                    | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta de vinculação do Webhook                                                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID do aplicativo                                                                 | -                |
| `channels.feishu.accounts.<id>.appSecret`         | Segredo do aplicativo                                                            | -                |
| `channels.feishu.accounts.<id>.domain`            | Substituição de domínio por conta                                                | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Substituição de TTS por conta                                                    | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Política de DM                                                                   | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista de permissões de DM (lista de open_id)                                     | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Política de grupos                                                               | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista de permissões de grupos                                                    | -                |
| `channels.feishu.requireMention`                  | Exigir @menção em grupos                                                         | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Substituição de @menção por grupo; IDs explícitos também admitem o grupo no modo de lista de permissões | herdado          |
| `channels.feishu.groups.<chat_id>.enabled`        | Ativa/desativa um grupo específico                                               | `true`           |
| `channels.feishu.textChunkLimit`                  | Tamanho do fragmento de mensagem                                                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de tamanho de mídia                                                       | `30`             |
| `channels.feishu.streaming`                       | Saída de cartão em streaming                                                     | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming de resposta em blocos concluídos                                       | `false`          |
| `channels.feishu.typingIndicator`                 | Enviar reações de digitação                                                      | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolver nomes de exibição dos remetentes                                        | `true`           |

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

Mensagens de áudio recebidas do Feishu/Lark são normalizadas como placeholders de mídia em vez
de JSON `file_key` bruto. Quando `tools.media.audio` está configurado, o OpenClaw
baixa o recurso da nota de voz e executa a transcrição de áudio compartilhada antes do
turno do agente, para que o agente receba a transcrição falada. Se o Feishu incluir
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
- ⚠️ Rich text (formatação no estilo post; não oferece suporte a todos os recursos de autoria do Feishu/Lark)

Balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu e exigem
mídia enviada em Ogg/Opus (`file_type: "opus"`). Mídias `.opus` e `.ogg` existentes
são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros formatos de áudio prováveis são
transcodificados para Ogg/Opus a 48 kHz com `ffmpeg` somente quando a resposta solicita entrega
por voz (`audioAsVoice` / ferramenta de mensagem `asVoice`, incluindo respostas de nota de voz
por TTS). Anexos MP3 comuns permanecem como arquivos regulares. Se `ffmpeg` estiver ausente ou
a conversão falhar, o OpenClaw recorre a um anexo de arquivo e registra o motivo.

### Threads e respostas

- ✅ Respostas embutidas
- ✅ Respostas em threads
- ✅ Respostas de mídia continuam cientes da thread ao responder a uma mensagem de thread

Para `groupSessionScope: "group_topic"` e `"group_topic_sender"`, grupos de tópicos nativos
do Feishu/Lark usam o `thread_id` do evento (`omt_*`) como a chave canônica
da sessão do tópico. Se um evento iniciador de tópico nativo omitir `thread_id`, o OpenClaw
o hidrata a partir do Feishu antes de rotear o turno. Respostas normais em grupo que
o OpenClaw transforma em threads continuam usando o ID da mensagem raiz da resposta (`om_*`), para que o
primeiro turno e o turno de acompanhamento permaneçam na mesma sessão.

---

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chats em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e endurecimento
