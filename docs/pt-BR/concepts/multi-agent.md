---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Roteamento Multi-Agent: agentes isolados, contas de canal e bindings'
title: Roteamento Multi-Agent
x-i18n:
    generated_at: "2026-04-26T11:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Execute vários agentes _isolados_ — cada um com seu próprio workspace, diretório de estado (`agentDir`) e histórico de sessão — além de várias contas de canal (por exemplo, dois WhatsApps) em um único Gateway em execução. Mensagens recebidas são roteadas para o agente correto por meio de bindings.

Um **agente** aqui é o escopo completo por persona: arquivos do workspace, perfis de auth, registro de modelos e armazenamento de sessão. `agentDir` é o diretório de estado em disco que mantém essa configuração por agente em `~/.openclaw/agents/<agentId>/`. Um **binding** mapeia uma conta de canal (por exemplo, um workspace do Slack ou um número de WhatsApp) para um desses agentes.

## O que é "um agente"?

Um **agente** é um cérebro totalmente delimitado com seus próprios:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretório de estado** (`agentDir`) para perfis de auth, registro de modelos e config por agente.
- **Armazenamento de sessão** (histórico de chat + estado de roteamento) em `~/.openclaw/agents/<agentId>/sessions`.

Perfis de auth são **por agente**. Cada agente lê de seu próprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` também é o caminho mais seguro de lembrança entre sessões aqui: ele retorna uma visão limitada e sanitizada, não um dump bruto da transcrição. A lembrança do assistente remove tags de raciocínio, estrutura `<relevant-memories>`, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), estrutura degradada de chamadas de ferramenta, tokens de controle de modelo vazados em ASCII/full-width e XML malformado de chamadas de ferramenta MiniMax antes de redação/truncamento.
</Note>

<Warning>
Credenciais do agente principal **não** são compartilhadas automaticamente. Nunca reutilize `agentDir` entre agentes (isso causa colisões de auth/sessão). Se você quiser compartilhar credenciais, copie `auth-profiles.json` para o `agentDir` do outro agente.
</Warning>

Skills são carregadas do workspace de cada agente mais raízes compartilhadas como `~/.openclaw/skills`, depois filtradas pela allowlist efetiva de Skills do agente quando configurada. Use `agents.defaults.skills` para uma linha de base compartilhada e `agents.list[].skills` para substituição por agente. Veja [Skills: por agente vs compartilhadas](/pt-BR/tools/skills#per-agent-vs-shared-skills) e [Skills: allowlists de Skills do agente](/pt-BR/tools/skills#agent-skill-allowlists).

O Gateway pode hospedar **um agente** (padrão) ou **muitos agentes** lado a lado.

<Note>
**Observação sobre workspace:** o workspace de cada agente é o **cwd padrão**, não um sandbox rígido. Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem alcançar outros locais do host, a menos que o sandboxing esteja ativado. Veja [Sandboxing](/pt-BR/gateway/sandboxing).
</Note>

## Caminhos (mapa rápido)

- Config: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado: `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Diretório do agente: `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessões: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (padrão)

Se você não fizer nada, o OpenClaw executa um único agente:

- `agentId` assume o padrão **`main`**.
- Sessões são indexadas como `agent:main:<mainKey>`.
- O workspace assume o padrão `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` está definido).
- O estado assume o padrão `~/.openclaw/agents/main/agent`.

## Assistente de agente

Use o assistente de agente para adicionar um novo agente isolado:

```bash
openclaw agents add work
```

Depois adicione `bindings` (ou deixe o assistente fazer isso) para rotear mensagens recebidas.

Verifique com:

```bash
openclaw agents list --bindings
```

## Início rápido

<Steps>
  <Step title="Crie o workspace de cada agente">
    Use o assistente ou crie workspaces manualmente:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e `USER.md` opcional, além de um `agentDir` dedicado e armazenamento de sessão em `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crie contas de canal">
    Crie uma conta por agente nos seus canais preferidos:

    - Discord: um bot por agente, ative Message Content Intent, copie cada token.
    - Telegram: um bot por agente via BotFather, copie cada token.
    - WhatsApp: vincule cada número de telefone por conta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Veja os guias dos canais: [Discord](/pt-BR/channels/discord), [Telegram](/pt-BR/channels/telegram), [WhatsApp](/pt-BR/channels/whatsapp).

  </Step>
  <Step title="Adicione agentes, contas e bindings">
    Adicione agentes em `agents.list`, contas de canal em `channels.<channel>.accounts` e conecte tudo com `bindings` (exemplos abaixo).
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
- **Personalidades diferentes** (por arquivos de workspace por agente como `AGENTS.md` e `SOUL.md`).
- **Auth + sessões separadas** (sem conversa cruzada, a menos que seja explicitamente ativada).

