---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Roteamento com vários agentes: agentes isolados, contas de canal e bindings'
title: Roteamento com vários agentes
x-i18n:
    generated_at: "2026-04-24T05:48:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Execute vários agentes _isolados_ — cada um com seu próprio workspace, diretório de estado (`agentDir`) e histórico de sessões — além de várias contas de canal (por exemplo, dois WhatsApps) em um único Gateway em execução. As mensagens de entrada são roteadas para o agente correto por meio de bindings.

Um **agente** aqui é o escopo completo por persona: arquivos do workspace, perfis de autenticação, registro de modelos e armazenamento de sessões. `agentDir` é o diretório de estado em disco que guarda essa configuração por agente em `~/.openclaw/agents/<agentId>/`. Um **binding** mapeia uma conta de canal (por exemplo, um workspace do Slack ou um número de WhatsApp) para um desses agentes.

## O que é “um agente”?

Um **agente** é um cérebro com escopo totalmente definido, com seu próprio:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretório de estado** (`agentDir`) para perfis de autenticação, registro de modelos e configuração por agente.
- **Armazenamento de sessões** (histórico de chat + estado de roteamento) em `~/.openclaw/agents/<agentId>/sessions`.

Os perfis de autenticação são **por agente**. Cada agente lê do seu próprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` também é o caminho mais seguro de recordação entre sessões aqui: ele retorna
uma visão limitada e higienizada, não um dump bruto da transcrição. A recordação do assistente remove
tags de thinking, scaffolding `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding degradado de chamada de ferramenta, tokens ASCII/full-width de controle de modelo vazados
e XML malformado de chamada de ferramenta do MiniMax antes de redigir/truncar.

As credenciais do agente principal **não** são compartilhadas automaticamente. Nunca reutilize `agentDir`
entre agentes (isso causa colisões de autenticação/sessão). Se você quiser compartilhar credenciais,
copie `auth-profiles.json` para o `agentDir` do outro agente.

