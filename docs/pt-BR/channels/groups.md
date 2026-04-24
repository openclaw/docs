---
read_when:
    - Alterar o comportamento do chat em grupo ou o bloqueio por menção
summary: Comportamento de chat em grupo em todas as superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-24T05:41:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

O OpenClaw trata chats em grupo de forma consistente em todas as superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

O OpenClaw “vive” nas suas próprias contas de mensagens. Não existe um usuário de bot separado do WhatsApp.
Se **você** estiver em um grupo, o OpenClaw poderá ver esse grupo e responder nele.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- As respostas exigem uma menção, a menos que você desative explicitamente o bloqueio por menção.

Em outras palavras: remetentes permitidos na allowlist podem acionar o OpenClaw ao mencioná-lo.

> Resumo
>
> - O acesso por **DM** é controlado por `*.allowFrom`.
> - O acesso a **grupos** é controlado por `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
> - O **acionamento de respostas** é controlado pelo bloqueio por menção (`requireMention`, `/activation`).

Fluxo rápido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? não -> descartar
requireMention? sim -> mencionado? não -> armazenar apenas para contexto
caso contrário -> responder
```

## Visibilidade de contexto e allowlists

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados de encaminhamento).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto majoritariamente como foi recebido. Isso significa que as allowlists decidem principalmente quem pode acionar ações, não um limite universal de redação para cada trecho citado ou histórico.

O comportamento atual é específico por canal:

- Alguns canais já aplicam filtragem baseada no remetente para contexto suplementar em caminhos específicos (por exemplo, inicialização de thread do Slack, buscas de resposta/thread do Matrix).
- Outros canais ainda repassam o contexto de citação/resposta/encaminhamento como foi recebido.

Direção de reforço de segurança (planejada):

- `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes na allowlist.
- `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita para citação/resposta.

Até que esse modelo de reforço seja implementado de forma consistente em todos os canais, espere diferenças entre superfícies.

![Fluxo de mensagem de grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                     | O que definir                                              |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos, mas responder só em @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem chave `"*"`)      |
| Só você pode acionar em grupos               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao ID do grupo, para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego “pessoal” for por **DMs** e o seu tráfego “público” for por **grupos**.

Motivo: no modo de agente único, as DMs normalmente vão para a chave de sessão **principal** (`agent:main:main`), enquanto os grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandbox com `mode: "non-main"`, essas sessões de grupo serão executadas no backend de sandbox configurado, enquanto sua sessão principal de DM permanecerá no host. Docker é o backend padrão se você não escolher outro.

Isso oferece um único “cérebro” de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas

> Se você precisar de workspaces/personas realmente separados (“pessoal” e “público” nunca devem se misturar), use um segundo agente + bindings. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).

Exemplo (DMs no host, grupos em sandbox + ferramentas somente de mensagens):

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

Quer “grupos só podem ver a pasta X” em vez de “sem acesso ao host”? Mantenha `workspaceAccess: "none"` e monte apenas caminhos presentes na allowlist dentro do sandbox:

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

- Chaves de configuração e padrões: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de bind mounts: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Os rótulos da interface usam `displayName` quando disponível, formatado como `<channel>:<token>`.
- `#room` é reservado para salas/canais; chats em grupo usam `g-<slug>` (minúsculas, espaços -> `-`, mantendo `#@+._-`).

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
      groupAllowFrom: ["123456789"], // ID numérico de usuário do Telegram (o assistente pode resolver @username)
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
| `"open"`      | Grupos ignoram allowlists; o bloqueio por menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens de grupo.         |
| `"allowlist"` | Permite apenas grupos/salas que correspondam à allowlist configurada. |

Observações:

