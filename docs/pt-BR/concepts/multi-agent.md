---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Roteamento multiagente: agentes isolados, contas de canal e vinculações'
title: Roteamento multiagente
x-i18n:
    generated_at: "2026-05-10T19:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Execute vários agentes _isolados_ — cada um com seu próprio workspace, diretório de estado (`agentDir`) e histórico de sessão — além de várias contas de canal (por exemplo, dois WhatsApps) em um único Gateway em execução. Mensagens de entrada são roteadas para o agente correto por meio de vínculos.

Um **agente** aqui é o escopo completo por persona: arquivos do workspace, perfis de autenticação, registro de modelos e armazenamento de sessões. `agentDir` é o diretório de estado em disco que contém esta configuração por agente em `~/.openclaw/agents/<agentId>/`. Um **vínculo** mapeia uma conta de canal (por exemplo, um workspace do Slack ou um número do WhatsApp) para um desses agentes.

## O que é "um agente"?

Um **agente** é um cérebro totalmente escopado com seu próprio:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretório de estado** (`agentDir`) para perfis de autenticação, registro de modelos e configuração por agente.
- **Armazenamento de sessões** (histórico de chat + estado de roteamento) em `~/.openclaw/agents/<agentId>/sessions`.

Perfis de autenticação são **por agente**. Cada agente lê de seu próprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` também é o caminho mais seguro para recordação entre sessões aqui: ele retorna uma visão limitada e sanitizada, não um despejo bruto de transcrição. A recordação do assistente remove tags de pensamento, estruturas `<relevant-memories>`, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), estruturas rebaixadas de chamadas de ferramenta, tokens vazados de controle de modelo ASCII/de largura total e XML malformado de chamadas de ferramenta MiniMax antes da redação/truncamento.
</Note>

<Warning>
Nunca reutilize `agentDir` entre agentes (isso causa colisões de autenticação/sessão). Agentes
podem ler os perfis de autenticação do agente padrão/principal quando não têm
um perfil local, mas o OpenClaw não clona tokens de atualização OAuth para o
armazenamento do agente secundário. Se você quiser uma conta OAuth independente, faça login a partir
desse agente; se copiar credenciais manualmente, copie apenas perfis portáteis estáticos
`api_key` ou `token`.
</Warning>

Skills são carregadas de cada workspace de agente mais raízes compartilhadas, como `~/.openclaw/skills`, e então filtradas pela lista de permissão de Skills efetiva do agente quando configurada. Use `agents.defaults.skills` para uma linha de base compartilhada e `agents.list[].skills` para substituição por agente. Veja [Skills: por agente vs compartilhadas](/pt-BR/tools/skills#per-agent-vs-shared-skills) e [Skills: listas de permissão de Skills do agente](/pt-BR/tools/skills#agent-skill-allowlists).

O Gateway pode hospedar **um agente** (padrão) ou **muitos agentes** lado a lado.

<Note>
**Observação sobre workspace:** o workspace de cada agente é o **cwd padrão**, não uma sandbox rígida. Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem alcançar outros locais do host, a menos que o isolamento por sandbox esteja ativado. Veja [Isolamento por sandbox](/pt-BR/gateway/sandboxing).
</Note>

## Caminhos (mapa rápido)

- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado: `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Diretório do agente: `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessões: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (padrão)

Se você não fizer nada, o OpenClaw executa um único agente:

- `agentId` usa **`main`** como padrão.
- Sessões são indexadas como `agent:main:<mainKey>`.
- O workspace usa `~/.openclaw/workspace` como padrão (ou `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` está definido).
- O estado usa `~/.openclaw/agents/main/agent` como padrão.

## Assistente de agente

Use o assistente de agentes para adicionar um novo agente isolado:

```bash
openclaw agents add work
```

Depois adicione `bindings` (ou deixe o assistente fazer isso) para rotear mensagens de entrada.

Verifique com:

```bash
openclaw agents list --bindings
```

## Início rápido

<Steps>
  <Step title="Crie cada workspace de agente">
    Use o assistente ou crie workspaces manualmente:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e `USER.md` opcional, além de um `agentDir` dedicado e armazenamento de sessões em `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crie contas de canal">
    Crie uma conta por agente nos seus canais preferidos:

    - Discord: um bot por agente, habilite Message Content Intent, copie cada token.
    - Telegram: um bot por agente via BotFather, copie cada token.
    - WhatsApp: vincule cada número de telefone por conta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Veja os guias de canais: [Discord](/pt-BR/channels/discord), [Telegram](/pt-BR/channels/telegram), [WhatsApp](/pt-BR/channels/whatsapp).

  </Step>
  <Step title="Adicione agentes, contas e vínculos">
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