As Skills são carregadas do workspace de cada agente mais raízes compartilhadas como
`~/.openclaw/skills`, e depois filtradas pela lista de permissões efetiva de Skills do agente quando
configurada. Use `agents.defaults.skills` para uma baseline compartilhada e
`agents.list[].skills` para substituição por agente. Consulte
[Skills: por agente vs compartilhadas](/pt-BR/tools/skills#per-agent-vs-shared-skills) e
[Skills: listas de permissões de Skills do agente](/pt-BR/tools/skills#agent-skill-allowlists).

O Gateway pode hospedar **um agente** (padrão) ou **muitos agentes** lado a lado.

**Observação sobre workspace:** o workspace de cada agente é o **cwd padrão**, não um
sandbox rígido. Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem
alcançar outros locais do host, a menos que o sandboxing esteja habilitado. Consulte
[Sandboxing](/pt-BR/gateway/sandboxing).

## Caminhos (mapa rápido)

- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado: `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessões: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (padrão)

Se você não fizer nada, o OpenClaw executa um único agente:

- `agentId` usa por padrão **`main`**.
- As sessões são indexadas como `agent:main:<mainKey>`.
- O workspace usa por padrão `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` está definido).
- O estado usa por padrão `~/.openclaw/agents/main/agent`.

## Helper de agente

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
  <Step title="Criar o workspace de cada agente">

Use o assistente ou crie workspaces manualmente:

```bash
openclaw agents add coding
openclaw agents add social
```

Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e `USER.md` opcional, além de um `agentDir` dedicado e armazenamento de sessão em `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Criar contas de canal">

Crie uma conta por agente nos seus canais preferidos:

- Discord: um bot por agente, habilite Message Content Intent e copie cada token.
- Telegram: um bot por agente via BotFather, copie cada token.
- WhatsApp: vincule cada número de telefone por conta.

```bash
openclaw channels login --channel whatsapp --account work
```

Consulte os guias de canal: [Discord](/pt-BR/channels/discord), [Telegram](/pt-BR/channels/telegram), [WhatsApp](/pt-BR/channels/whatsapp).

  </Step>

  <Step title="Adicionar agentes, contas e bindings">

Adicione agentes em `agents.list`, contas de canal em `channels.<channel>.accounts` e conecte tudo com `bindings` (exemplos abaixo).

  </Step>

  <Step title="Reiniciar e verificar">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Vários agentes = várias pessoas, várias personalidades

Com **vários agentes**, cada `agentId` se torna uma **persona totalmente isolada**:

- **Números de telefone/contas diferentes** (por `accountId` do canal).
- **Personalidades diferentes** (por arquivos de workspace por agente, como `AGENTS.md` e `SOUL.md`).
- **Autenticação + sessões separadas** (sem conversa cruzada, a menos que seja explicitamente habilitada).

Isso permite que **várias pessoas** compartilhem um servidor Gateway enquanto mantêm seus “cérebros” de IA e dados isolados.

## Busca de memória QMD entre agentes

Se um agente precisar buscar transcrições de sessão QMD de outro agente, adicione
coleções extras em `agents.list[].memorySearch.qmd.extraCollections`.
Use `agents.defaults.memorySearch.qmd.extraCollections` apenas quando todo agente
deve herdar as mesmas coleções de transcrição compartilhadas.

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

O caminho da coleção extra pode ser compartilhado entre agentes, mas o nome da coleção
permanece explícito quando o caminho está fora do workspace do agente. Caminhos dentro do
workspace continuam com escopo de agente, então cada agente mantém seu próprio conjunto de busca de transcrição.

## Um número de WhatsApp, várias pessoas (divisão de DM)

Você pode rotear **DMs diferentes do WhatsApp** para agentes diferentes permanecendo em **uma única conta de WhatsApp**. Faça correspondência por E.164 do remetente (como `+15551234567`) com `peer.kind: "direct"`. As respostas ainda vêm do mesmo número de WhatsApp (sem identidade de remetente por agente).

Detalhe importante: chats diretos colapsam para a **chave de sessão main** do agente, então o isolamento real exige **um agente por pessoa**.

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

- O controle de acesso de DM é **global por conta do WhatsApp** (pareamento/lista de permissões), não por agente.
- Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de transmissão](/pt-BR/channels/broadcast-groups).

## Regras de roteamento (como mensagens escolhem um agente)

Os bindings são **determinísticos** e **o mais específico vence**:

1. correspondência de `peer` (ID exato de DM/grupo/canal)
2. correspondência de `parentPeer` (herança de thread)
3. `guildId + roles` (roteamento por papel no Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. correspondência de `accountId` para um canal
7. correspondência no nível do canal (`accountId: "*"`)
8. fallback para o agente padrão (`agents.list[].default`, senão a primeira entrada da lista; padrão: `main`)

Se vários bindings corresponderem no mesmo nível, o primeiro na ordem da configuração vence.
Se um binding definir vários campos de correspondência (por exemplo `peer` + `guildId`), todos os campos especificados serão exigidos (semântica `AND`).

Detalhe importante sobre escopo de conta:

- Um binding que omite `accountId` corresponde apenas à conta padrão.
- Use `accountId: "*"` para um fallback em todo o canal em todas as contas.
- Se depois você adicionar o mesmo binding para o mesmo agente com um account id explícito, o OpenClaw atualiza o binding existente apenas de canal para escopo de conta em vez de duplicá-lo.

## Várias contas / números de telefone

Canais com suporte a **várias contas** (por exemplo, WhatsApp) usam `accountId` para identificar
cada login. Cada `accountId` pode ser roteado para um agente diferente, então um servidor pode hospedar
vários números de telefone sem misturar sessões.

Se você quiser uma conta padrão em todo o canal quando `accountId` for omitido, defina
`channels.<channel>.defaultAccount` (opcional). Quando não definido, o OpenClaw usa como fallback
`default` se presente; caso contrário, o primeiro account id configurado (ordenado).

Canais comuns que oferecem suporte a esse padrão incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um “cérebro” (workspace, autenticação por agente, armazenamento de sessão por agente).
- `accountId`: uma instância de conta de canal (por exemplo, conta do WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens de entrada para um `agentId` por `(channel, accountId, peer)` e opcionalmente IDs de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` (`main` por agente; `session.mainKey`).

## Exemplos de plataforma

### Bots do Discord por agente

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

Observações:

- Convide cada bot para a guild e habilite Message Content Intent.
- Tokens ficam em `channels.discord.accounts.<id>.token` (a conta padrão pode usar `DISCORD_BOT_TOKEN`).

### Bots do Telegram por agente

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

Observações:

- Crie um bot por agente com o BotFather e copie cada token.
- Os tokens ficam em `channels.telegram.accounts.<id>.botToken` (a conta padrão pode usar `TELEGRAM_BOT_TOKEN`).

### Números de WhatsApp por agente

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

  // Roteamento determinístico: a primeira correspondência vence (mais específica primeiro).
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

  // Desativado por padrão: mensagens entre agentes devem ser explicitamente habilitadas + permitidas por lista.
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

## Exemplo: chat diário no WhatsApp + trabalho profundo no Telegram

Divisão por canal: roteie o WhatsApp para um agente rápido do dia a dia e o Telegram para um agente Opus.

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

- Se você tiver várias contas para um canal, adicione `accountId` ao binding (por exemplo `{ channel: "whatsapp", accountId: "personal" }`).
- Para rotear uma única DM/grupo para o Opus e manter o restante no chat, adicione um binding `match.peer` para esse peer; correspondências de peer sempre vencem regras amplas de canal.

## Exemplo: mesmo canal, um peer para o Opus

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

Bindings de peer sempre vencem, então mantenha-os acima da regra ampla de canal.

## Agente da família vinculado a um grupo do WhatsApp

Vincule um agente de família dedicado a um único grupo do WhatsApp, com gating por menção
e uma política de ferramentas mais restrita:

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

- As listas allow/deny de ferramentas são de **tools**, não de Skills. Se uma Skill precisar executar um
  binário, garanta que `exec` esteja permitido e que o binário exista no sandbox.
- Para um controle mais rígido, defina `agents.list[].groupChat.mentionPatterns` e mantenha
  habilitadas as listas de permissões de grupo para o canal.

## Configuração de Sandbox e Tools por agente

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
        // Sem restrições de ferramentas - todas as ferramentas disponíveis
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Sempre em sandbox
          scope: "agent",  // Um contêiner por agente
          docker: {
            // Configuração opcional executada uma vez após a criação do contêiner
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Apenas a ferramenta read
          deny: ["exec", "write", "edit", "apply_patch"],    // Negar as demais
        },
      },
    ],
  },
}
```

Observação: `setupCommand` fica em `sandbox.docker` e executa uma vez na criação do contêiner.
Substituições por agente de `sandbox.docker.*` são ignoradas quando o escopo resolvido é `"shared"`.

**Benefícios:**

- **Isolamento de segurança**: restrinja ferramentas para agentes não confiáveis
- **Controle de recursos**: coloque agentes específicos em sandbox enquanto mantém outros no host
- **Políticas flexíveis**: permissões diferentes por agente

Observação: `tools.elevated` é **global** e baseado no remetente; não é configurável por agente.
Se você precisar de boundaries por agente, use `agents.list[].tools` para negar `exec`.
Para direcionamento em grupos, use `agents.list[].groupChat.mentionPatterns` para que @menções sejam mapeadas de forma limpa ao agente pretendido.

Consulte [Sandbox e Tools com vários agentes](/pt-BR/tools/multi-agent-sandbox-tools) para exemplos detalhados.

## Relacionado

- [Roteamento de canais](/pt-BR/channels/channel-routing) — como as mensagens são roteadas para os agentes
- [Sub-Agents](/pt-BR/tools/subagents) — criação de execuções de agente em segundo plano
- [ACP Agents](/pt-BR/tools/acp-agents) — execução de harnesses externos de coding
- [Presence](/pt-BR/concepts/presence) — presença e disponibilidade do agente
- [Sessão](/pt-BR/concepts/session) — isolamento e roteamento de sessão
