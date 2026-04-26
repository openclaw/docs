---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal do Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark é uma plataforma de colaboração completa em que as equipes conversam, compartilham documentos, gerenciam calendários e trabalham juntas.

**Status:** pronto para produção para DMs do bot + chats em grupo. WebSocket é o modo padrão; o modo Webhook é opcional.

---

## Início rápido

> **Requer OpenClaw 2026.4.25 ou superior.** Execute `openclaw --version` para verificar. Atualize com `openclaw update`.

<Steps>
  <Step title="Execute o assistente de configuração do canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escaneie o código QR com seu aplicativo móvel Feishu/Lark para criar um bot do Feishu/Lark automaticamente.
  </Step>
  
  <Step title="Após a conclusão da configuração, reinicie o Gateway para aplicar as alterações">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Controle de acesso

### Mensagens diretas

Configure `dmPolicy` para controlar quem pode enviar DM para o bot:

- `"pairing"` — usuários desconhecidos recebem um código de pareamento; aprove via CLI
- `"allowlist"` — apenas os usuários listados em `allowFrom` podem conversar (padrão: somente o proprietário do bot)
- `"open"` — permitir todos os usuários
- `"disabled"` — desativar todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats em grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamento                              |
| ------------- | ------------------------------------------ |
| `"open"`      | Responder a todas as mensagens nos grupos  |
| `"allowlist"` | Responder apenas aos grupos em `groupAllowFrom` |
| `"disabled"`  | Desativar todas as mensagens de grupo      |

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

### Permitir apenas grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Os IDs de grupo têm esta aparência: oc_xxx
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
          // Os open_ids de usuário têm esta aparência: ou_xxx
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

Inicie o Gateway, envie uma DM para o bot e depois verifique os logs:

```bash
openclaw logs --follow
```

Procure por `open_id` na saída dos logs. Você também pode verificar as solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição                        |
| --------- | -------------------------------- |
| `/status` | Mostrar status do bot            |
| `/reset`  | Redefinir a sessão atual         |
| `/model`  | Mostrar ou trocar o modelo de IA |

> Feishu/Lark não oferece suporte a menus nativos de comandos com barra, então envie estes como mensagens de texto simples.

---

## Solução de problemas

### O bot não responde em chats em grupo

1. Verifique se o bot foi adicionado ao grupo
2. Verifique se você menciona o bot com @ (exigido por padrão)
3. Verifique se `groupPolicy` não está como `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Verifique se o bot foi publicado e aprovado no Feishu Open Platform / Lark Developer
2. Verifique se a assinatura de eventos inclui `im.message.receive_v1`
3. Verifique se a **conexão persistente** (WebSocket) está selecionada
4. Verifique se todos os escopos de permissão obrigatórios foram concedidos
5. Verifique se o Gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### App Secret vazado

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
          name: "Bot principal",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
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

`defaultAccount` controla qual conta é usada quando APIs de saída não especificam um `accountId`.
`accounts.<id>.tts` usa o mesmo formato de `messages.tts` e faz um deep merge sobre a configuração global de TTS, para que configurações Feishu com vários bots possam manter credenciais de provedor compartilhadas globalmente enquanto substituem apenas voz, modelo, persona ou modo automático por conta.

### Limites de mensagem

- `textChunkLimit` — tamanho do bloco de texto de saída (padrão: `2000` caracteres)
- `mediaMaxMb` — limite de upload/download de mídia (padrão: `30` MB)

### Streaming

Feishu/Lark oferece suporte a respostas em streaming por meio de cartões interativos. Quando ativado, o bot atualiza o cartão em tempo real enquanto gera o texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // ativar saída de cartão em streaming (padrão: true)
      blockStreaming: true, // ativar streaming em nível de bloco (padrão: true)
    },
  },
}
```

Defina `streaming: false` para enviar a resposta completa em uma única mensagem.

### Otimização de cota

Reduza o número de chamadas de API do Feishu/Lark com duas flags opcionais:

- `typingIndicator` (padrão `true`): defina como `false` para pular chamadas de reação de digitação
- `resolveSenderNames` (padrão `true`): defina como `false` para pular buscas de perfil do remetente

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

Feishu/Lark oferece suporte a ACP para DMs e mensagens de tópico em grupo. O ACP no Feishu/Lark é orientado por comandos de texto — não há menus nativos de comandos com barra, então use mensagens `/acp ...` diretamente na conversa.

#### Vínculo persistente de ACP

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