Isso permite que **várias pessoas** compartilhem um servidor Gateway, mantendo seus "cérebros" de IA e dados isolados.

## Busca de memória QMD entre agentes

Se um agente deve pesquisar transcrições de sessão QMD de outro agente, adicione coleções extras em `agents.list[].memorySearch.qmd.extraCollections`. Use `agents.defaults.memorySearch.qmd.extraCollections` apenas quando todos os agentes herdarem as mesmas coleções compartilhadas de transcrição.

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
            extraCollections: [{ path: "notes" }], // resolve dentro do workspace -> coleção chamada "notes-main"
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

O caminho da coleção extra pode ser compartilhado entre agentes, mas o nome da coleção permanece explícito quando o caminho está fora do workspace do agente. Caminhos dentro do workspace continuam com escopo do agente, para que cada agente mantenha seu próprio conjunto de busca de transcrições.

## Um número de WhatsApp, várias pessoas (divisão de DM)

Você pode rotear **diferentes DMs do WhatsApp** para agentes diferentes, permanecendo em **uma única conta de WhatsApp**. Faça correspondência pelo E.164 do remetente (como `+15551234567`) com `peer.kind: "direct"`. As respostas ainda vêm do mesmo número de WhatsApp (sem identidade de remetente por agente).

<Note>
Chats diretos colapsam para a **chave de sessão principal** do agente, então o verdadeiro isolamento exige **um agente por pessoa**.
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

- O controle de acesso por DM é **global por conta de WhatsApp** (pareamento/allowlist), não por agente.
- Para grupos compartilhados, faça bind do grupo a um agente ou use [Grupos de transmissão](/pt-BR/channels/broadcast-groups).

## Regras de roteamento (como as mensagens escolhem um agente)

Bindings são **determinísticos** e **o mais específico vence**:

<Steps>
  <Step title="correspondência de peer">
    ID exato de DM/grupo/canal.
  </Step>
  <Step title="correspondência de parentPeer">
    Herança de thread.
  </Step>
  <Step title="guildId + funções">
    Roteamento por função no Discord.
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
    Fallback para `agents.list[].default`, senão a primeira entrada da lista, padrão: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Desempate e semântica AND">
    - Se vários bindings corresponderem no mesmo nível, o primeiro na ordem da config vence.
    - Se um binding definir vários campos de correspondência (por exemplo `peer` + `guildId`), todos os campos especificados serão exigidos (semântica `AND`).

  </Accordion>
  <Accordion title="Detalhe do escopo da conta">
    - Um binding que omite `accountId` corresponde apenas à conta padrão.
    - Use `accountId: "*"` para um fallback em nível de canal em todas as contas.
    - Se você mais tarde adicionar o mesmo binding para o mesmo agente com um id de conta explícito, o OpenClaw atualiza o binding existente apenas de canal para escopo por conta, em vez de duplicá-lo.

  </Accordion>
</AccordionGroup>

## Várias contas / números de telefone

Canais que oferecem suporte a **várias contas** (por exemplo, WhatsApp) usam `accountId` para identificar cada login. Cada `accountId` pode ser roteado para um agente diferente, então um servidor pode hospedar vários números de telefone sem misturar sessões.

Se você quiser uma conta padrão em nível de canal quando `accountId` for omitido, defina `channels.<channel>.defaultAccount` (opcional). Quando não definido, o OpenClaw usa `default` como fallback se estiver presente; caso contrário, usa o primeiro id de conta configurado (ordenado).

