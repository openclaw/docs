---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot do Feishu
title: Feishu
x-i18n:
    generated_at: "2026-07-12T14:53:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54f4d8a73fb1e7c2af970fa7dc71f953074aa49c4bc4aed0d24671c74a84ebe9
    source_path: channels/feishu.md
    workflow: 16
---

O OpenClaw se conecta ao Feishu/Lark (a plataforma de colaboração completa) por meio do plugin oficial `@openclaw/feishu`: mensagens diretas com o bot, chats em grupo, respostas em cartões transmitidas em tempo real e ferramentas de documentos, wiki, drive e Bitable do Feishu.

**Status:** pronto para produção para mensagens diretas com o bot e chats em grupo. O WebSocket é o transporte de eventos padrão (não requer URL pública); o modo Webhook é opcional.

## Início rápido

<Note>
Requer o OpenClaw 2026.5.29 ou superior. Execute `openclaw --version` para verificar. Atualize com `openclaw update`.
</Note>

<Steps>
  <Step title="Execute o assistente de configuração do canal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Isso instala o plugin `@openclaw/feishu` caso ele não esteja presente e, em seguida, orienta você durante a configuração:

- **Configuração manual**: cole um App ID e um App Secret da Feishu Open Platform (`https://open.feishu.cn`) ou do Lark Developer (`https://open.larksuite.com`).
- **Configuração por QR**: escaneie um código QR no aplicativo Feishu para criar um bot automaticamente. Esse fluxo restringe as mensagens diretas à sua própria conta (`dmPolicy: "allowlist"` com seu `open_id`).

O assistente também solicita o domínio da API (Feishu ou Lark) e a política de grupos. Se o aplicativo móvel doméstico do Feishu não reagir ao código QR, execute novamente a configuração e escolha a configuração manual.
</Step>

  <Step title="Após a conclusão da configuração, reinicie o Gateway para aplicar as alterações">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Controle de acesso

### Mensagens diretas

Configure `channels.feishu.dmPolicy` (padrão: `pairing`) para controlar quem pode enviar mensagens diretas ao bot:

| Valor         | Comportamento                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Usuários desconhecidos recebem um código de pareamento; aprove-o pela CLI                                                        |
| `"allowlist"` | Somente os usuários listados em `allowFrom` podem conversar                                                                      |
| `"open"`      | Mensagens diretas públicas; a validação da configuração exige que `allowFrom` inclua `"*"`. Entradas sem curinga ainda restringem o acesso |

**Aprove uma solicitação de pareamento:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chats em grupo

**Política de grupos** (`channels.feishu.groupPolicy`, padrão: `allowlist`):

| Valor         | Comportamento                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `"open"`      | Responde a todas as mensagens nos grupos                                                                   |
| `"allowlist"` | Responde somente aos grupos em `groupAllowFrom` ou configurados explicitamente em `groups.<chat_id>`       |
| `"disabled"`  | Desativa todas as mensagens de grupo; entradas explícitas em `groups.<chat_id>` não substituem essa política |

**Exigência de menção** (`channels.feishu.requireMention`):

- Padrão: uma @menção é obrigatória, exceto quando a política de grupo efetiva é `"open"`; nesse caso, o padrão é `false`, para que mensagens que não podem conter menções (por exemplo, imagens) ainda cheguem ao agente.
- Defina explicitamente como `true` ou `false` para substituir o padrão; substituição por grupo: `channels.feishu.groups.<chat_id>.requireMention`.
- `@all` e `@_all`, usados somente para transmissão, não são tratados como menções ao bot. Uma mensagem que mencione tanto `@all` quanto o bot diretamente ainda conta como uma menção ao bot.

## Exemplos de configuração de grupos

### Permitir todos os grupos, sem exigir @menção

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // requireMention usa false como padrão em "open"
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
      // Os IDs de grupo têm esta aparência: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