Em uma DM ou tópico do Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens de tópico no Feishu/Lark. As mensagens seguintes na conversa vinculada são roteadas diretamente para essa sessão ACP.

### Roteamento de vários agentes

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
- `match.peer.kind`: `"direct"` (DM) ou `"group"` (chat em grupo)
- `match.peer.id`: Open ID do usuário (`ou_xxx`) ou ID do grupo (`oc_xxx`)

Consulte [Obter IDs de grupo/usuário](#get-groupuser-ids) para dicas de localização.

---

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                     | Descrição                                  | Padrão           |
| ------------------------------------------------ | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                        | Ativar/desativar o canal                   | `true`           |
| `channels.feishu.domain`                         | Domínio da API (`feishu` ou `lark`)        | `feishu`         |
| `channels.feishu.connectionMode`                 | Transporte de eventos (`websocket` ou `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                 | Conta padrão para roteamento de saída      | `default`        |
| `channels.feishu.verificationToken`              | Obrigatório para o modo webhook            | —                |
| `channels.feishu.encryptKey`                     | Obrigatório para o modo webhook            | —                |
| `channels.feishu.webhookPath`                    | Caminho da rota do Webhook                 | `/feishu/events` |
| `channels.feishu.webhookHost`                    | Host de bind do webhook                    | `127.0.0.1`      |
| `channels.feishu.webhookPort`                    | Porta de bind do webhook                   | `3000`           |
| `channels.feishu.accounts.<id>.appId`            | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`        | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`           | Substituição de domínio por conta          | `feishu`         |
| `channels.feishu.accounts.<id>.tts`              | Substituição de TTS por conta              | `messages.tts`   |
| `channels.feishu.dmPolicy`                       | Política de DM                             | `allowlist`      |
| `channels.feishu.allowFrom`                      | Lista de permissões de DM (lista de `open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                    | Política de grupo                          | `allowlist`      |
| `channels.feishu.groupAllowFrom`                 | Lista de permissões de grupo               | —                |
| `channels.feishu.requireMention`                 | Exigir @menção em grupos                   | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention`| Substituição de @menção por grupo          | herdado          |
| `channels.feishu.groups.<chat_id>.enabled`       | Ativar/desativar um grupo específico       | `true`           |
| `channels.feishu.textChunkLimit`                 | Tamanho do bloco de mensagem               | `2000`           |
| `channels.feishu.mediaMaxMb`                     | Limite de tamanho de mídia                 | `30`             |
| `channels.feishu.streaming`                      | Saída de cartão em streaming               | `true`           |
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

Mensagens de áudio recebidas do Feishu/Lark são normalizadas como placeholders de mídia de entrada em vez de JSON bruto de `file_key`. Quando `tools.media.audio` está configurado, o OpenClaw baixa o recurso da nota de voz e executa a transcrição de áudio compartilhada antes do turno do agente, para que o agente receba a transcrição falada. Se o Feishu incluir o texto da transcrição diretamente na carga útil do áudio, esse texto será usado sem outra chamada de ASR. Sem um provedor de transcrição de áudio, o agente ainda recebe um placeholder `<media:audio>` mais o anexo salvo, e não a carga útil bruta do recurso do Feishu.

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos (incluindo atualizações em streaming)
- ⚠️ Texto rico (formatação no estilo post; não oferece suporte a todos os recursos de autoria do Feishu/Lark)

Os balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu e exigem upload de mídia Ogg/Opus (`file_type: "opus"`). Mídias `.opus` e `.ogg` existentes são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros formatos de áudio prováveis são transcodificados para Ogg/Opus 48 kHz com `ffmpeg` somente quando a resposta solicita entrega por voz (`audioAsVoice` / ferramenta de mensagem `asVoice`, incluindo respostas de nota de voz por TTS). Anexos MP3 comuns permanecem como arquivos normais. Se `ffmpeg` estiver ausente ou a conversão falhar, o OpenClaw recorre a um anexo de arquivo e registra o motivo.

### Tópicos e respostas

- ✅ Respostas inline
- ✅ Respostas em tópico
- ✅ Respostas de mídia permanecem cientes do tópico ao responder a uma mensagem de tópico

Para `groupSessionScope: "group_topic"` e `"group_topic_sender"`, grupos de tópicos nativos do Feishu/Lark usam o `thread_id` do evento (`omt_*`) como chave canônica de sessão do tópico. Respostas normais em grupo que o OpenClaw transforma em tópicos continuam usando o ID da mensagem raiz da resposta (`om_*`), para que o primeiro turno e o turno de acompanhamento permaneçam na mesma sessão.

---

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
