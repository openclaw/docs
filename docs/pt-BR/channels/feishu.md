---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-30T09:35:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark é uma plataforma de colaboração completa em que equipes conversam, compartilham documentos, gerenciam calendários e realizam o trabalho em conjunto.

**Status:** pronto para produção para DMs de bot + conversas em grupo. WebSocket é o modo padrão; o modo Webhook é opcional.

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
  Escaneie o código QR com seu app móvel Feishu/Lark para criar um bot Feishu/Lark automaticamente.
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

- `"pairing"` — usuários desconhecidos recebem um código de pareamento; aprove via CLI
- `"allowlist"` — somente usuários listados em `allowFrom` podem conversar (padrão: somente o proprietário do bot)
- `"open"` — permite DMs públicas somente quando `allowFrom` inclui `"*"`; com entradas restritivas, somente usuários correspondentes podem conversar
- `"disabled"` — desativa todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Conversas em grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responder a todas as mensagens em grupos                                                            |
| `"allowlist"` | Responder somente a grupos em `groupAllowFrom` ou configurados explicitamente em `groups.<chat_id>` |
| `"disabled"`  | Desativar todas as mensagens de grupo; entradas explícitas em `groups.<chat_id>` não substituem isso         |

Padrão: `allowlist`

**Exigência de menção** (`channels.feishu.requireMention`):

- `true` — exigir @menção (padrão)
- `false` — responder sem @menção
- Substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` e `@_all` somente de broadcast não são tratados como menções ao bot. Uma mensagem que menciona tanto `@all` quanto o bot diretamente ainda conta como menção ao bot.

---

## Exemplos de configuração de grupos

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

No modo `allowlist`, você também pode admitir um grupo adicionando uma entrada explícita `groups.<chat_id>`. Entradas explícitas não substituem `groupPolicy: "disabled"`. Padrões curingas em `groups.*` configuram grupos correspondentes, mas não admitem grupos por si só.

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

Abra o grupo no Feishu/Lark, clique no ícone de menu no canto superior direito e vá para **Configurações**. O ID do grupo (`chat_id`) está listado na página de configurações.

![Obter ID do grupo](/images/feishu-get-group-id.png)

### IDs de usuário (`open_id`, formato: `ou_xxx`)

Inicie o Gateway, envie uma DM ao bot e verifique os logs:

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
| `/model`  | Mostrar ou trocar o modelo de IA |

<Note>
Feishu/Lark não oferece suporte a menus nativos de comandos com barra, então envie-os como mensagens de texto simples.
</Note>

---

## Solução de problemas

### O bot não responde em conversas em grupo

1. Certifique-se de que o bot foi adicionado ao grupo
2. Certifique-se de @mencionar o bot (exigido por padrão)
3. Verifique se `groupPolicy` não é `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Certifique-se de que o bot foi publicado e aprovado no Feishu Open Platform / Lark Developer
2. Certifique-se de que a assinatura de eventos inclui `im.message.receive_v1`
3. Certifique-se de que **conexão persistente** (WebSocket) está selecionada
4. Certifique-se de que todos os escopos de permissão obrigatórios foram concedidos
5. Certifique-se de que o Gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### App Secret vazou

1. Redefina o App Secret no Feishu Open Platform / Lark Developer
2. Atualize o valor na sua configuração
3. Reinicie o Gateway: `openclaw gateway restart`

---

## Configuração avançada

### Múltiplas contas

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
`accounts.<id>.tts` usa o mesmo formato de `messages.tts` e faz mesclagem profunda sobre
a configuração global de TTS, para que configurações Feishu com vários bots possam manter credenciais
de provedor compartilhadas globalmente enquanto substituem apenas voz, modelo, persona ou modo automático
por conta.

### Limites de mensagens

- `textChunkLimit` — tamanho de bloco de texto de saída (padrão: `2000` caracteres)
- `mediaMaxMb` — limite de upload/download de mídia (padrão: `30` MB)

### Streaming

Feishu/Lark oferece suporte a respostas em streaming via cards interativos. Quando ativado, o bot atualiza o card em tempo real enquanto gera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Defina `streaming: false` para enviar a resposta completa em uma única mensagem.

### Otimização de cota

Reduza o número de chamadas à API do Feishu/Lark com dois sinalizadores opcionais:

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

Feishu/Lark oferece suporte a ACP para DMs e mensagens de threads de grupo. O ACP do Feishu/Lark é acionado por comandos de texto — não há menus nativos de comandos com barra, então use mensagens `/acp ...` diretamente na conversa.

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

