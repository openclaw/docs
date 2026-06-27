---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Roteamento multiagente: agentes isolados, contas de canal e associações'
title: Roteamento multiagente
x-i18n:
    generated_at: "2026-06-27T17:25:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

Execute vários agentes _isolados_ — cada um com seu próprio workspace, diretório de estado (`agentDir`) e histórico de sessão — além de várias contas de canal (por exemplo, dois WhatsApps) em um Gateway em execução. Mensagens de entrada são roteadas para o agente correto por meio de bindings.

Um **agente** aqui é o escopo completo por persona: arquivos do workspace, perfis de autenticação, registro de modelos e armazenamento de sessão. `agentDir` é o diretório de estado em disco que mantém essa configuração por agente em `~/.openclaw/agents/<agentId>/`. Um **binding** mapeia uma conta de canal (por exemplo, um workspace do Slack ou um número do WhatsApp) para um desses agentes.

## O que é "um agente"?

Um **agente** é um cérebro totalmente escopado, com seus próprios:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretório de estado** (`agentDir`) para perfis de autenticação, registro de modelos e configuração por agente.
- **Armazenamento de sessão** (histórico de chat + estado de roteamento) em `~/.openclaw/agents/<agentId>/sessions`.

Perfis de autenticação são **por agente**. Cada agente lê do seu próprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` também é o caminho mais seguro de recordação entre sessões aqui: ele retorna uma visão limitada e sanitizada, não um despejo bruto de transcrição. A recordação do assistente remove tags de pensamento, estruturas `<relevant-memories>`, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), estruturas rebaixadas de chamadas de ferramenta, tokens de controle de modelo ASCII/largura completa vazados e XML malformado de chamadas de ferramenta MiniMax antes de redação/truncamento.
</Note>

<Warning>
Nunca reutilize `agentDir` entre agentes (isso causa colisões de autenticação/sessão). Agentes
podem ler os perfis de autenticação do agente padrão/principal quando não têm
um perfil local, mas o OpenClaw não clona tokens de atualização OAuth para o
armazenamento do agente secundário. Se quiser uma conta OAuth independente, faça login a partir
desse agente; se copiar credenciais manualmente, copie apenas perfis estáticos portáveis
`api_key` ou `token`.
</Warning>

Skills são carregadas de cada workspace de agente mais raízes compartilhadas como `~/.openclaw/skills`, depois filtradas pela allowlist efetiva de Skills do agente quando configurada. Use `agents.defaults.skills` para uma linha de base compartilhada e `agents.list[].skills` para substituição por agente. Consulte [Skills: por agente vs compartilhadas](/pt-BR/tools/skills#per-agent-vs-shared-skills) e [Skills: allowlists de Skills do agente](/pt-BR/tools/skills#agent-allowlists).

O Gateway pode hospedar **um agente** (padrão) ou **muitos agentes** lado a lado.

<Note>
**Nota sobre workspace:** o workspace de cada agente é o **cwd padrão**, não um sandbox rígido. Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem alcançar outros locais do host, a menos que o sandbox esteja habilitado. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).
</Note>

## Caminhos (mapa rápido)

- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado: `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Diretório do agente: `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessões: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (padrão)

Se você não fizer nada, o OpenClaw executa um único agente:

- `agentId` usa **`main`** por padrão.
- Sessões são chaveadas como `agent:main:<mainKey>`.
- O workspace usa `~/.openclaw/workspace` por padrão (ou `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` está definido).
- O estado usa `~/.openclaw/agents/main/agent` por padrão.

## Assistente de agente

Use o assistente de agente para adicionar um novo agente isolado:

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

    Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e `USER.md` opcional, além de um `agentDir` dedicado e armazenamento de sessão em `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crie contas de canal">
    Crie uma conta por agente nos seus canais preferidos:

    - Discord: um bot por agente, habilite Message Content Intent, copie cada token.
    - Telegram: um bot por agente via BotFather, copie cada token.
    - WhatsApp: vincule cada número de telefone por conta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulte os guias de canal: [Discord](/pt-BR/channels/discord), [Telegram](/pt-BR/channels/telegram), [WhatsApp](/pt-BR/channels/whatsapp).

  </Step>
  <Step title="Adicione agentes, contas e bindings">
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
- **Autenticação + sessões separadas** (sem comunicação cruzada, a menos que explicitamente habilitada).

Isso permite que **várias pessoas** compartilhem um servidor Gateway enquanto mantêm seus "cérebros" de IA e dados isolados.

## Busca de memória QMD entre agentes

Se um agente deve pesquisar as transcrições de sessão QMD de outro agente, adicione coleções extras em `agents.list[].memorySearch.qmd.extraCollections`. Use `agents.defaults.memorySearch.qmd.extraCollections` apenas quando todos os agentes devem herdar as mesmas coleções compartilhadas de transcrições.

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

## Um número do WhatsApp, várias pessoas (divisão de DM)

Você pode rotear **DMs diferentes do WhatsApp** para agentes diferentes enquanto permanece em **uma conta do WhatsApp**. Faça correspondência pelo remetente E.164 (como `+15551234567`) com `peer.kind: "direct"`. As respostas ainda vêm do mesmo número do WhatsApp (sem identidade de remetente por agente).

<Note>
Chats diretos colapsam para a **chave de sessão principal** do agente, então o isolamento real exige **um agente por pessoa**.
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

Notas:

- O controle de acesso a DM é **global por conta do WhatsApp** (pareamento/allowlist), não por agente.
- Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de broadcast](/pt-BR/channels/broadcast-groups).

