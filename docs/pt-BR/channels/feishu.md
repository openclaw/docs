---
read_when:
    - Você quer conectar um bot Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark é uma plataforma de colaboração completa na qual equipes conversam, compartilham documentos, gerenciam calendários e trabalham juntas.

**Status:** pronto para produção para DMs de bot + conversas em grupo. WebSocket é o modo padrão; o modo Webhook é opcional.

---

## Início rápido

<Note>
Requer OpenClaw 2026.5.29 ou superior. Execute `openclaw --version` para verificar. Atualize com `openclaw update`.
</Note>

<Steps>
  <Step title="Execute o assistente de configuração do canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Escolha a configuração manual para colar um App ID e App Secret do Feishu Open Platform, ou escolha a configuração por QR para criar um bot automaticamente. Se o aplicativo móvel doméstico do Feishu não reagir ao código QR, execute a configuração novamente e escolha a configuração manual.
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
- `"allowlist"` - somente usuários listados em `allowFrom` podem conversar
- `"open"` - permite DMs públicas somente quando `allowFrom` inclui `"*"`; com entradas restritivas, somente usuários correspondentes podem conversar
- `"disabled"` - desativa todas as DMs

**Aprovar uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Conversas em grupo

**Política de grupo** (`channels.feishu.groupPolicy`):

| Valor         | Comportamento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responde a todas as mensagens em grupos                                                            |
| `"allowlist"` | Responde somente a grupos em `groupAllowFrom` ou configurados explicitamente em `groups.<chat_id>` |
| `"disabled"`  | Desativa todas as mensagens de grupo; entradas explícitas de `groups.<chat_id>` não substituem isto         |

Padrão: `allowlist`

**Exigência de menção** (`channels.feishu.requireMention`):

- `true` - exige @menção (padrão)
- `false` - responde sem @menção
- Substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` e `@_all` somente de transmissão não são tratados como menções ao bot. Uma mensagem que menciona tanto `@all` quanto o bot diretamente ainda conta como menção ao bot.

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

No modo `allowlist`, você também pode admitir um grupo adicionando uma entrada explícita de `groups.<chat_id>`. Entradas explícitas não substituem `groupPolicy: "disabled"`. Padrões curinga em `groups.*` configuram grupos correspondentes, mas não admitem grupos por si só.

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

Inicie o gateway, envie uma DM ao bot e então verifique os logs:

```bash
openclaw logs --follow
```

Procure `open_id` na saída do log. Você também pode verificar solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição                 |
| --------- | --------------------------- |
| `/status` | Mostra o status do bot             |
| `/reset`  | Redefine a sessão atual   |
| `/model`  | Mostra ou troca o modelo de IA |

<Note>
Feishu/Lark não oferece suporte a menus nativos de comandos com barra, então envie estes comandos como mensagens de texto simples.
</Note>

---

## Solução de problemas

### O bot não responde em conversas em grupo

1. Garanta que o bot foi adicionado ao grupo
2. Garanta que você @mencione o bot (exigido por padrão)
3. Verifique se `groupPolicy` não é `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Garanta que o bot esteja publicado e aprovado no Feishu Open Platform / Lark Developer
2. Garanta que a assinatura de eventos inclua `im.message.receive_v1`
3. Garanta que **conexão persistente** (WebSocket) esteja selecionada
4. Garanta que todos os escopos de permissão necessários tenham sido concedidos
5. Garanta que o gateway esteja em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### A configuração por QR não reage no aplicativo móvel Feishu

1. Execute a configuração novamente: `openclaw channels login --channel feishu`
2. Escolha a configuração manual
3. No Feishu Open Platform, crie um aplicativo autoconstruído e copie seu App ID e App Secret
4. Cole essas credenciais no assistente de configuração

### App Secret vazado

1. Redefina o App Secret no Feishu Open Platform / Lark Developer
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
`accounts.<id>.tts` usa o mesmo formato que `messages.tts` e faz mesclagem profunda sobre
a configuração global de TTS, para que configurações Feishu com vários bots possam manter credenciais
compartilhadas de provedores globalmente enquanto substituem somente voz, modelo, persona ou modo automático
por conta.

### Limites de mensagens

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

Reduza o número de chamadas à API do Feishu/Lark com duas flags opcionais:

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

Feishu/Lark oferece suporte a ACP para DMs e mensagens em threads de grupo. ACP no Feishu/Lark é orientado por comandos de texto - não há menus nativos de comandos com barra, então use mensagens `/acp ...` diretamente na conversa.

#### Associação ACP persistente

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

#### Gerar ACP a partir da conversa

Em uma DM ou thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens em threads Feishu/Lark. Mensagens de acompanhamento na conversa associada são roteadas diretamente para essa sessão ACP.