No modo `allowlist`, você também pode admitir um grupo adicionando uma entrada explícita em `groups.<chat_id>`. Entradas explícitas não substituem `groupPolicy: "disabled"`. Os padrões com curinga em `groups.*` configuram os grupos correspondentes, mas não os admitem por si só.

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
          // Os open_ids de usuário têm esta aparência: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` define a mesma lista de permissões de remetentes para todos os grupos; um `allowFrom` por grupo tem precedência.

<a id="get-groupuser-ids"></a>

## Obter IDs de grupos/usuários

### IDs de grupo (`chat_id`, formato: `oc_xxx`)

Abra o grupo no Feishu/Lark, clique no ícone de menu no canto superior direito e acesse **Settings**. O ID do grupo (`chat_id`) é exibido na página de configurações.

![Obter ID do grupo](/images/feishu-get-group-id.png)

### IDs de usuário (`open_id`, formato: `ou_xxx`)

Inicie o Gateway, envie uma mensagem direta ao bot e verifique os logs:

```bash
openclaw logs --follow
```

Procure `open_id` na saída do log. Você também pode verificar solicitações de pareamento pendentes:

```bash
openclaw pairing list feishu
```

## Comandos comuns

| Comando   | Descrição                      |
| --------- | ------------------------------ |
| `/status` | Mostra o status do bot         |
| `/reset`  | Redefine a sessão atual        |
| `/model`  | Mostra ou troca o modelo de IA |

<Note>
O Feishu/Lark não oferece suporte a menus nativos de comandos com barra; portanto, envie-os como mensagens de texto simples.
</Note>

## Solução de problemas

### O bot não responde em chats em grupo

1. Verifique se o bot foi adicionado ao grupo
2. Certifique-se de @mencionar o bot (obrigatório por padrão)
3. Verifique se `groupPolicy` não é `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Verifique se o bot foi publicado e aprovado na Feishu Open Platform / Lark Developer
2. Verifique se a assinatura de eventos inclui `im.message.receive_v1`
3. Verifique se **persistent connection** (WebSocket) está selecionada
4. Verifique se todos os escopos de permissão necessários foram concedidos
5. Verifique se o Gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### A configuração por QR não reage no aplicativo móvel Feishu

1. Execute novamente a configuração: `openclaw channels login --channel feishu`
2. Escolha a configuração manual
3. Na Feishu Open Platform, crie um aplicativo desenvolvido por você e copie seu App ID e App Secret
4. Cole essas credenciais no assistente de configuração

### O App Secret vazou

1. Redefina o App Secret na Feishu Open Platform / Lark Developer
2. Atualize o valor na sua configuração
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

`defaultAccount` controla qual conta é usada quando as APIs de saída não especificam um `accountId`. As entradas de conta herdam as configurações de nível superior; a maioria das chaves de nível superior pode ser substituída por conta.
`accounts.<id>.tts` usa a mesma estrutura de `messages.tts` e faz uma mesclagem profunda sobre a configuração global de TTS, permitindo que configurações do Feishu com vários bots mantenham globalmente as credenciais compartilhadas do provedor e substituam somente a voz, o modelo, a persona ou o modo automático por conta.

### Limites de mensagens

- `textChunkLimit` - tamanho do bloco de texto de saída (padrão: `4000` caracteres)
- `chunkMode` - `"length"` (padrão) divide no limite; `"newline"` prioriza limites de quebra de linha
- `mediaMaxMb` - limite de upload/download de mídia (padrão: `30` MB)

### Transmissão em tempo real

O Feishu/Lark oferece suporte a respostas transmitidas em tempo real por meio de cartões interativos (API de transmissão do Card Kit). Quando ativado, o bot atualiza o cartão em tempo real à medida que gera o texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // ativa a saída de cartões em tempo real (padrão: true)
      blockStreaming: true, // opta pela transmissão de blocos concluídos
    },
  },
}
```

Defina `streaming: false` para enviar a resposta completa em uma única mensagem; `renderMode: "raw"` (texto simples em vez de cartões) também desativa os cartões transmitidos em tempo real. `blockStreaming` fica desativado por padrão; ative-o somente quando quiser que os blocos concluídos do assistente sejam enviados antes da resposta final.

