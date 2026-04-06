---
read_when:
    - Alterar o comportamento de chats em grupo ou o bloqueio por menção
summary: Comportamento de chats em grupo entre superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-06T03:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8620de6f7f0b866bf43a307fdbec3399790f09f22a87703704b0522caba80b18
    source_path: channels/groups.md
    workflow: 15
---

# Grupos

O OpenClaw trata chats em grupo de forma consistente entre superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

O OpenClaw “vive” nas suas próprias contas de mensagens. Não existe um usuário de bot separado no WhatsApp.
Se **você** estiver em um grupo, o OpenClaw poderá ver esse grupo e responder nele.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente o bloqueio por menção.

Em outras palavras: remetentes na allowlist podem acionar o OpenClaw ao mencioná-lo.

> Resumo rápido
>
> - O **acesso por DM** é controlado por `*.allowFrom`.
> - O **acesso em grupo** é controlado por `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
> - O **acionamento de respostas** é controlado pelo bloqueio por menção (`requireMention`, `/activation`).

Fluxo rápido (o que acontece com uma mensagem em grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? não -> descartar
requireMention? sim -> mencionado? não -> armazenar apenas para contexto
caso contrário -> responder
```

## Visibilidade de contexto e allowlists

Dois controles diferentes estão envolvidos na segurança em grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados de encaminhamento).

Por padrão, o OpenClaw prioriza o comportamento normal do chat e mantém o contexto majoritariamente como foi recebido. Isso significa que as allowlists decidem principalmente quem pode acionar ações, não um limite universal de redação para cada trecho citado ou histórico.

O comportamento atual é específico de cada canal:

- Alguns canais já aplicam filtragem baseada no remetente para contexto suplementar em caminhos específicos (por exemplo, seeding de thread no Slack, buscas de resposta/thread no Matrix).
- Outros canais ainda repassam o contexto de citação/resposta/encaminhamento como foi recebido.

Direção de fortalecimento (planejada):

- `contextVisibility: "all"` (padrão) mantém o comportamento atual, como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes na allowlist.
- `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita para citação/resposta.

Até que esse modelo de fortalecimento seja implementado de forma consistente entre os canais, espere diferenças por superfície.

![Fluxo de mensagens em grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                     | O que definir                                             |
| -------------------------------------------- | --------------------------------------------------------- |
| Permitir todos os grupos, mas só responder em @mentions | `groups: { "*": { requireMention: true } }`               |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                 |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem a chave `"*"`)   |
| Só você pode acionar em grupos               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego “pessoal” forem **DMs** e o seu tráfego “público” forem **grupos**.

Por quê: no modo de agente único, DMs normalmente chegam na chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandboxing com `mode: "non-main"`, essas sessões de grupo serão executadas no Docker enquanto sua sessão principal de DM permanece no host.

Isso oferece um único “cérebro” de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas (Docker)

> Se você precisar de workspaces/personas realmente separados (“pessoal” e “público” nunca podem se misturar), use um segundo agente + bindings. Consulte [Roteamento com múltiplos agentes](/pt-BR/concepts/multi-agent).

Exemplo (DMs no host, grupos em sandbox + ferramentas só de mensagens):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupos/canais são não principais -> em sandbox
        scope: "session", // isolamento mais forte (um contêiner por grupo/canal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Se allow não estiver vazio, todo o resto será bloqueado (deny ainda prevalece).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Quer “grupos só podem ver a pasta X” em vez de “sem acesso ao host”? Mantenha `workspaceAccess: "none"` e monte apenas caminhos na allowlist dentro do sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Relacionado:

- Chaves de configuração e padrões: [Configuração do gateway](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de bind mounts: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Os rótulos da UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
- `#room` é reservado para salas/canais; chats em grupo usam `g-<slug>` (minúsculas, espaços -> `-`, manter `#@+._-`).

## Política de grupo

