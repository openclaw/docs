---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-16T12:11:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw se conecta ao Feishu/Lark (a plataforma de colaboração completa) por meio do plugin oficial `@openclaw/feishu`: mensagens diretas com o bot, chats em grupo, respostas em cartões transmitidas em tempo real e ferramentas de documentos/wiki/drive/Bitable do Feishu.

**Status:** pronto para produção com mensagens diretas do bot e chats em grupo. WebSocket é o transporte de eventos padrão (nenhuma URL pública é necessária); o modo Webhook é opcional.

## Início rápido

<Note>
Requer o OpenClaw 2026.5.29 ou posterior. Execute `openclaw --version` para verificar. Atualize com `openclaw update`.
</Note>

<Steps>
  <Step title="Execute o assistente de configuração do canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Isso instala o plugin `@openclaw/feishu` caso ele esteja ausente e orienta durante a configuração:

- **Configuração manual**: cole um App ID e um App Secret da Feishu Open Platform (`https://open.feishu.cn`) ou do Lark Developer (`https://open.larksuite.com`).
- **Configuração por QR**: escaneie um código QR no aplicativo Feishu para criar um bot automaticamente. Esse fluxo restringe as mensagens diretas à sua própria conta (`dmPolicy: "allowlist"` com seu `open_id`).

O assistente também solicita o domínio da API (Feishu ou Lark) e a política de grupos. Se o aplicativo móvel doméstico do Feishu não responder ao código QR, execute novamente a configuração e escolha a configuração manual.
</Step>

  <Step title="Após concluir a configuração, reinicie o Gateway para aplicar as alterações">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Controle de acesso

### Mensagens diretas

Configure `channels.feishu.dmPolicy` (padrão: `pairing`) para controlar quem pode enviar mensagens diretas ao bot:

| Valor         | Comportamento                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Usuários desconhecidos recebem um código de pareamento; aprove pela CLI                                                         |
| `"allowlist"` | Somente usuários listados em `allowFrom` podem conversar                                                                     |
| `"open"`      | Mensagens diretas públicas; a validação da configuração exige que `allowFrom` inclua `"*"`. Entradas sem curinga ainda restringem o acesso |

**Aprove uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats em grupo

**Política de grupos** (`channels.feishu.groupPolicy`, padrão: `allowlist`):

| Valor         | Comportamento                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Responde a todas as mensagens em grupos                                                            |
| `"allowlist"` | Responde somente a grupos em `groupAllowFrom` ou configurados explicitamente em `groups.<chat_id>` |
| `"disabled"`  | Desativa todas as mensagens de grupos; entradas explícitas em `groups.<chat_id>` não substituem essa configuração         |

**Exigência de menção** (`channels.feishu.requireMention`):

- Padrão: uma @menção é obrigatória, exceto quando a política de grupos efetiva é `"open"`; nesse caso, o padrão é `false`, para que mensagens que não possam conter menções (por exemplo, imagens) ainda cheguem ao agente.
- Defina `true` ou `false` explicitamente para substituir o padrão; substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`.
- `@all` e `@_all`, que são somente para transmissão, não são tratados como menções ao bot. Uma mensagem que mencione diretamente tanto `@all` quanto o bot ainda conta como uma menção ao bot.

## Exemplos de configuração de grupos

### Permitir todos os grupos, sem exigir @menção

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention defaults to false under "open"
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

No modo `allowlist`, também é possível admitir um grupo adicionando uma entrada explícita em `groups.<chat_id>`. Entradas explícitas não substituem `groupPolicy: "disabled"`. Os padrões com curinga em `groups.*` configuram os grupos correspondentes, mas não os admitem por conta própria.

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

### Restringir remetentes em um grupo

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

`channels.feishu.groupSenderAllowFrom` define a mesma lista de remetentes permitidos para todos os grupos; um `allowFrom` por grupo tem precedência.

<a id="get-groupuser-ids"></a>

## Obter IDs de grupos/usuários

### IDs de grupos (`chat_id`, formato: `oc_xxx`)

Abra o grupo no Feishu/Lark, clique no ícone de menu no canto superior direito e acesse **Settings**. O ID do grupo (`chat_id`) é exibido na página de configurações.

![Obter ID do grupo](/images/feishu-get-group-id.png)

### IDs de usuários (`open_id`, formato: `ou_xxx`)

Inicie o Gateway, envie uma mensagem direta ao bot e verifique os logs:

```bash
openclaw logs --follow
```

Procure `open_id` na saída do log. Também é possível verificar solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

## Comandos comuns

| Comando   | Descrição                 |
| --------- | --------------------------- |
| `/status` | Exibe o status do bot             |
| `/reset`  | Redefine a sessão atual   |
| `/model`  | Exibe ou troca o modelo de IA |

<Note>
O Feishu/Lark não oferece suporte a menus nativos de comandos com barra; portanto, envie esses comandos como mensagens de texto simples.
</Note>

## Solução de problemas

### O bot não responde em chats em grupo

1. Verifique se o bot foi adicionado ao grupo
2. Certifique-se de usar uma @menção ao bot (obrigatória por padrão)
3. Verifique se `groupPolicy` não é `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Verifique se o bot está publicado e aprovado na Feishu Open Platform / Lark Developer
2. Verifique se a assinatura de eventos inclui `im.message.receive_v1`
3. Verifique se **persistent connection** (WebSocket) está selecionado
4. Verifique se todos os escopos de permissão necessários foram concedidos
5. Verifique se o Gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### A configuração por QR não responde no aplicativo móvel do Feishu