### Otimização de cota

Reduza o número de chamadas à API do Feishu/Lark com dois sinalizadores opcionais:

- `typingIndicator` (padrão `true`): defina como `false` para ignorar chamadas de reação de digitação
- `resolveSenderNames` (padrão `true`): defina como `false` para ignorar consultas aos perfis dos remetentes

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

### Escopo da sessão de grupo e threads de tópicos

`channels.feishu.groupSessionScope` (no nível superior, por conta ou por grupo) controla como as mensagens de grupo são mapeadas para sessões do agente:

| Valor                  | Sessão                                                                    |
| ---------------------- | ------------------------------------------------------------------------- |
| `"group"` (padrão)     | Uma sessão por chat em grupo                                              |
| `"group_sender"`       | Uma sessão por (grupo + remetente)                                        |
| `"group_topic"`        | Uma sessão por thread de tópico; recorre à sessão do grupo                |
| `"group_topic_sender"` | Uma sessão por (tópico + remetente); recorre a (grupo + remetente)        |

Para os escopos de tópico, os grupos de tópicos nativos do Feishu/Lark usam o `thread_id` (`omt_*`) do evento como a chave canônica da sessão de tópico. Se um evento inicial de tópico nativo omitir `thread_id`, o OpenClaw o obtém do Feishu antes de encaminhar a interação. As respostas normais de grupo que o OpenClaw transforma em threads continuam usando o ID da mensagem raiz da resposta (`om_*`), para que a primeira interação e as seguintes permaneçam na mesma sessão.

Defina `replyInThread: "enabled"` (no nível superior ou por grupo) para fazer com que as respostas do bot criem ou continuem uma thread de tópico do Feishu em vez de responderem em linha. `topicSessionMode` é o antecessor obsoleto de `groupSessionScope`; prefira `groupSessionScope`.

### Ferramentas do espaço de trabalho do Feishu