#### Gerar ACP pelo chat

Em uma DM ou thread do Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens de thread do Feishu/Lark. Mensagens seguintes na conversa vinculada são roteadas diretamente para essa sessão ACP.

### Roteamento multiagente

Use `bindings` para rotear DMs ou grupos do Feishu/Lark para agentes diferentes.

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
- `match.peer.kind`: `"direct"` (DM) ou `"group"` (conversa em grupo)
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
| `channels.feishu.verificationToken`               | Obrigatório para o modo webhook                                                  | —                |
| `channels.feishu.encryptKey`                      | Obrigatório para o modo webhook                                                  | —                |
| `channels.feishu.webhookPath`                     | Caminho da rota Webhook                                                          | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host de vinculação do Webhook                                                    | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Porta de vinculação do Webhook                                                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID do aplicativo                                                                 | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Segredo do aplicativo                                                            | —                |
| `channels.feishu.accounts.<id>.domain`            | Substituição de domínio por conta                                                | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Substituição de TTS por conta                                                    | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Política de DM                                                                   | `allowlist`      |
| `channels.feishu.allowFrom`                       | Lista de permissões de DM (lista de open_id)                                     | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Política de grupo                                                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Lista de permissões de grupo                                                     | —                |
| `channels.feishu.requireMention`                  | Exigir @menção em grupos                                                         | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Substituição de @menção por grupo; IDs explícitos também admitem o grupo no modo de lista de permissões | herdado          |
| `channels.feishu.groups.<chat_id>.enabled`        | Ativa/desativa um grupo específico                                               | `true`           |
| `channels.feishu.textChunkLimit`                  | Tamanho do bloco de mensagem                                                     | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Limite de tamanho de mídia                                                       | `30`             |
| `channels.feishu.streaming`                       | Saída de cartões em streaming                                                    | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming em nível de bloco                                                      | `true`           |
| `channels.feishu.typingIndicator`                 | Enviar reações de digitação                                                      | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolver nomes de exibição dos remetentes                                        | `true`           |

---

## Tipos de mensagem compatíveis

### Receber

- ✅ Texto
- ✅ Texto avançado (publicação)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Figurinhas

Mensagens de áudio de entrada do Feishu/Lark são normalizadas como placeholders
de mídia em vez de JSON `file_key` bruto. Quando `tools.media.audio` está
configurado, o OpenClaw baixa o recurso de recado de voz e executa a transcrição
de áudio compartilhada antes do turno do agente, para que o agente receba a
transcrição falada. Se o Feishu incluir texto de transcrição diretamente no
payload de áudio, esse texto será usado sem outra chamada de ASR. Sem um provedor
de transcrição de áudio, o agente ainda recebe um placeholder `<media:audio>` mais
o anexo salvo, não o payload bruto do recurso do Feishu.

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos (incluindo atualizações em streaming)
- ⚠️ Texto avançado (formatação no estilo de publicação; não oferece suporte a todos os recursos de autoria do Feishu/Lark)

Balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu
e exigem mídia de upload Ogg/Opus (`file_type: "opus"`). Mídias `.opus` e `.ogg`
existentes são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros
formatos de áudio prováveis são transcodificados para Ogg/Opus de 48 kHz com
`ffmpeg` somente quando a resposta solicita entrega por voz (`audioAsVoice` /
ferramenta de mensagem `asVoice`, incluindo respostas de recado de voz TTS).
Anexos MP3 comuns permanecem como arquivos normais. Se o `ffmpeg` estiver
ausente ou a conversão falhar, o OpenClaw usa um anexo de arquivo como fallback e
registra o motivo.

### Conversas encadeadas e respostas

- ✅ Respostas embutidas
- ✅ Respostas em conversas encadeadas
- ✅ Respostas de mídia continuam cientes da conversa encadeada ao responder a uma mensagem em uma conversa encadeada

Para `groupSessionScope: "group_topic"` e `"group_topic_sender"`, grupos de
tópicos nativos do Feishu/Lark usam o `thread_id` (`omt_*`) do evento como a
chave canônica de sessão do tópico. Respostas normais em grupo que o OpenClaw
transforma em conversas encadeadas continuam usando o ID da mensagem raiz da
resposta (`om_*`), para que o primeiro turno e o turno de acompanhamento
permaneçam na mesma sessão.

---

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