1. Execute novamente a configuração: `openclaw channels login --channel feishu`
2. Escolha a configuração manual
3. Na Feishu Open Platform, crie um aplicativo próprio e copie o App ID e o App Secret
4. Cole essas credenciais no assistente de configuração

### App Secret vazado

1. Redefina o App Secret na Feishu Open Platform / Lark Developer
2. Atualize o valor na configuração
3. Reinicie o Gateway: `openclaw gateway restart`

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

`defaultAccount` controla qual conta é usada quando as APIs de saída não especificam um `accountId`. As entradas de conta herdam as configurações de nível superior; a maioria das chaves de nível superior pode ser substituída por conta.
`accounts.<id>.tts` usa o mesmo formato que `messages.tts` e é mesclado profundamente sobre a configuração global de TTS, permitindo que configurações do Feishu com vários bots mantenham as credenciais compartilhadas dos provedores globalmente enquanto substituem somente a voz, o modelo, a persona ou o modo automático por conta.

### Limites de mensagens

- `textChunkLimit` - tamanho do trecho de texto de saída (padrão: `4000` caracteres)
- `streaming.chunkMode` - `"length"` (padrão) divide no limite; `"newline"` prioriza limites de novas linhas
- `mediaMaxMb` - limite para upload/download de mídia (padrão: `30` MB)

### Transmissão em tempo real