O plugin inclui ferramentas do agente para documentos, chats, base de conhecimento, armazenamento em nuvem, permissões e Bitable do Feishu, além das Skills correspondentes (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`). As famílias de ferramentas são controladas por `channels.feishu.tools`:

| Chave           | Ferramentas                                                | Padrão             |
| --------------- | ---------------------------------------------------------- | ------------------ |
| `tools.doc`     | Operações de documentos com `feishu_doc`                   | `true`             |
| `tools.chat`    | Informações de chat e consultas de membros com `feishu_chat` | `true`           |
| `tools.wiki`    | Base de conhecimento `feishu_wiki` (requer `doc`)          | `true`             |
| `tools.drive`   | Armazenamento em nuvem com `feishu_drive`                  | `true`             |
| `tools.perm`    | Gerenciamento de permissões com `feishu_perm`              | `false` (sensível) |
| `tools.scopes`  | Diagnóstico de escopos do aplicativo com `feishu_app_scopes` | `true`           |
| `tools.bitable` | Operações de Bitable/Base com `feishu_bitable_*`           | `true`             |

`tools.base` é um alias de `tools.bitable`; o valor explícito de `bitable` prevalece quando ambos são definidos. Os controles por conta ficam em `accounts.<id>.tools`.

Conceda `drive:drive.metadata:readonly` para consultas diretas de `feishu_drive info` fora do diretório
raiz, a menos que o aplicativo já tenha o escopo completo `drive:drive`. Sem nenhum desses escopos, `info`
mantém disponível a consulta legada do diretório raiz por meio de `drive:drive:readonly`.

### Sessões ACP

Feishu/Lark oferece suporte a ACP em DMs e mensagens de threads de grupo. O ACP do Feishu/Lark é operado por comandos de texto — não há menus nativos de comandos de barra, portanto use mensagens `/acp ...` diretamente na conversa.

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

`--thread here` funciona para DMs e mensagens de threads do Feishu/Lark. As mensagens subsequentes na conversa vinculada são encaminhadas diretamente para essa sessão ACP.

### Roteamento de múltiplos agentes

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

- Diretório de workspace independente
- Arquivos `USER.md` / `SOUL.md` / `MEMORY.md` separados
- Histórico de conversas privado
- Skills e estado isolados

Isso é essencial para bots públicos nos quais você deseja oferecer a cada usuário sua própria experiência privada com um assistente de IA.

<Note>
As vinculações dinâmicas incluem o `accountId` normalizado do Feishu, portanto as contas padrão e nomeadas encaminham cada remetente ao agente dinâmico correto.

Se uma conta nomeada criou um agente dinâmico sem escopo em uma versão mais antiga, esse agente legado ainda conta para `maxAgents`. Confirme que ele não é usado pela conta padrão antes de removê-lo ou aumente temporariamente `maxAgents`; o OpenClaw não consegue inferir com segurança qual conta é proprietária de um estado legado ambíguo.
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
    // Crítico: torna a DM de cada usuário sua "sessão principal"
    // Carrega automaticamente USER.md / SOUL.md / MEMORY.md
    // Para um isolamento mais forte, use "per-channel-peer"
    dmScope: "main",
  },
}
```

### Como funciona

Quando um novo usuário envia sua primeira DM:

1. O canal gera um `agentId` exclusivo: `feishu-{user_open_id}` para a conta padrão ou um resumo de identidade limitado e prefixado pela conta para uma conta nomeada
2. Cria um novo workspace no caminho de `workspaceTemplate`
3. Registra o agente e cria uma vinculação para esse usuário
4. O auxiliar de workspace garante os arquivos de inicialização (`AGENTS.md`, `SOUL.md`, `USER.md` etc.) no primeiro acesso
5. Encaminha todas as mensagens futuras desse usuário ao agente dedicado dele

### Opções de configuração

| Configuração                                             | Descrição                                              | Padrão                               |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Ativa a criação automática de agentes por usuário      | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modelo de caminho para workspaces de agentes dinâmicos | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modelo de nome do diretório do agente                  | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinâmicos a serem criados     | ilimitado                            |

Variáveis de modelo:

- `{agentId}` — o ID de agente gerado (por exemplo, `feishu-ou_xxxxxx` ou `feishu-support-<identity_digest>`)
- `{userId}` — o open_id do Feishu do remetente (por exemplo, `ou_xxxxxx`)

### Escopo da sessão

`session.dmScope` controla como as mensagens diretas são mapeadas para as sessões dos agentes. Esta é uma **configuração global** que afeta todos os canais.

| Valor                        | Comportamento                                                               | Mais adequado para                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `"main"`                     | A DM de cada usuário é mapeada para a sessão principal do agente dele       | Bots de usuário único nos quais `USER.md` / `SOUL.md` devem ser carregados automaticamente |
| `"per-peer"`                 | Cada interlocutor recebe uma sessão separada (independentemente do canal)   | Isolamento baseado somente na identidade do remetente                              |
| `"per-channel-peer"`         | Cada combinação de canal + usuário recebe uma sessão separada               | Bots públicos multiusuário que precisam de isolamento mais forte                  |
| `"per-account-channel-peer"` | Cada combinação de conta + canal + usuário recebe uma sessão separada       | Bots com várias contas que precisam de isolamento de sessões no nível da conta     |

**Compensação**: usar `"main"` ativa o carregamento automático dos arquivos de inicialização (`USER.md`, `SOUL.md`, `MEMORY.md`), mas significa que todas as DMs de todos os canais compartilham o mesmo padrão de chave de sessão. Para bots públicos multiusuário nos quais o isolamento é mais importante do que o carregamento automático da inicialização, considere `"per-channel-peer"` e gerencie os arquivos de inicialização manualmente.

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
    // Escolha dmScope de acordo com suas necessidades de isolamento:
    // "main" para carregamento automático da inicialização, "per-channel-peer" para isolamento mais forte
    dmScope: "main",
  },
  bindings: [], // Vazio — os agentes dinâmicos criam vinculações automaticamente
}
```

### Verificação

Verifique os logs do Gateway para confirmar se a criação dinâmica está funcionando:

```text
feishu: criando o agente dinâmico "feishu-ou_xxxxxx" para o usuário ou_xxxxxx
  workspace: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Liste todos os workspaces criados:

