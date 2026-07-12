---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Roteamento multiagente: limites dos agentes, contas de canais e associações'
title: Roteamento multiagente
x-i18n:
    generated_at: "2026-07-12T15:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Execute vários agentes _isolados_ em um único processo do Gateway, cada um com seu próprio workspace, diretório de estado (`agentDir`) e histórico de sessões armazenado em SQLite, além de várias contas de canal (por exemplo, dois números do WhatsApp). As mensagens recebidas são encaminhadas ao agente correto por meio de **vinculações**.

Um **agente** é o escopo completo por persona: arquivos do workspace, perfis de autenticação, registro de modelos e armazenamento de sessões. Uma **vinculação** mapeia uma conta de canal (um workspace do Slack, um número do WhatsApp etc.) para um desses agentes.

## O que é um agente

Cada agente tem seu próprio:

- **Workspace**: arquivos, `AGENTS.md`/`SOUL.md`/`USER.md`, notas locais e regras da persona.
- **Diretório de estado** (`agentDir`): perfis de autenticação, registro de modelos e configuração por agente.
- **Armazenamento de sessões**: histórico de conversas e estado de roteamento em `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Os perfis de autenticação são específicos de cada agente e são lidos de:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` é o caminho mais seguro para recuperar informações entre sessões: ele retorna uma visualização limitada e censurada, não um despejo bruto da transcrição. Ele remove assinaturas de blocos de raciocínio, detalhes de payloads de resultados de ferramentas, a estrutura auxiliar `<relevant-memories>`, tags XML de chamadas de ferramentas (`<tool_call>`, `<function_call>` e suas formas plurais/rebaixadas) e o XML de chamadas de ferramentas do MiniMax; depois, trunca e limita a saída por tamanho em bytes.
</Note>

<Warning>
Nunca reutilize `agentDir` entre agentes — isso causa colisões de estado de autenticação/sessão. Quando a credencial OAuth local de um agente secundário expira ou sua atualização falha, o OpenClaw consulta a credencial do agente padrão/principal com o mesmo id de perfil e adota o token que estiver mais atualizado, sem copiar o token de atualização para o armazenamento do agente secundário. Se quiser uma conta OAuth totalmente independente, faça login a partir desse agente. Se copiar credenciais manualmente, copie apenas perfis portáteis estáticos de `api_key` ou `token` — o material de atualização OAuth não é portátil por padrão (`copyToAgents` pode incluir explicitamente um perfil).
</Warning>