O Feishu/Lark oferece suporte a respostas transmitidas em tempo real por meio de cartões interativos (API de transmissão do Card Kit). Quando ativado, o bot atualiza o cartão em tempo real à medida que gera o texto.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // streaming card output (default: "partial")
        block: { enabled: true }, // opt into completed-block streaming
      },
    },
  },
}
```

Defina `streaming.mode: "off"` para enviar a resposta completa em uma única mensagem; `renderMode: "raw"` (texto simples em vez de cartões) também desativa os cartões transmitidos em tempo real. `streaming.block.enabled` fica desativado por padrão; ative-o somente quando quiser que os blocos concluídos do assistente sejam enviados antes da resposta final. O booleano legado `streaming` e as chaves simples `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` são migrados para esse formato aninhado por meio de `openclaw doctor --fix`.

### Otimização de cota

Reduza o número de chamadas à API do Feishu/Lark com dois sinalizadores opcionais:

- `typingIndicator` (padrão `true`): defina como `false` para ignorar chamadas de reação de digitação
- `resolveSenderNames` (padrão `true`): defina como `false` para ignorar consultas ao perfil do remetente

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

### Escopo da sessão de grupo e tópicos

`channels.feishu.groupSessionScope` (no nível superior, por conta ou por grupo) controla como as mensagens de grupo são mapeadas para sessões do agente:

| Valor                  | Sessão                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (padrão)    | Uma sessão por chat em grupo                                       |
| `"group_sender"`       | Uma sessão por (grupo + remetente)                                 |
| `"group_topic"`        | Uma sessão por tópico; em caso de ausência, usa a sessão do grupo    |
| `"group_topic_sender"` | Uma sessão por (tópico + remetente); em caso de ausência, usa (grupo + remetente) |

Para os escopos de tópico, os grupos de tópicos nativos do Feishu/Lark usam o evento `thread_id` (`omt_*`) como chave canônica da sessão do tópico. Se um evento inicial de tópico nativo omitir `thread_id`, o OpenClaw o recuperará do Feishu antes de encaminhar o turno. Respostas normais em grupos que o OpenClaw transforma em tópicos continuam usando o ID da mensagem raiz da resposta (`om_*`), para que o primeiro turno e os turnos subsequentes permaneçam na mesma sessão.

Defina `replyInThread: "enabled"` (no nível superior ou por grupo) para que as respostas do bot criem ou continuem um tópico do Feishu em vez de responder diretamente na conversa. `topicSessionMode` é o antecessor obsoleto de `groupSessionScope`; prefira `groupSessionScope`.

### Ferramentas do espaço de trabalho do Feishu

O plugin inclui ferramentas de agente para documentos, chats, base de conhecimento, armazenamento em nuvem, permissões e Bitable do Feishu, além das Skills correspondentes (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). As famílias de ferramentas são controladas por `channels.feishu.tools`:

| Chave           | Ferramentas                                   | Padrão              |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | operações de documentos do `feishu_doc`              | `true`              |
| `tools.chat`    | informações do chat + consultas de membros do `feishu_chat`      | `true`              |
| `tools.wiki`    | base de conhecimento do `feishu_wiki` (requer `doc`) | `true`              |
| `tools.drive`   | armazenamento em nuvem do `feishu_drive`                  | `true`              |
| `tools.perm`    | gerenciamento de permissões do `feishu_perm`           | `false` (sensível) |
| `tools.scopes`  | diagnóstico de escopos do aplicativo do `feishu_app_scopes`     | `true`              |
| `tools.bitable` | operações de Bitable/Base do `feishu_bitable_*`    | `true`              |

`tools.base` é um alias de `tools.bitable`; o valor explícito de `bitable` prevalece quando ambos estão definidos. Os controles por conta ficam em `accounts.<id>.tools`.

Conceda `drive:drive.metadata:readonly` para consultas diretas de `feishu_drive info` fora do diretório
raiz, a menos que o aplicativo já tenha o escopo completo `drive:drive`. Sem nenhum dos escopos, `info`
mantém a consulta legada do diretório raiz disponível por meio de `drive:drive:readonly`.

### Sessões ACP

O Feishu/Lark oferece suporte a ACP para DMs e mensagens em threads de grupos. O ACP do Feishu/Lark é controlado por comandos de texto — não há menus nativos de comandos de barra, portanto use mensagens `/acp ...` diretamente na conversa.

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

#### Iniciar ACP pelo chat

Em uma DM ou thread do Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` funciona para DMs e mensagens em threads do Feishu/Lark. As mensagens subsequentes na conversa vinculada são encaminhadas diretamente para essa sessão ACP.

### Roteamento multiagente

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