Canais comuns com suporte a esse padrão incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um "cérebro" (workspace, auth por agente, armazenamento de sessão por agente).
- `accountId`: uma instância de conta de canal (por exemplo, conta de WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens recebidas para um `agentId` por `(channel, accountId, peer)` e opcionalmente ids de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` (o "main" por agente; `session.mainKey`).

## Exemplos por plataforma

<AccordionGroup>
  <Accordion title="Bots do Discord por agente">
    Cada conta de bot do Discord é mapeada para um `accountId` exclusivo. Faça bind de cada conta a um agente e mantenha allowlists por bot.

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

    - Convide cada bot para a guild e ative Message Content Intent.
    - Tokens ficam em `channels.discord.accounts.<id>.token` (a conta padrão pode usar `DISCORD_BOT_TOKEN`).

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
  <Accordion title="Números de WhatsApp por agente">
    Vincule cada conta antes de iniciar o gateway:

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

      // Roteamento determinístico: a primeira correspondência vence (mais específico primeiro).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Substituição opcional por peer (exemplo: enviar um grupo específico para o agente work).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Desativado por padrão: mensagens entre agentes devem ser ativadas explicitamente + estar na allowlist.
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
  <Tab title="WhatsApp diário + trabalho profundo no Telegram">
    Divida por canal: roteie o WhatsApp para um agente rápido do dia a dia e o Telegram para um agente Opus.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Dia a dia",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Trabalho profundo",
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

    - Se você tiver várias contas para um canal, adicione `accountId` ao binding (por exemplo `{ channel: "whatsapp", accountId: "personal" }`).
    - Para rotear uma única DM/grupo para Opus enquanto mantém o restante em chat, adicione um binding `match.peer` para esse peer; correspondências de peer sempre vencem regras amplas de canal.

  </Tab>
  <Tab title="Mesmo canal, um peer para Opus">
    Mantenha o WhatsApp no agente rápido, mas roteie uma DM para Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Dia a dia",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Trabalho profundo",
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

    Bindings de peer sempre vencem, então mantenha-os acima da regra ampla de canal.

  </Tab>
  <Tab title="Agente da família vinculado a um grupo de WhatsApp">
    Vincule um agente de família dedicado a um único grupo de WhatsApp, com controle por menções e uma política de ferramentas mais restrita:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Família",
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

    - Listas allow/deny de ferramentas são **ferramentas**, não Skills. Se uma Skill precisar executar um binário, verifique se `exec` está permitido e se o binário existe no sandbox.
    - Para controle mais rígido, defina `agents.list[].groupChat.mentionPatterns` e mantenha as allowlists de grupo ativadas para o canal.

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
          mode: "off",  // Sem sandbox para o agente pessoal
        },
        // Sem restrições de ferramentas - todas as ferramentas disponíveis
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Sempre em sandbox
          scope: "agent",  // Um container por agente
          docker: {
            // Configuração opcional executada uma vez após a criação do container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Apenas ferramenta de leitura
          deny: ["exec", "write", "edit", "apply_patch"],    // Nega as demais
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` fica em `sandbox.docker` e é executado uma vez na criação do container. Substituições por agente de `sandbox.docker.*` são ignoradas quando o escopo resolvido é `"shared"`.
</Note>

**Benefícios:**

- **Isolamento de segurança**: restringe ferramentas para agentes não confiáveis.
- **Controle de recursos**: coloca agentes específicos em sandbox enquanto mantém outros no host.
- **Políticas flexíveis**: permissões diferentes por agente.

<Note>
`tools.elevated` é **global** e baseado em remetente; não é configurável por agente. Se você precisar de limites por agente, use `agents.list[].tools` para negar `exec`. Para direcionamento em grupo, use `agents.list[].groupChat.mentionPatterns` para que @mentions sejam mapeadas de forma limpa para o agente pretendido.
</Note>

Veja [Sandbox e ferramentas Multi-Agent](/pt-BR/tools/multi-agent-sandbox-tools) para exemplos detalhados.

## Relacionados

- [Agentes ACP](/pt-BR/tools/acp-agents) — execução de harnesses externos de codificação
- [Roteamento de canal](/pt-BR/channels/channel-routing) — como mensagens são roteadas para agentes
- [Presença](/pt-BR/concepts/presence) — presença e disponibilidade do agente
- [Sessão](/pt-BR/concepts/session) — isolamento e roteamento de sessão
- [Subagentes](/pt-BR/tools/subagents) — inicialização de execuções de agente em segundo plano