```bash
ls -la ~/.openclaw/workspace-*
```

### Observações

- **Isolamento do workspace**: cada usuário recebe seu próprio diretório de workspace e sua própria instância de agente. Os usuários não podem ver o histórico de conversas nem os arquivos uns dos outros no fluxo normal de mensagens.
- **Limite de segurança**: este é um mecanismo de isolamento do contexto de mensagens, não um limite de segurança contra colocatários hostis. O processo do agente e o ambiente do host são compartilhados.
- **As gravações de configuração devem permanecer ativadas**: a criação dinâmica de agentes grava agentes e vinculações na configuração; ela é ignorada quando `channels.feishu.configWrites` é `false` (padrão: ativado).
- **`bindings` deve estar vazio**: os agentes dinâmicos registram automaticamente suas próprias vinculações
- **Caminho de atualização**: as vinculações manuais existentes continuam funcionando junto com os agentes dinâmicos
- **`session.dmScope` é global**: isso afeta todos os canais, não apenas o Feishu

## Referência de configuração

Configuração completa: [Configuração do Gateway](/pt-BR/gateway/configuration)

| Configuração                                             | Descrição                                                                            | Padrão                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Ativar/desativar o canal                                                             | `true`                               |
| `channels.feishu.domain`                                 | Domínio da API (`feishu`, `lark` ou uma URL base `https://`)                         | `feishu`                             |
| `channels.feishu.connectionMode`                         | Transporte de eventos (`websocket` ou `webhook`)                                     | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Conta padrão para roteamento de saída                                                | `default`                            |
| `channels.feishu.verificationToken`                      | Obrigatório para o modo Webhook                                                      | -                                    |
| `channels.feishu.encryptKey`                             | Obrigatório para o modo Webhook                                                      | -                                    |
| `channels.feishu.webhookPath`                            | Caminho da rota do Webhook                                                           | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Host de escuta do Webhook                                                            | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Porta de escuta do Webhook                                                           | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ID do aplicativo                                                                     | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Segredo do aplicativo                                                                | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Substituição do domínio por conta                                                    | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Substituição de TTS por conta                                                        | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | Política de mensagens diretas (`pairing`, `allowlist`, `open`)                       | `pairing`                            |
| `channels.feishu.allowFrom`                              | Lista de permissões de mensagens diretas (lista de open_id)                          | -                                    |
| `channels.feishu.groupPolicy`                            | Política de grupos (`open`, `allowlist`, `disabled`)                                 | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Lista de permissões de grupos                                                        | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Lista de remetentes permitidos aplicada a todos os grupos                            | -                                    |
| `channels.feishu.requireMention`                         | Exigir @menção em grupos                                                             | `true` (`false` quando a política for `open`) |
| `channels.feishu.groups.<chat_id>.requireMention`        | Substituição de @menção por grupo; IDs explícitos também admitem o grupo no modo de lista de permissões | herdado                              |
| `channels.feishu.groups.<chat_id>.enabled`               | Ativar/desativar um grupo específico                                                 | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Lista de remetentes permitidos por grupo (substitui `groupSenderAllowFrom`)           | -                                    |
| `channels.feishu.groupSessionScope`                      | Mapeamento de sessões de grupo (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | As respostas do bot criam/continuam threads de tópicos (`disabled`, `enabled`)        | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Eventos de reação recebidos (`off`, `own`, `all`)                                    | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Ativar a criação automática de agentes por usuário                                   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Modelo de caminho para espaços de trabalho de agentes dinâmicos                      | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Modelo de nome do diretório do agente                                                 | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Número máximo de agentes dinâmicos a serem criados                                   | ilimitado                            |
| `channels.feishu.textChunkLimit`                         | Tamanho do bloco de mensagem                                                         | `4000`                               |
| `channels.feishu.chunkMode`                              | Divisão em blocos (`length` ou `newline`)                                             | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Limite de tamanho de mídia                                                           | `30`                                 |
| `channels.feishu.renderMode`                             | Renderização de respostas (`auto`, `raw`, `card`)                                    | `auto`                               |
| `channels.feishu.streaming`                              | Saída de cartões por streaming                                                       | `true`                               |
| `channels.feishu.blockStreaming`                         | Streaming de respostas por blocos concluídos                                         | `false`                              |
| `channels.feishu.typingIndicator`                        | Enviar reações de digitação                                                          | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Resolver nomes de exibição dos remetentes                                            | `true`                               |
| `channels.feishu.configWrites`                           | Permitir gravações de configuração iniciadas pelo canal (necessárias para agentes dinâmicos) | `true`                               |
| `channels.feishu.tools.doc`                              | Ativar ferramentas de documentos                                                     | `true`                               |
| `channels.feishu.tools.chat`                             | Ativar ferramentas de informações de chat                                            | `true`                               |
| `channels.feishu.tools.wiki`                             | Ativar ferramentas da base de conhecimento (requer `doc`)                            | `true`                               |
| `channels.feishu.tools.drive`                            | Ativar ferramentas de armazenamento em nuvem                                         | `true`                               |
| `channels.feishu.tools.perm`                             | Ativar ferramentas de gerenciamento de permissões                                    | `false`                              |
| `channels.feishu.tools.scopes`                           | Ativar ferramenta de diagnóstico de escopos do aplicativo                            | `true`                               |
| `channels.feishu.tools.bitable`                          | Ativar ferramentas Bitable/Base                                                      | `true`                               |
| `channels.feishu.tools.base`                             | Alias de `channels.feishu.tools.bitable`; o valor explícito de `bitable` prevalece quando ambos são definidos | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Controle de ferramentas Bitable/Base por conta                                       | herdado                              |
| `channels.feishu.accounts.<id>.tools.base`               | Alias por conta de `tools.bitable`                                                    | herdado                              |

## Tipos de mensagem compatíveis

### Recebimento

- ✅ Texto
- ✅ Texto enriquecido (publicação)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Figurinhas

As mensagens de áudio recebidas do Feishu/Lark são normalizadas como espaços reservados de mídia, em vez
de JSON `file_key` bruto. Quando `tools.media.audio` está configurado, o OpenClaw
baixa o recurso da mensagem de voz e executa a transcrição de áudio compartilhada antes do
turno do agente, para que ele receba a transcrição da fala. Se o Feishu incluir
o texto da transcrição diretamente na carga útil do áudio, esse texto será usado sem outra
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
- ⚠️ Texto enriquecido (formatação no estilo de publicação; não oferece suporte a todos os recursos de autoria do Feishu/Lark)

Os balões de áudio nativos do Feishu/Lark usam o tipo de mensagem `audio` do Feishu e exigem
mídia de upload Ogg/Opus (`file_type: "opus"`). Mídias `.opus` e `.ogg` existentes
são enviadas diretamente como áudio nativo. MP3/WAV/M4A e outros formatos de áudio prováveis são
transcodificados para Ogg/Opus de 48kHz com `ffmpeg` somente quando a resposta solicita entrega
por voz (`audioAsVoice` / `asVoice` da ferramenta de mensagens, incluindo respostas de mensagens
de voz por TTS). Anexos MP3 comuns continuam sendo arquivos normais. Se o `ffmpeg` estiver ausente ou
a conversão falhar, o OpenClaw usa um anexo de arquivo como alternativa e registra o motivo.

### Threads e respostas

- ✅ Respostas em linha
- ✅ Respostas em threads
- ✅ Respostas com mídia permanecem vinculadas ao thread ao responder a uma mensagem de thread

O roteamento de sessões de grupos de tópicos é abordado em
[Escopo de sessões de grupo e threads de tópicos](#group-session-scope-and-topic-threads).

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento do chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