## Regras de roteamento (como mensagens escolhem um agente)

Bindings são **determinísticos** e **o mais específico vence**:

<Steps>
  <Step title="correspondência de peer">
    ID exato de DM/grupo/canal.
  </Step>
  <Step title="correspondência de parentPeer">
    Herança de thread.
  </Step>
  <Step title="guildId + roles">
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
  <Step title="Correspondência em nível de canal">
    `accountId: "*"`.
  </Step>
  <Step title="Agente padrão">
    Fallback para `agents.list[].default`; caso contrário, primeira entrada da lista; padrão: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Desempate e semântica AND">
    - Se vários bindings corresponderem no mesmo nível, o primeiro na ordem da configuração vence.
    - Se um binding definir vários campos de correspondência (por exemplo, `peer` + `guildId`), todos os campos especificados são obrigatórios (semântica `AND`).

  </Accordion>
  <Accordion title="Detalhe de escopo de conta">
    - Um binding que omite `accountId` corresponde apenas à conta padrão. Ele não corresponde a todas as contas.
    - Use `accountId: "*"` para um fallback de todo o canal em todas as contas.
    - Use `accountId: "<name>"` para corresponder a uma conta.
    - Se você adicionar depois o mesmo binding para o mesmo agente com um id de conta explícito, o OpenClaw atualiza o binding existente somente de canal para escopado por conta em vez de duplicá-lo.

  </Accordion>
</AccordionGroup>

## Várias contas / números de telefone

Canais que aceitam **várias contas** (por exemplo, WhatsApp) usam `accountId` para identificar cada login. Cada `accountId` pode ser roteado para um agente diferente, então um servidor pode hospedar vários números de telefone sem misturar sessões.

Se você quiser uma conta padrão de todo o canal quando `accountId` for omitido, defina `channels.<channel>.defaultAccount` (opcional). Quando não definido, o OpenClaw usa `default` se presente; caso contrário, o primeiro id de conta configurado (ordenado).

Canais comuns que aceitam esse padrão incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um "cérebro" (workspace, autenticação por agente, armazenamento de sessão por agente).
- `accountId`: uma instância de conta de canal (por exemplo, conta do WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens de entrada para um `agentId` por `(channel, accountId, peer)` e, opcionalmente, ids de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` ("principal" por agente; `session.mainKey`).

## Exemplos de plataforma

<AccordionGroup>
  <Accordion title="Bots do Discord por agente">
    Cada conta de bot do Discord mapeia para um `accountId` exclusivo. Vincule cada conta a um agente e mantenha allowlists por bot.

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
    - Para vários bots no mesmo grupo do Telegram, convide cada bot e mencione o bot que deve responder.
    - Desabilite o Privacy Mode do BotFather para cada bot de grupo e depois adicione novamente o bot para que o Telegram aplique a configuração.
    - Permita grupos com `channels.telegram.groups` ou use `groupPolicy: "open"` apenas para implantações de grupo confiáveis.
    - Coloque IDs de usuário de remetente em `groupAllowFrom`. IDs de grupo e supergrupo pertencem a `channels.telegram.groups`, não a `groupAllowFrom`.
    - Vincule por `accountId` para que cada bot seja roteado para seu próprio agente.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Observações:

    - Estes exemplos usam `accountId: "*"` para que os vínculos continuem funcionando se você adicionar contas depois.
    - Para rotear uma única DM/grupo para o Opus enquanto mantém o restante no chat, adicione um vínculo `match.peer` para esse peer; correspondências de peer sempre têm precedência sobre regras de canal inteiro.

  </Tab>
  <Tab title="Mesmo canal, um peer para o Opus">
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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Vínculos de peer sempre têm precedência, então mantenha-os acima da regra de canal inteiro.

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

    - Listas de permissão/negação de ferramentas são **ferramentas**, não Skills. Se uma skill precisar executar um binário, garanta que `exec` seja permitido e que o binário exista no sandbox.
    - Para um controle mais restrito, defina `agents.list[].groupChat.mentionPatterns` e mantenha as listas de permissão de grupo habilitadas para o canal.

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
`setupCommand` fica em `sandbox.docker` e é executado uma vez na criação do contêiner. Substituições por agente em `sandbox.docker.*` são ignoradas quando o escopo resolvido é `"shared"`.
</Note>

**Benefícios:**

- **Isolamento de segurança**: restrinja ferramentas para agentes não confiáveis.
- **Controle de recursos**: coloque agentes específicos em sandbox enquanto mantém outros no host.
- **Políticas flexíveis**: permissões diferentes por agente.

<Note>
`tools.elevated` é **global** e baseado no remetente; ele não é configurável por agente. Se você precisar de limites por agente, use `agents.list[].tools` para negar `exec`. Para direcionamento em grupo, use `agents.list[].groupChat.mentionPatterns` para que @menções sejam mapeadas claramente para o agente pretendido.
</Note>

Consulte [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para exemplos detalhados.

## Relacionado

- [Agentes ACP](/pt-BR/tools/acp-agents) — executar harnesses de codificação externos
- [Roteamento de canais](/pt-BR/channels/channel-routing) — como mensagens são roteadas para agentes
- [Presença](/pt-BR/concepts/presence) — presença e disponibilidade do agente
- [Sessão](/pt-BR/concepts/session) — isolamento e roteamento de sessão
- [Subagentes](/pt-BR/tools/subagents) — iniciar execuções de agente em segundo plano