Consulte [Obter IDs de grupos/usuários](#get-groupuser-ids) para ver dicas de consulta.

## Isolamento de agentes por usuário (criação dinâmica de agentes)

Ative `dynamicAgentCreation` para criar automaticamente **instâncias isoladas de agentes** para cada usuário de DM. Cada usuário recebe:

- Diretório de espaço de trabalho independente
- `USER.md` / `SOUL.md` / `MEMORY.md` separados
- Histórico de conversas privado
- Skills e estado isolados

Isso é essencial para bots públicos quando se deseja oferecer a cada usuário uma experiência própria e privada com um assistente de IA.

<Note>
As vinculações dinâmicas incluem o `accountId` normalizado do Feishu, portanto as contas padrão e nomeadas encaminham cada remetente ao agente dinâmico correto.

Se uma conta nomeada criou um agente dinâmico sem escopo em uma versão anterior, esse agente legado ainda conta para `maxAgents`. Confirme que ele não é usado pela conta padrão antes de removê-lo ou aumente temporariamente `maxAgents`; o OpenClaw não consegue inferir com segurança qual conta é proprietária de um estado legado ambíguo.
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
    // Essencial: torna a DM de cada usuário sua "sessão principal"
    // Carrega automaticamente USER.md / SOUL.md / MEMORY.md
    // Para um isolamento mais forte, use "per-channel-peer"
    dmScope: "main",
  },
}
```

### Como funciona

Quando um novo usuário envia sua primeira DM:

1. O canal gera um `agentId` exclusivo: `feishu-{user_open_id}` para a conta padrão ou um resumo de identidade limitado e prefixado pela conta para uma conta nomeada
2. Cria um novo espaço de trabalho no caminho `workspaceTemplate`
3. Registra o agente e cria uma vinculação para esse usuário
4. O auxiliar do espaço de trabalho garante os arquivos de inicialização (`AGENTS.md`, `SOUL.md`, `USER.md` etc.) no primeiro acesso
5. Encaminha todas as mensagens futuras desse usuário ao agente dedicado dele

### Opções de configuração

| Configuração                                             | Descrição                                    | Padrão                               |
| -------------------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Ativar a criação automática de agentes por usuário | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modelo de caminho para espaços de trabalho de agentes dinâmicos | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modelo de nome do diretório do agente        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinâmicos a criar   | ilimitado                            |

Variáveis de modelo:

- `{agentId}` — o ID do agente gerado (por exemplo, `feishu-ou_xxxxxx` ou `feishu-support-<identity_digest>`)
- `{userId}` — o open_id do Feishu do remetente (por exemplo, `ou_xxxxxx`)

### Escopo da sessão

`session.dmScope` controla como as mensagens diretas são mapeadas para sessões de agentes. Esta é uma **configuração global** que afeta todos os canais.

| Valor                        | Comportamento                                                        | Mais indicado para                                                  |
| ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `"main"`                     | A DM de cada usuário é mapeada para a sessão principal do agente     | Bots de usuário único nos quais se deseja carregar `USER.md` / `SOUL.md` automaticamente |
| `"per-peer"`                 | Cada par recebe uma sessão separada (independentemente do canal)     | Isolamento baseado apenas na identidade do remetente                |
| `"per-channel-peer"`         | Cada combinação de (canal + usuário) recebe uma sessão separada      | Bots públicos multiusuário que precisam de isolamento mais forte   |
| `"per-account-channel-peer"` | Cada combinação de (conta + canal + usuário) recebe uma sessão separada | Bots com várias contas que precisam de isolamento de sessão por conta |

**Compensação**: usar `"main"` ativa o carregamento automático dos arquivos de inicialização (`USER.md`, `SOUL.md`, `MEMORY.md`), mas faz com que todas as DMs em todos os canais compartilhem o mesmo padrão de chave de sessão. Para bots públicos multiusuário em que o isolamento é mais importante que o carregamento automático da inicialização, considere `"per-channel-peer"` e gerencie manualmente os arquivos de inicialização.

<Note>
Use `"per-account-channel-peer"` quando contas nomeadas do Feishu precisarem manter sessões separadas para o mesmo remetente. As vinculações dinâmicas preservam o escopo da conta.
</Note>

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
    // Escolha dmScope com base nas suas necessidades de isolamento:
    // "main" para carregamento automático da inicialização, "per-channel-peer" para isolamento mais forte
    dmScope: "main",
  },
  bindings: [], // Vazio — os agentes dinâmicos são vinculados automaticamente
}
```

### Verificação

Verifique os logs do Gateway para confirmar que a criação dinâmica está funcionando:

