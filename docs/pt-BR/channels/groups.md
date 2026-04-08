---
read_when:
    - Ao alterar o comportamento de chats em grupo ou o controle por menção
summary: Comportamento de chats em grupo entre superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-08T02:14:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5045badbba30587c8f1bf27f6b940c7c471a95c57093c9adb142374413ac81e
    source_path: channels/groups.md
    workflow: 15
---

# Grupos

O OpenClaw trata chats em grupo de forma consistente entre superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

O OpenClaw “vive” nas suas próprias contas de mensagens. Não existe um usuário de bot separado no WhatsApp.
Se **você** estiver em um grupo, o OpenClaw poderá ver esse grupo e responder nele.

Comportamento padrão:

- Os grupos são restritos (`groupPolicy: "allowlist"`).
- As respostas exigem uma menção, a menos que você desative explicitamente o controle por menção.

Em outras palavras: remetentes na allowlist podem acionar o OpenClaw ao mencioná-lo.

> Resumindo
>
> - O **acesso por DM** é controlado por `*.allowFrom`.
> - O **acesso em grupos** é controlado por `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
> - O **acionamento de respostas** é controlado pelo controle por menção (`requireMention`, `/activation`).

Fluxo rápido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? não -> descartar
requireMention? yes -> mencionado? não -> armazenar apenas para contexto
caso contrário -> responder
```

## Visibilidade de contexto e allowlists

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists específicas de canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados encaminhados).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto principalmente como foi recebido. Isso significa que as allowlists decidem principalmente quem pode acionar ações, e não um limite universal de redação para cada trecho citado ou histórico.

O comportamento atual é específico por canal:

- Alguns canais já aplicam filtragem baseada no remetente para contexto suplementar em caminhos específicos (por exemplo, semeadura de thread no Slack, buscas de resposta/thread no Matrix).
- Outros canais ainda repassam o contexto de citação/resposta/encaminhamento como foi recebido.

Direção de endurecimento (planejado):

- `contextVisibility: "all"` (padrão) mantém o comportamento atual de como foi recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes na allowlist.
- `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita para citação/resposta.

Até que esse modelo de endurecimento seja implementado de forma consistente entre os canais, espere diferenças por superfície.

![Fluxo de mensagens em grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                     | O que definir                                              |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos, mas responder só a @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem a chave `"*"`)    |
| Só você pode acionar em grupos               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego “pessoal” for em **DMs** e o seu tráfego “público” for em **grupos**.

Motivo: no modo de agente único, DMs normalmente vão para a chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandboxing com `mode: "non-main"`, essas sessões de grupo serão executadas no Docker enquanto sua sessão principal de DM permanecerá no host.

Isso oferece um único “cérebro” de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas (Docker)

> Se você precisar de workspaces/personas realmente separados (“pessoal” e “público” nunca devem se misturar), use um segundo agente + bindings. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).

Exemplo (DMs no host, grupos em sandbox + ferramentas apenas de mensagens):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Quer “grupos só podem ver a pasta X” em vez de “sem acesso ao host”? Mantenha `workspaceAccess: "none"` e monte apenas caminhos na allowlist dentro da sandbox:

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

- Chaves e padrões de configuração: [Configuração do gateway](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de bind mounts: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Os rótulos na UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Política      | Comportamento                                               |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Grupos ignoram allowlists; o controle por menção ainda se aplica. |
| `"disabled"`  | Bloqueia totalmente todas as mensagens de grupo.            |
| `"allowlist"` | Permite apenas grupos/salas que correspondam à allowlist configurada. |

Observações:

- `groupPolicy` é separado do controle por menção (que exige @menções).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
- Aprovações de pareamento por DM (entradas armazenadas em `*-allowFrom`) se aplicam apenas ao acesso por DM; a autorização de remetentes em grupo continua explícita nas allowlists de grupo.
- Discord: a allowlist usa `channels.discord.guilds.<id>.channels`.
- Slack: a allowlist usa `channels.slack.channels`.
- Matrix: a allowlist usa `channels.matrix.groups`. Prefira IDs ou aliases de sala; a busca por nome de sala ingressada é best-effort, e nomes não resolvidos são ignorados em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; allowlists `users` por sala também são suportadas.
- DMs em grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- A allowlist do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); os prefixos não diferenciam maiúsculas de minúsculas.
- O padrão é `groupPolicy: "allowlist"`; se sua allowlist de grupos estiver vazia, as mensagens de grupo serão bloqueadas.
- Segurança em tempo de execução: quando um bloco de provider está totalmente ausente (`channels.<provider>` ausente), a política de grupo recua para um modo fail-closed (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlists de grupo (`*.groups`, `*.groupAllowFrom`, allowlist específica do canal)
3. controle por menção (`requireMention`, `/activation`)

## Controle por menção (padrão)

Mensagens em grupo exigem uma menção, a menos que isso seja sobrescrito por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita quando o canal
oferece suporte a metadados de resposta. Citar uma mensagem do bot também pode contar como uma menção implícita em canais que expõem metadados de citação. Os casos integrados atuais incluem
Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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

- `mentionPatterns` são padrões regex seguros e sem diferenciação entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
- Superfícies que fornecem menções explícitas ainda passam; os padrões são um fallback.
- Sobrescrita por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
- O controle por menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` configurados).
- Os padrões do Discord ficam em `channels.discord.guilds."*"` (sobrescritíveis por guild/canal).
- O contexto do histórico de grupo é encapsulado de forma uniforme entre os canais e é **apenas pendente** (mensagens ignoradas devido ao controle por menção); use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para sobrescritas. Defina `0` para desativar.

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal oferecem suporte à restrição de quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permitir/negar ferramentas para todo o grupo.
- `toolsBySender`: sobrescritas por remetente dentro do grupo.
  Use prefixos explícitos de chave:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e curinga `"*"`.
  Chaves legadas sem prefixo ainda são aceitas e correspondem apenas a `id:`.

Ordem de resolução (a mais específica vence):

1. correspondência de `toolsBySender` do grupo/canal
2. `tools` do grupo/canal
3. correspondência de `toolsBySender` padrão (`"*"`)
4. `tools` padrão (`"*"`)

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

- As restrições de ferramentas por grupo/canal são aplicadas além da política global/de agente para ferramentas (negação ainda vence).
- Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlists de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves funcionam como uma allowlist de grupos. Use `"*"` para permitir todos os grupos e ainda definir o comportamento padrão de menção.

Confusão comum: aprovação de pareamento por DM não é a mesma coisa que autorização de grupo.
Para canais com suporte a pareamento por DM, o armazenamento de pareamento libera apenas DMs. Comandos em grupo ainda exigem autorização explícita de remetente em grupo a partir de allowlists de configuração como `groupAllowFrom` ou o fallback de configuração documentado para esse canal.

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

4. Somente o proprietário pode acionar em grupos (WhatsApp)

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

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do controle por menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Observações específicas por canal:

- O BlueBubbles pode opcionalmente enriquecer participantes sem nome de grupos no macOS a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso vem desativado por padrão e só é executado depois que o controle normal de grupo é aprovado.

O prompt de sistema do agente inclui uma introdução sobre grupos no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo de responder como um humano, evitar tabelas em Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou usar allowlist.
- Listar chats: `imsg chats --limit 20`.
- Respostas em grupo sempre retornam ao mesmo `chat_id`.

## Especificidades do WhatsApp

Consulte [Mensagens em grupo](/pt-BR/channels/group-messages) para o comportamento específico do WhatsApp (injeção de histórico, detalhes de tratamento de menções).