- `groupPolicy` é separado do bloqueio por menção (que exige @menções).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
- Aprovações de pareamento de DM (entradas armazenadas em `*-allowFrom`) se aplicam apenas ao acesso por DM; a autorização de remetente em grupo permanece explícita nas allowlists de grupo.
- Discord: a allowlist usa `channels.discord.guilds.<id>.channels`.
- Slack: a allowlist usa `channels.slack.channels`.
- Matrix: a allowlist usa `channels.matrix.groups`. Prefira IDs de sala ou aliases; a busca por nome de sala ingressada é feita como best-effort, e nomes não resolvidos são ignorados em runtime. Use `channels.matrix.groupAllowFrom` para restringir remetentes; allowlists `users` por sala também são compatíveis.
- DMs em grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
- A allowlist do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); os prefixos não diferenciam maiúsculas de minúsculas.
- O padrão é `groupPolicy: "allowlist"`; se sua allowlist de grupo estiver vazia, as mensagens de grupo serão bloqueadas.
- Segurança em runtime: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo recua para um modo fail-closed (geralmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlists de grupo (`*.groups`, `*.groupAllowFrom`, allowlist específica do canal)
3. bloqueio por menção (`requireMention`, `/activation`)

## Bloqueio por menção (padrão)

Mensagens de grupo exigem uma menção, a menos que isso seja sobrescrito por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita quando o canal
oferece suporte a metadados de resposta. Citar uma mensagem do bot também pode contar como uma menção implícita
em canais que expõem metadados de citação. Os casos internos atuais incluem
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

- `mentionPatterns` são padrões regex seguros sem diferenciação entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
- Superfícies que fornecem menções explícitas ainda passam; os padrões são um fallback.
- Sobrescrita por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
- O bloqueio por menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` configurados).
- Os padrões do Discord ficam em `channels.discord.guilds."*"` (sobrescritíveis por guild/canal).
- O contexto do histórico de grupo é encapsulado de forma uniforme entre canais e é **apenas pendente** (mensagens ignoradas devido ao bloqueio por menção); use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para sobrescritas. Defina `0` para desativar.

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal permitem restringir quais ferramentas ficam disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permitir/negar ferramentas para o grupo inteiro.
- `toolsBySender`: sobrescritas por remetente dentro do grupo.
  Use prefixos de chave explícitos:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e curinga `"*"`.
  Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.

Ordem de resolução (a mais específica prevalece):

1. correspondência de `toolsBySender` do grupo/canal
2. `tools` do grupo/canal
3. correspondência de `toolsBySender` do padrão (`"*"`)
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

- As restrições de ferramentas por grupo/canal são aplicadas além da política global/de agente de ferramentas (deny ainda prevalece).
- Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlists de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves funcionam como uma allowlist de grupo. Use `"*"` para permitir todos os grupos e ainda assim definir o comportamento padrão de menção.

Confusão comum: aprovação de pareamento de DM não é a mesma coisa que autorização de grupo.
Para canais que oferecem suporte a pareamento de DM, o armazenamento de pareamento libera apenas DMs. Comandos de grupo ainda exigem autorização explícita do remetente do grupo a partir de allowlists de configuração, como `groupAllowFrom` ou o fallback de configuração documentado para esse canal.

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

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou pelo E.164 do próprio bot quando não definido). Envie o comando como uma mensagem isolada. Outras superfícies atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do bloqueio por menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Observações específicas do canal:

- O BlueBubbles pode opcionalmente enriquecer participantes sem nome de grupos do macOS a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso vem desativado por padrão e só é executado depois que o bloqueio normal de grupo passa.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ela lembra o modelo de responder como um humano, evitar tabelas Markdown, minimizar linhas vazias, seguir o espaçamento normal de chat e evitar digitar sequências literais `\n`. Nomes de grupo e rótulos de participantes originados do canal são renderizados como metadados não confiáveis em bloco cercado, não como instruções inline do sistema.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou usar allowlist.
- Listar chats: `imsg chats --limit 20`.
- Respostas em grupo sempre voltam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompt de sistema do WhatsApp, incluindo resolução de prompt de grupo e direto, comportamento de curinga e semântica de sobrescrita de conta.

## Especificidades do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menção).

## Relacionado

- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Grupos de broadcast](/pt-BR/channels/broadcast-groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Pareamento](/pt-BR/channels/pairing)