```text
feishu: criando o agente dinâmico "feishu-ou_xxxxxx" para o usuário ou_xxxxxx
  espaço de trabalho: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  diretório do agente: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Liste todos os espaços de trabalho criados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Observações

- **Isolamento do espaço de trabalho**: cada usuário recebe seu próprio diretório de espaço de trabalho e sua própria instância de agente. Os usuários não conseguem ver o histórico de conversas nem os arquivos uns dos outros no fluxo normal de mensagens.
- **Limite de segurança**: este é um mecanismo de isolamento do contexto de mensagens, não um limite de segurança contra colocalizadores hostis. O processo do agente e o ambiente do host são compartilhados.
- **As gravações de configuração devem permanecer ativadas**: a criação dinâmica de agentes grava agentes e vinculações na configuração; ela é ignorada quando `channels.feishu.configWrites` é `false` (padrão: ativado).
- **`bindings` deve estar vazio**: os agentes dinâmicos registram automaticamente suas próprias vinculações
- **Caminho de atualização**: as vinculações manuais existentes continuam funcionando junto com os agentes dinâmicos
- **`session.dmScope` é global**: isso afeta todos os canais, não apenas o Feishu

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                                  | Descrição                                                                          | Padrão                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Habilitar/desabilitar o canal                                                           | `true`                               |
| `channels.feishu.domain`                                 | Domínio da API (`feishu`, `lark` ou uma URL base `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transporte de eventos (`websocket` ou `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Conta padrão para roteamento de saída                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | Obrigatório para o modo Webhook                                                            | -                                    |
| `channels.feishu.encryptKey`                             | Obrigatório para o modo Webhook                                                            | -                                    |
| `channels.feishu.webhookPath`                            | Caminho da rota do Webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host de vinculação do Webhook                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Porta de vinculação do Webhook                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID do aplicativo                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Segredo do aplicativo                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Substituição de domínio por conta                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Substituição de TTS por conta                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Política de MD (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista de permissões de MD (lista de open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | Política de grupo (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista de permissões de grupos                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Lista de permissões de remetentes aplicada a todos os grupos                                               | -                                    |
| `channels.feishu.requireMention`                         | Exigir @menção em grupos                                                           | `true` (`false` quando a política for `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | Substituição de @menção por grupo; IDs explícitos também admitem o grupo no modo de lista de permissões     | herdado                            |
| `channels.feishu.groups.<chat_id>.enabled`               | Habilitar/desabilitar um grupo específico                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Lista de permissões de remetentes por grupo (substitui `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | Mapeamento de sessão de grupo (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | As respostas do bot criam/continuam tópicos encadeados (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eventos de reação recebidos (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Habilitar a criação automática de agentes por usuário                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modelo de caminho para espaços de trabalho de agentes dinâmicos                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modelo de nome do diretório do agente                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinâmicos a criar                                           | ilimitado                            |
| `channels.feishu.textChunkLimit`                         | Tamanho do bloco de mensagem                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Divisão em blocos (`length` ou `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Limite de tamanho de mídia                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | Renderização de respostas (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | Saída de cartões por streaming (`partial` ou `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Streaming de respostas em blocos concluídos                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | Enviar reações de digitação                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Resolver nomes de exibição dos remetentes                                                         | `true`                               |
| `channels.feishu.configWrites`                           | Permitir gravações de configuração iniciadas pelo canal (necessárias para agentes dinâmicos)                     | `true`                               |
| `channels.feishu.tools.doc`                              | Habilitar ferramentas de documentos                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | Habilitar ferramentas de informações de chat                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | Habilitar ferramentas de base de conhecimento (requer `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | Habilitar ferramentas de armazenamento em nuvem                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | Habilitar ferramentas de gerenciamento de permissões                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | Habilitar ferramenta de diagnóstico de escopos do aplicativo                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Habilitar ferramentas Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable`; o valor explícito de `bitable` prevalece quando ambos estão definidos     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Controle de ferramentas Bitable/Base por conta                                                   | herdado                            |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por conta de `tools.bitable`                                                | herdado                            |

## Tipos de mensagem compatíveis

### Recebimento

- ✅ Texto
- ✅ Texto rico (publicação)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Figurinhas

As mensagens de áudio recebidas do Feishu/Lark são normalizadas como espaços reservados de mídia em vez
do JSON `file_key` bruto. Quando `tools.media.audio` está configurado, o OpenClaw
baixa o recurso da mensagem de voz e executa a transcrição de áudio compartilhada antes do
turno do agente, para que o agente receba a transcrição da fala. Se o Feishu incluir
o texto da transcrição diretamente na carga útil de áudio, esse texto será usado sem outra
chamada de ASR. Sem um provedor de transcrição de áudio, o agente ainda recebe um
espaço reservado `<media:audio>` junto com o anexo salvo, e não a carga útil bruta do
recurso do Feishu.

### Envio

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos (incluindo atualizações por streaming)
- ⚠️ Texto rico (formatação no estilo de publicação; não oferece todos os recursos de criação do Feishu/Lark)

Os balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu e exigem
mídia de upload Ogg/Opus (`file_type: "opus"`). As mídias `.opus` e `.ogg` existentes
são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros formatos que provavelmente sejam de áudio são
transcodificados para Ogg/Opus de 48kHz com `ffmpeg` somente quando a resposta solicita entrega
por voz (`audioAsVoice` / `asVoice` da ferramenta de mensagens, incluindo respostas de mensagem
de voz por TTS). Anexos MP3 comuns continuam sendo arquivos normais. Se `ffmpeg` estiver ausente ou
a conversão falhar, o OpenClaw usará um anexo de arquivo como alternativa e registrará o motivo.

### Tópicos e respostas

- ✅ Respostas em linha
- ✅ Respostas em tópicos
- ✅ As respostas com mídia permanecem vinculadas ao tópico ao responder a uma mensagem do tópico

O roteamento de sessões de grupos de tópicos é abordado em
[Escopo da sessão de grupo e tópicos encadeados](#group-session-scope-and-topic-threads).

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por MD e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento do chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