### Roteamento multiagente

Use `bindings` para rotear DMs ou grupos Feishu/Lark para diferentes agentes.

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

Veja [Obter IDs de grupo/usuário](#get-groupuser-ids) para dicas de consulta.

---

## Isolamento de agente por usuário (Criação Dinâmica de Agente)

Ative `dynamicAgentCreation` para criar automaticamente **instâncias isoladas de agente** para cada usuário de DM. Cada usuário recebe seu próprio:

- Diretório de workspace independente
- `USER.md` / `SOUL.md` / `MEMORY.md` separados
- Histórico de conversa privado
- Skills e estado isolados

Isso é essencial para bots públicos nos quais você quer que cada usuário tenha sua própria experiência privada de assistente de IA.

<Note>
Associações dinâmicas incluem o `accountId` normalizado do Feishu, então contas padrão e nomeadas roteiam cada remetente para o agente dinâmico correto.

Se uma conta nomeada criou um agente dinâmico sem escopo em uma versão mais antiga, esse agente legado ainda conta para `maxAgents`. Confirme que ele não é usado pela conta padrão antes de removê-lo, ou aumente temporariamente `maxAgents`; o OpenClaw não consegue inferir com segurança qual conta possui um estado legado ambíguo.
</Note>

### Configuração rápida

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Como funciona

Quando um novo usuário envia sua primeira DM:

1. O canal gera um `agentId` exclusivo: `feishu-{user_open_id}` para a conta padrão, ou um resumo de identidade limitado com prefixo da conta para uma conta nomeada
2. Cria um novo workspace no caminho `workspaceTemplate`
3. Registra o agente e cria uma associação para este usuário
4. O auxiliar de workspace garante arquivos de inicialização (`AGENTS.md`, `SOUL.md`, `USER.md`, etc.) no primeiro acesso
5. Roteia todas as mensagens futuras deste usuário para seu agente dedicado

### Opções de configuração

| Configuração                                             | Descrição                                             | Padrão                               |
| -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar criação automática de agentes por usuário   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modelo de caminho para workspaces de agentes dinâmicos | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modelo de nome do diretório do agente                 | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinâmicos a criar            | ilimitado                            |

Variáveis de modelo:

- `{agentId}` - o ID de agente gerado (por exemplo, `feishu-ou_xxxxxx` ou `feishu-support-<identity_digest>`)
- `{userId}` - o open_id do remetente no Feishu (por exemplo, `ou_xxxxxx`)

### Escopo de sessão

`session.dmScope` controla como mensagens diretas são mapeadas para sessões de agente. Esta é uma **configuração global** que afeta todos os canais.

| Valor                        | Comportamento                                                       | Melhor para                                                        |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | A DM de cada usuário é mapeada para a sessão principal do agente    | Bots de usuário único em que você quer carregar `USER.md` / `SOUL.md` automaticamente |
| `"per-channel-peer"`         | Cada combinação (canal + usuário) recebe uma sessão separada        | Bots públicos multiusuário que precisam de isolamento mais forte   |
| `"per-account-channel-peer"` | Cada combinação (conta + canal + usuário) recebe uma sessão separada | Bots com várias contas que precisam de isolamento de sessão no nível da conta |

**Tradeoff**: Usar `"main"` habilita o carregamento automático de arquivos de bootstrap (`USER.md`, `SOUL.md`, `MEMORY.md`), mas significa que todas as DMs em todos os canais compartilham o mesmo padrão de chave de sessão. Para bots públicos multiusuário em que o isolamento importa mais do que o carregamento automático de bootstrap, considere `"per-channel-peer"` e gerencie os arquivos de bootstrap manualmente.

<Note>
Use `"per-account-channel-peer"` quando contas nomeadas do Feishu devem manter sessões separadas para o mesmo remetente. Vinculações dinâmicas preservam o escopo da conta.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### Implantação multiusuário típica

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Verificação

Verifique os logs do Gateway para confirmar que a criação dinâmica está funcionando:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Liste todos os workspaces criados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Observações

- **Isolamento de workspace**: Cada usuário recebe seu próprio diretório de workspace e instância de agente. Usuários não podem ver o histórico de conversas ou os arquivos uns dos outros no fluxo normal de mensagens.
- **Limite de segurança**: Este é um mecanismo de isolamento de contexto de mensagens, não um limite de segurança contra co-locatários hostis. O processo do agente e o ambiente do host são compartilhados.
- **`bindings` deve estar vazio**: Agentes dinâmicos registram automaticamente as próprias vinculações
- **Caminho de upgrade**: Vinculações manuais existentes continuam funcionando junto com agentes dinâmicos
- **`session.dmScope` é global**: Isso afeta todos os canais, não apenas o Feishu

---

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                             | Descrição                                                                        | Padrão                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Habilitar/desabilitar o canal                                                    | `true`                               |
| `channels.feishu.domain`                                 | Domínio da API (`feishu` ou `lark`)                                              | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transporte de eventos (`websocket` ou `webhook`)                                 | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Conta padrão para roteamento de saída                                            | `default`                            |
| `channels.feishu.verificationToken`                      | Obrigatório para o modo Webhook                                                  | -                                    |
| `channels.feishu.encryptKey`                             | Obrigatório para o modo Webhook                                                  | -                                    |
| `channels.feishu.webhookPath`                            | Caminho da rota de Webhook                                                       | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host de vinculação do Webhook                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Porta de vinculação do Webhook                                                   | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID do app                                                                        | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Segredo do app                                                                   | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Substituição de domínio por conta                                                | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Substituição de TTS por conta                                                    | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Política de DM                                                                   | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista de permissão de DM (lista de open_id)                                      | -                                    |
| `channels.feishu.groupPolicy`                            | Política de grupo                                                                | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista de permissão de grupo                                                      | -                                    |
| `channels.feishu.requireMention`                         | Exigir @menção em grupos                                                         | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | Substituição de @menção por grupo; IDs explícitos também admitem o grupo no modo de lista de permissão | herdado                              |
| `channels.feishu.groups.<chat_id>.enabled`               | Habilitar/desabilitar um grupo específico                                        | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar criação automática de agentes por usuário                              | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modelo de caminho para workspaces de agentes dinâmicos                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modelo de nome do diretório do agente                                            | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinâmicos a criar                                       | ilimitado                            |
| `channels.feishu.textChunkLimit`                         | Tamanho do fragmento de mensagem                                                 | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Limite de tamanho de mídia                                                       | `30`                                 |
| `channels.feishu.streaming`                              | Saída de cartão em streaming                                                     | `true`                               |
| `channels.feishu.blockStreaming`                         | Streaming de resposta de bloco concluído                                         | `false`                              |
| `channels.feishu.typingIndicator`                        | Enviar reações de digitação                                                      | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Resolver nomes de exibição dos remetentes                                        | `true`                               |
| `channels.feishu.tools.bitable`                          | Habilitar ferramentas Bitable/Base                                               | `true`                               |
| `channels.feishu.tools.base`                             | Alias para `channels.feishu.tools.bitable`; `bitable` explícito vence quando ambos estão definidos | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Controle de ferramenta Bitable/Base por conta                                    | herdado                              |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por conta para `tools.bitable`                                             | herdado                              |

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

Mensagens de áudio recebidas do Feishu/Lark são normalizadas como placeholders de mídia em vez de JSON `file_key` bruto. Quando `tools.media.audio` está configurado, o OpenClaw baixa o recurso de nota de voz e executa a transcrição de áudio compartilhada antes do turno do agente, para que o agente receba a transcrição falada. Se o Feishu incluir texto de transcrição diretamente no payload de áudio, esse texto será usado sem outra chamada de ASR. Sem um provedor de transcrição de áudio, o agente ainda recebe um placeholder `<media:audio>` mais o anexo salvo, não o payload bruto do recurso do Feishu.

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos (incluindo atualizações em streaming)
- ⚠️ Rich text (formatação em estilo de post; não oferece suporte a todos os recursos de autoria do Feishu/Lark)

Os balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu e exigem
mídia enviada em Ogg/Opus (`file_type: "opus"`). Mídias `.opus` e `.ogg` existentes
são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros formatos provavelmente de áudio são
transcodificados para Ogg/Opus a 48 kHz com `ffmpeg` somente quando a resposta solicita entrega
por voz (`audioAsVoice` / ferramenta de mensagem `asVoice`, incluindo respostas de nota de voz por TTS).
Anexos MP3 comuns permanecem como arquivos normais. Se `ffmpeg` estiver ausente ou
a conversão falhar, o OpenClaw recorre a um anexo de arquivo e registra o motivo no log.

### Tópicos e respostas

- ✅ Respostas inline
- ✅ Respostas em tópico
- ✅ Respostas de mídia continuam cientes do tópico ao responder a uma mensagem em tópico

Para `groupSessionScope: "group_topic"` e `"group_topic_sender"`, grupos de tópicos
nativos do Feishu/Lark usam o `thread_id` do evento (`omt_*`) como a chave canônica
da sessão do tópico. Se um evento inicial de tópico nativo omitir `thread_id`, o OpenClaw
o hidrata a partir do Feishu antes de rotear o turno. Respostas normais de grupo que
o OpenClaw transforma em tópicos continuam usando o ID da mensagem raiz da resposta (`om_*`) para que
o primeiro turno e o turno de acompanhamento permaneçam na mesma sessão.

---

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