## Vários agentes = várias pessoas, várias personalidades

Com **vários agentes**, cada `agentId` se torna uma **persona totalmente isolada**:

- **Números de telefone/contas diferentes** (por `accountId` de canal).
- **Personalidades diferentes** (arquivos de workspace por agente, como `AGENTS.md` e `SOUL.md`).
- **Autenticação + sessões separadas** (sem comunicação cruzada, a menos que explicitamente ativada).

Isso permite que **várias pessoas** compartilhem um servidor Gateway mantendo seus "cérebros" de IA e dados isolados.

## Busca de memória QMD entre agentes

Se um agente deve pesquisar transcrições de sessão QMD de outro agente, adicione coleções extras em `agents.list[].memorySearch.qmd.extraCollections`. Use `agents.defaults.memorySearch.qmd.extraCollections` somente quando todos os agentes devem herdar as mesmas coleções compartilhadas de transcrições.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

O caminho da coleção extra pode ser compartilhado entre agentes, mas o nome da coleção permanece explícito quando o caminho está fora do workspace do agente. Caminhos dentro do workspace permanecem escopados ao agente, para que cada agente mantenha seu próprio conjunto de busca de transcrições.

## Um número do WhatsApp, várias pessoas (divisão de DMs)

Você pode rotear **DMs diferentes do WhatsApp** para agentes diferentes permanecendo em **uma conta do WhatsApp**. Corresponda pelo remetente E.164 (como `+15551234567`) com `peer.kind: "direct"`. As respostas ainda vêm do mesmo número do WhatsApp (sem identidade de remetente por agente).

<Note>
Chats diretos são colapsados para a **chave de sessão principal** do agente, então o isolamento real exige **um agente por pessoa**.
</Note>

Exemplo:

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

Observações:

- O controle de acesso de DM é **global por conta do WhatsApp** (pareamento/lista de permissão), não por agente.
- Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de transmissão](/pt-BR/channels/broadcast-groups).

## Regras de roteamento (como mensagens escolhem um agente)

Vínculos são **determinísticos** e **o mais específico vence**:

<Steps>
  <Step title="correspondência de peer">
    ID exato de DM/grupo/canal.
  </Step>
  <Step title="correspondência de parentPeer">
    Herança de thread.
  </Step>
  <Step title="guildId + funções">
    Roteamento por função do Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="correspondência de accountId para um canal">
    Fallback por conta.
  </Step>
  <Step title="Correspondência no nível do canal">
    `accountId: "*"`.
  </Step>
  <Step title="Agente padrão">
    Fallback para `agents.list[].default`, caso contrário a primeira entrada da lista, padrão: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Desempate e semântica AND">
    - Se vários vínculos corresponderem no mesmo nível, o primeiro na ordem da configuração vence.
    - Se um vínculo definir vários campos de correspondência (por exemplo `peer` + `guildId`), todos os campos especificados são obrigatórios (semântica `AND`).

  </Accordion>
  <Accordion title="Detalhe de escopo da conta">
    - Um vínculo que omite `accountId` corresponde somente à conta padrão.
    - Use `accountId: "*"` para um fallback em todo o canal entre todas as contas.
    - Se depois você adicionar o mesmo vínculo para o mesmo agente com um ID de conta explícito, o OpenClaw atualiza o vínculo existente somente de canal para escopado à conta, em vez de duplicá-lo.

  </Accordion>
</AccordionGroup>