Controle como mensagens de grupo/sala são tratadas por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id numérico de usuário do Telegram (o assistente pode resolver @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Política      | Comportamento                                               |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Os grupos ignoram as allowlists; o bloqueio por menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens em grupo.         |
| `"allowlist"` | Permite apenas grupos/salas que correspondam à allowlist configurada. |

Observações:

- `groupPolicy` é separado do bloqueio por menção (que exige @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
- Aprovações de pareamento por DM (entradas armazenadas em `*-allowFrom`) se aplicam apenas ao acesso por DM; a autorização de remetente em grupo continua sendo explícita nas allowlists de grupo.
- Discord: a allowlist usa `channels.discord.guilds.<id>.channels`.
- Slack: a allowlist usa `channels.slack.channels`.
- Matrix: a allowlist usa `channels.matrix.groups`. Prefira ids ou aliases de sala; a busca por nome de sala ingressada é best-effort, e nomes não resolvidos são ignorados em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; allowlists `users` por sala também são compatíveis.
- Group DMs são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- A allowlist do Telegram pode corresponder a ids de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou usernames (`"@alice"` ou `"alice"`); os prefixos não diferenciam maiúsculas de minúsculas.
- O padrão é `groupPolicy: "allowlist"`; se sua allowlist de grupos estiver vazia, as mensagens em grupo serão bloqueadas.
- Segurança em runtime: quando um bloco de provider estiver totalmente ausente (`channels.<provider>` ausente), a política de grupo recua para um modo fail-closed (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

Modelo mental rápido (ordem de avaliação para mensagens em grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlists de grupo (`*.groups`, `*.groupAllowFrom`, allowlist específica do canal)
3. bloqueio por menção (`requireMention`, `/activation`)

## Bloqueio por menção (padrão)

Mensagens em grupo exigem uma menção, a menos que isso seja sobrescrito por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita (quando o canal oferece suporte a metadados de resposta). Isso se aplica a Telegram, WhatsApp, Slack, Discord e Microsoft Teams.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Observações:

- `mentionPatterns` são padrões regex seguros e sem distinção entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
- Superfícies que fornecem menções explícitas ainda passam; os padrões são um fallback.
- Sobrescrita por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
- O bloqueio por menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` configurados).
- Os padrões do Discord ficam em `channels.discord.guilds."*"` (sobrescrevível por guild/canal).
- O contexto do histórico de grupo é encapsulado de forma uniforme entre os canais e é **somente pending** (mensagens ignoradas devido ao bloqueio por menção); use `messages.groupChat.historyLimit` como padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para sobrescritas. Defina `0` para desativar.

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal oferecem suporte a restringir quais ferramentas ficam disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permitir/negar ferramentas para o grupo inteiro.
- `toolsBySender`: sobrescritas por remetente dentro do grupo.
  Use prefixos de chave explícitos:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e o curinga `"*"`.
  Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.

Ordem de resolução (a mais específica prevalece):

1. correspondência em `toolsBySender` do grupo/canal
2. `tools` do grupo/canal
3. correspondência em `toolsBySender` do padrão (`"*"`)
4. `tools` do padrão (`"*"`)

Exemplo (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Observações:

- Restrições de ferramentas por grupo/canal são aplicadas além da política global/de agente de ferramentas (deny ainda prevalece).
- Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlists de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` é configurado, as chaves funcionam como uma allowlist de grupos. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento padrão de menção.

Confusão comum: aprovação de pareamento por DM não é a mesma coisa que autorização de grupo.
Para canais que oferecem suporte a pareamento por DM, o armazenamento de pareamento libera apenas DMs. Comandos em grupo ainda exigem autorização explícita de remetente de grupo nas allowlists de configuração, como `groupAllowFrom` ou o fallback de configuração documentado para aquele canal.

Intenções comuns (copiar/colar):

1. Desativar todas as respostas em grupo

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Permitir apenas grupos específicos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Permitir todos os grupos, mas exigir menção (explícito)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Apenas o proprietário pode acionar em grupos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Ativação (somente proprietário)

Proprietários de grupo podem alternar a ativação por grupo:

- `/activation mention`
- `/activation always`

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou pelo próprio E.164 do bot quando não definido). Envie o comando como uma mensagem independente. Outras superfícies atualmente ignoram `/activation`.

## Campos de contexto

Payloads recebidos de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do bloqueio por menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Observações específicas do canal:

- O BlueBubbles pode opcionalmente enriquecer participantes sem nome de grupos do macOS a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso fica desativado por padrão e só é executado depois que o bloqueio normal de grupo for aprovado.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão em grupo. Ela lembra o modelo de responder como um humano, evitar tabelas Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais de `\n`.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou usar allowlist.
- Listar chats: `imsg chats --limit 20`.
- Respostas em grupo sempre retornam para o mesmo `chat_id`.

## Especificidades do WhatsApp

Consulte [Mensagens em grupo](/pt-BR/channels/group-messages) para o comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menções).