As Skills são carregadas do workspace de cada agente e de raízes compartilhadas, como `~/.openclaw/skills`, e depois filtradas pela lista de permissões de Skills efetiva do agente. Use `agents.defaults.skills` para uma base compartilhada e `agents.list[].skills` para uma substituição por agente (entradas explícitas substituem o padrão; elas não são mescladas). Consulte [Skills: por agente vs. compartilhadas](/pt-BR/tools/skills#per-agent-vs-shared-skills) e [Skills: listas de permissões de agentes](/pt-BR/tools/skills#agent-allowlists).

O armazenamento pertencente a um Plugin segue a configuração desse Plugin; adicionar um segundo agente
não divide automaticamente todos os armazenamentos globais de Plugins. Por exemplo, configure
[cofres do Memory Wiki por agente](/pt-BR/concepts/multi-agent#per-agent-memory-wiki-vaults)
quando as personas não puderem compartilhar o conhecimento compilado da wiki.

<Note>
**Observação sobre o workspace:** o workspace de cada agente é o **cwd padrão**, não um sandbox rígido. Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem acessar outros locais do host, a menos que o sandbox esteja habilitado. Consulte [Sandbox](/pt-BR/gateway/sandboxing).
</Note>

## Caminhos

| O quê                                   | Padrão                                                                                 | Substituição                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Configuração                            | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Diretório de estado                     | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Workspace do agente padrão              | `~/.openclaw/workspace` (ou `workspace-<profile>` quando `OPENCLAW_PROFILE` é definido) | `agents.list[].workspace`, depois `agents.defaults.workspace`, ou `OPENCLAW_WORKSPACE_DIR` |
| Workspace dos outros agentes            | `<stateDir>/workspace-<agentId>` (ou `<agents.defaults.workspace>/<agentId>` quando definido) | `agents.list[].workspace`                                                                |
| Diretório do agente                     | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sessões e transcrições                  | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Artefatos de sessão legados/arquivados  | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Modo de agente único (padrão)

Se você não configurar nada, o OpenClaw executará um agente:

- O padrão de `agentId` é `main`.
- As chaves das sessões seguem o formato `agent:main:<mainKey>` (o `mainKey` padrão é `main`).
- O workspace padrão é `~/.openclaw/workspace` (ou `workspace-<profile>` quando `OPENCLAW_PROFILE` é definido como algo diferente de `default`).
- O estado padrão é `~/.openclaw/agents/main/agent`.

## Assistente de agentes

Adicione um novo agente isolado:

```bash
openclaw agents add work
```

Flags: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (repetível), `--non-interactive` (requer `--workspace`).

Adicione `bindings` para encaminhar mensagens recebidas (o assistente oferece a opção de fazer isso por você) e depois verifique:

```bash
openclaw agents list --bindings
```

## Início rápido

<Steps>
  <Step title="Crie o workspace de cada agente">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e um `USER.md` opcional, além de um `agentDir` dedicado e um armazenamento de sessões em `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crie contas de canal">
    Crie uma conta por agente nos canais de sua preferência:

    - Discord: um bot por agente, habilite Message Content Intent e copie cada token.
    - Telegram: um bot por agente por meio do BotFather e copie cada token.
    - WhatsApp: vincule cada número de telefone por conta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulte os guias dos canais: [Discord](/pt-BR/channels/discord), [Telegram](/pt-BR/channels/telegram), [WhatsApp](/pt-BR/channels/whatsapp).

  </Step>
  <Step title="Adicione agentes, contas e vinculações">
    Adicione agentes em `agents.list`, contas de canal em `channels.<channel>.accounts` e conecte-os com `bindings` (exemplos abaixo).
  </Step>
  <Step title="Reinicie e verifique">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Vários agentes, várias personas

Cada `agentId` configurado é um limite de persona distinto para o estado principal do agente:

- Contas diferentes por canal (por `accountId`).
- Personalidades diferentes (`AGENTS.md`/`SOUL.md` por agente).
- Autenticação e sessões separadas, com acesso entre agentes habilitado apenas por meio de recursos explícitos ou da configuração de Plugins.

Isso permite que várias pessoas compartilhem um Gateway enquanto mantêm separado o estado principal dos agentes.

## Cofres do Memory Wiki por agente

Por padrão, o Memory Wiki usa um único cofre global. Para manter o
conhecimento compilado de um agente de suporte separado do conhecimento de um agente de marketing, defina
`plugins.entries.memory-wiki.config.vault.scope` como `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

O caminho configurado é o diretório pai. O OpenClaw acrescenta o id
normalizado do agente, produzindo caminhos como `~/.openclaw/wiki/support` e
`~/.openclaw/wiki/marketing`. Operações da CLI e do Gateway com escopo de agente exigem
um agente explícito quando vários agentes estão configurados. Consulte
[cofres do Memory Wiki por agente](/pt-BR/plugins/memory-wiki#per-agent-vaults) para obter detalhes sobre
filtragem da ponte, migração e limites de confiança.

## Pesquisa de memória QMD entre agentes

Para permitir que um agente pesquise as transcrições de sessões QMD de outro agente, adicione coleções extras em `agents.list[].memorySearch.qmd.extraCollections`. Use `agents.defaults.memorySearch.qmd.extraCollections` quando todos os agentes precisarem compartilhar as mesmas coleções.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolvido dentro do workspace -> coleção chamada "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Um caminho de coleção extra pode ser compartilhado entre agentes, mas seu `name` permanece explícito quando o caminho está fora do workspace do agente. Caminhos dentro do workspace permanecem com escopo de agente, para que cada agente mantenha seu próprio conjunto de pesquisa de transcrições.

## Um número do WhatsApp, várias pessoas (divisão de MDs)

Encaminhe diferentes MDs do WhatsApp para diferentes agentes em **uma única** conta do WhatsApp, fazendo a correspondência do remetente E.164 (`+15551234567`) com `peer.kind: "direct"`. As respostas ainda são enviadas pelo mesmo número do WhatsApp — não há uma identidade de remetente por agente.

<Note>
Por padrão, conversas diretas são agrupadas na chave da sessão principal do agente; portanto, o isolamento real exige um agente por pessoa.
</Note>

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

O controle de acesso a MDs (pareamento/lista de permissões) é global por conta do WhatsApp, não por agente. Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de transmissão](/pt-BR/channels/broadcast-groups).

## Regras de roteamento

As vinculações são determinísticas, e a mais específica prevalece. Consulte [Roteamento de canais](/pt-BR/channels/channel-routing#routing-rules-how-an-agent-is-chosen) para ver a ordem completa das camadas (par exato, par pai, curinga de par, guilda+funções, guilda, equipe, conta, canal, agente padrão). Algumas regras que merecem destaque:

- Se várias vinculações corresponderem na mesma camada, a primeira na ordem da configuração prevalecerá.
- Se uma vinculação definir vários campos de correspondência (por exemplo, `peer` + `guildId`), todos os campos especificados deverão corresponder (semântica `AND`).
- Uma vinculação que omite `accountId` corresponde apenas à conta padrão, não a todas as contas. Use `accountId: "*"` como fallback para todo o canal ou `accountId: "<name>"` para uma conta. Adicionar novamente a mesma vinculação com um id de conta explícito atualiza a vinculação existente exclusiva do canal, em vez de duplicá-la.

## Várias contas/números de telefone

Os canais compatíveis com várias contas (por exemplo, WhatsApp) usam `accountId` para identificar cada login. Cada `accountId` é encaminhado ao seu próprio agente, permitindo que um servidor hospede vários números de telefone sem misturar sessões.

Defina `channels.<channel>.defaultAccount` para escolher a conta usada quando `accountId` for omitido. Quando essa opção não estiver definida, o OpenClaw usará `default`, se existir; caso contrário, usará o primeiro id de conta configurado (em ordem alfabética).

Canais compatíveis com várias contas: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Conceitos

- `agentId`: um "cérebro" (workspace, autenticação por agente, armazenamento de sessões por agente).
- `accountId`: uma instância de conta de canal (por exemplo, conta do WhatsApp `personal` versus `biz`).
- `binding`: encaminha mensagens recebidas para um `agentId` por `(channel, accountId, peer)` e, opcionalmente, por IDs de guilda/equipe.
- Conversas diretas são consolidadas em `agent:<agentId>:<mainKey>` (a sessão "principal" por agente; consulte `session.mainKey`).

## Exemplos de plataformas

<AccordionGroup>
  <Accordion title="Bots do Discord por agente">
    Cada conta de bot do Discord é mapeada para um `accountId` exclusivo. Vincule cada conta a um agente e mantenha listas de permissões por bot.

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - Convide cada bot para a guilda e habilite Message Content Intent.
    - Os tokens ficam em `channels.discord.accounts.<id>.token` (a conta padrão pode usar `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bots do Telegram por agente">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - Crie um bot por agente com o BotFather e copie cada token.
    - Os tokens ficam em `channels.telegram.accounts.<id>.botToken` (a conta padrão pode usar `TELEGRAM_BOT_TOKEN`).
    - Para vários bots no mesmo grupo do Telegram, convide cada bot e mencione aquele que deve responder.
    - Desabilite o Privacy Mode do BotFather para cada bot de grupo (`/setprivacy` -> Disable), depois remova e adicione novamente o bot para que o Telegram aplique a configuração.
    - Permita grupos com `channels.telegram.groups` ou use `groupPolicy: "open"` somente em implantações de grupo confiáveis.
    - Coloque os IDs de usuário dos remetentes em `groupAllowFrom`. IDs de grupos e supergrupos devem ficar em `channels.telegram.groups`, não em `groupAllowFrom`.
    - Vincule por `accountId` para que cada bot encaminhe mensagens ao seu próprio agente.

  </Accordion>
  <Accordion title="Números do WhatsApp por agente">
    Vincule cada conta antes de iniciar o Gateway:

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // Encaminhamento determinístico: a primeira correspondência vence (a mais específica primeiro).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Substituição opcional por peer (exemplo: enviar um grupo específico ao agente de trabalho).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Desativado por padrão: as mensagens entre agentes devem ser habilitadas explicitamente e incluídas na lista de permissões.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // Substituição opcional. Padrão: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Substituição opcional. Padrão: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Padrões comuns

<Tabs>
  <Tab title="WhatsApp cotidiano + trabalho aprofundado no Telegram">
    Divida por canal: encaminhe o WhatsApp para um agente rápido de uso cotidiano e o Telegram para um agente Opus.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Estes exemplos usam `accountId: "*"` para que os vínculos continuem funcionando caso você adicione contas posteriormente. Para encaminhar uma única mensagem direta ou grupo ao Opus e manter o restante no agente de conversa, adicione um vínculo `match.peer` para esse peer — correspondências de peer sempre prevalecem sobre regras de todo o canal.

  </Tab>
  <Tab title="Mesmo canal, um peer para o Opus">
    Mantenha o WhatsApp no agente rápido, mas encaminhe uma mensagem direta ao Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Os vínculos de peer sempre prevalecem, portanto mantenha-os acima da regra de todo o canal.

  </Tab>
  <Tab title="Agente familiar vinculado a um grupo do WhatsApp">
    Vincule um agente familiar dedicado a um único grupo do WhatsApp, com exigência de menção e uma política de ferramentas mais restritiva:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    As listas de ferramentas permitidas/bloqueadas são de **ferramentas**, não de Skills. Se uma skill precisar executar um binário, certifique-se de que `exec` esteja permitido e que o binário exista no sandbox. Para um controle mais rigoroso, defina `agents.list[].groupChat.mentionPatterns` e mantenha habilitadas as listas de permissões de grupos do canal.

  </Tab>
</Tabs>

## Configuração de sandbox e ferramentas por agente

Cada agente pode ter suas próprias restrições de sandbox e ferramentas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Sem sandbox para o agente pessoal
        },
        // Sem restrições de ferramentas — todas as ferramentas estão disponíveis
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Sempre em sandbox
          scope: "agent",  // Um contêiner por agente
          docker: {
            // Configuração inicial opcional, executada uma vez após a criação do contêiner
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Somente a ferramenta de leitura
          deny: ["exec", "write", "edit", "apply_patch"],    // Bloqueia as demais
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` fica em `sandbox.docker` e é executado uma vez na criação do contêiner. Substituições de `sandbox.docker.*` por agente são ignoradas quando o escopo resolvido é `"shared"`.
</Note>

Isso oferece:

- **Isolamento de segurança**: restrinja ferramentas para agentes não confiáveis.
- **Controle de recursos**: execute agentes específicos em sandbox enquanto mantém os demais no host.
- **Políticas flexíveis**: permissões diferentes por agente.

<Note>
`tools.elevated` tem tanto um controle global (`tools.elevated.enabled`/`allowFrom`) quanto um controle por agente (`agents.list[].tools.elevated.enabled`/`allowFrom`). O controle por agente só pode restringir ainda mais o global — ambos devem permitir um remetente para que comandos elevados sejam executados. Para direcionamento em grupos, use `agents.list[].groupChat.mentionPatterns` para que as @menções sejam mapeadas claramente ao agente pretendido.
</Note>

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para ver exemplos detalhados.

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents) — execução de ambientes externos de programação
- [Encaminhamento de canais](/pt-BR/channels/channel-routing) — como as mensagens são encaminhadas aos agentes
- [Presença](/pt-BR/concepts/presence) — presença e disponibilidade do agente
- [Sessão](/pt-BR/concepts/session) — isolamento e encaminhamento de sessões
- [Subagentes](/pt-BR/tools/subagents) — criação de execuções de agentes em segundo plano