## Várias contas / números de telefone

Canais que oferecem suporte a **várias contas** (por exemplo, WhatsApp) usam `accountId` para identificar cada login. Cada `accountId` pode ser roteado para um agente diferente, então um servidor pode hospedar vários números de telefone sem misturar sessões.

Se você quiser uma conta padrão em todo o canal quando `accountId` for omitido, defina `channels.<channel>.defaultAccount` (opcional). Quando não definido, o OpenClaw usa `default` como fallback se estiver presente; caso contrário, usa o primeiro ID de conta configurado (ordenado).

Canais comuns que oferecem suporte a este padrão incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um "cérebro" (workspace, autenticação por agente, armazenamento de sessões por agente).
- `accountId`: uma instância de conta de canal (por exemplo, conta do WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens de entrada para um `agentId` por `(channel, accountId, peer)` e, opcionalmente, IDs de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` ("main" por agente; `session.mainKey`).

## Exemplos de plataforma

<AccordionGroup>
  <Accordion title="Bots do Discord por agente">
    Cada conta de bot do Discord mapeia para um `accountId` único. Vincule cada conta a um agente e mantenha listas de permissão por bot.

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

    - Convide cada bot para a guild e habilite Message Content Intent.
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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp diário + trabalho profundo no Telegram">
    Divida por canal: roteie o WhatsApp para um agente rápido do dia a dia e o Telegram para um agente Opus.

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
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    Observações:

    - Se você tiver várias contas para um canal, adicione `accountId` ao vínculo (por exemplo, `{ channel: "whatsapp", accountId: "personal" }`).
    - Para rotear uma única DM/grupo para o Opus enquanto mantém o restante no chat, adicione um vínculo `match.peer` para esse par; correspondências de pares sempre vencem regras de canal inteiro.

  </Tab>
  <Tab title="Mesmo canal, um par para o Opus">
    Mantenha o WhatsApp no agente rápido, mas roteie uma DM para o Opus:

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
          match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp" } },
      ],
    }
    ```

    Vínculos de pares sempre vencem, então mantenha-os acima da regra de canal inteiro.

  </Tab>
  <Tab title="Agente familiar vinculado a um grupo do WhatsApp">
    Vincule um agente familiar dedicado a um único grupo do WhatsApp, com controle por menção e uma política de ferramentas mais restrita:

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

    Observações:

    - Listas de permissão/negação de ferramentas são **ferramentas**, não Skills. Se uma Skill precisar executar um binário, garanta que `exec` esteja permitido e que o binário exista no sandbox.
    - Para um controle mais rigoroso, defina `agents.list[].groupChat.mentionPatterns` e mantenha as listas de permissão de grupos habilitadas para o canal.

  </Tab>
</Tabs>

## Configuração de sandbox e ferramentas por agente

Cada agente pode ter seu próprio sandbox e restrições de ferramentas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` fica em `sandbox.docker` e é executado uma vez na criação do contêiner. Substituições `sandbox.docker.*` por agente são ignoradas quando o escopo resolvido é `"shared"`.
</Note>

**Benefícios:**

- **Isolamento de segurança**: restrinja ferramentas para agentes não confiáveis.
- **Controle de recursos**: coloque agentes específicos em sandbox enquanto mantém outros no host.
- **Políticas flexíveis**: permissões diferentes por agente.

<Note>
`tools.elevated` é **global** e baseado no remetente; ele não é configurável por agente. Se você precisar de limites por agente, use `agents.list[].tools` para negar `exec`. Para direcionamento em grupos, use `agents.list[].groupChat.mentionPatterns` para que @menções sejam mapeadas claramente para o agente pretendido.
</Note>

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para exemplos detalhados.

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents) — execução de harnesses de codificação externos
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como as mensagens são roteadas para agentes
- [Presença](/pt-BR/concepts/presence) — presença e disponibilidade do agente
- [Sessão](/pt-BR/concepts/session) — isolamento e roteamento de sessões
- [Subagentes](/pt-BR/tools/subagents) — criação de execuções de agente em segundo plano
