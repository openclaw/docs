---
read_when:
    - Alterando o comportamento de chats em grupo ou o controle por menções
sidebarTitle: Groups
summary: Comportamento de chats em grupo nas diferentes superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-26T11:23:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw trata chats em grupo de forma consistente nas diferentes superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

O OpenClaw "vive" nas suas próprias contas de mensagens. Não existe um usuário de bot separado do WhatsApp. Se **você** está em um grupo, o OpenClaw pode ver esse grupo e responder nele.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente o controle por menções.

Tradução: remetentes na allowlist podem acionar o OpenClaw mencionando-o.

<Note>
**Resumo**

- **Acesso por DM** é controlado por `*.allowFrom`.
- **Acesso em grupos** é controlado por `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Disparo de respostas** é controlado pelo controle por menções (`requireMention`, `/activation`).
</Note>

Fluxo rápido (o que acontece com uma mensagem em grupo):

```
groupPolicy? disabled -> descarta
groupPolicy? allowlist -> grupo permitido? não -> descarta
requireMention? yes -> mencionado? não -> armazena apenas para contexto
caso contrário -> responde
```

## Visibilidade de contexto e allowlists

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de disparo**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados de encaminhamento).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto principalmente como foi recebido. Isso significa que as allowlists decidem principalmente quem pode acionar ações, não um limite universal de redação para cada trecho citado ou histórico.

<AccordionGroup>
  <Accordion title="O comportamento atual é específico de cada canal">
    - Alguns canais já aplicam filtragem baseada em remetente para contexto suplementar em caminhos específicos (por exemplo, inicialização de thread no Slack, buscas de resposta/thread no Matrix).
    - Outros canais ainda repassam o contexto de citação/resposta/encaminhamento como foi recebido.
  </Accordion>
  <Accordion title="Direção de endurecimento (planejada)">
    - `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
    - `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes na allowlist.
    - `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita para citação/resposta.

    Até que esse modelo de endurecimento seja implementado de forma consistente entre os canais, espere diferenças conforme a superfície.

  </Accordion>
</AccordionGroup>

![Fluxo de mensagens em grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                     | O que definir                                             |
| -------------------------------------------- | --------------------------------------------------------- |
| Permitir todos os grupos, mas responder só em @mentions | `groups: { "*": { requireMention: true } }`     |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                 |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem chave `"*"`)     |
| Só você pode acionar em grupos               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo, para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego "pessoal" for **DMs** e o seu tráfego "público" for **grupos**.

Por quê: no modo de agente único, DMs normalmente chegam à chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandboxing com `mode: "non-main"`, essas sessões de grupo serão executadas no backend de sandbox configurado, enquanto sua sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher outro.

Isso oferece um único "cérebro" de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas

<Note>
Se você precisar de workspaces/personas realmente separados ("pessoal" e "público" nunca devem se misturar), use um segundo agente + bindings. Veja [Roteamento Multi-Agent](/pt-BR/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs no host, grupos em sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // grupos/canais são non-main -> em sandbox
            scope: "session", // isolamento mais forte (um container por grupo/canal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Se allow não estiver vazia, todo o resto será bloqueado (deny ainda prevalece).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Grupos veem apenas uma pasta na allowlist">
    Quer "grupos só podem ver a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte apenas os caminhos na allowlist dentro do sandbox:

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

  </Tab>
</Tabs>

Relacionados:

- Chaves de configuração e padrões: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de bind mounts: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Os rótulos da UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
- `#room` é reservado para salas/canais; chats em grupo usam `g-<slug>` (minúsculas, espaços -> `-`, mantém `#@+._-`).

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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Política      | Comportamento                                                |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupos ignoram allowlists; o controle por menções ainda se aplica. |
| `"disabled"`  | Bloqueia totalmente todas as mensagens de grupo.             |
| `"allowlist"` | Permite apenas grupos/salas que correspondem à allowlist configurada. |

<AccordionGroup>
  <Accordion title="Observações por canal">
    - `groupPolicy` é separado do controle por menções (que exige @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usam `groupAllowFrom` (fallback: `allowFrom` explícito).
    - Aprovações de pareamento de DM (entradas armazenadas em `*-allowFrom`) aplicam-se apenas ao acesso por DM; a autorização de remetentes em grupo continua explícita nas allowlists de grupo.
    - Discord: a allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: a allowlist usa `channels.slack.channels`.
    - Matrix: a allowlist usa `channels.matrix.groups`. Prefira IDs ou aliases de sala; a busca por nome de sala ingressada é best-effort, e nomes não resolvidos são ignorados em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; allowlists `users` por sala também são compatíveis.
    - DMs em grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - A allowlist do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); os prefixos não diferenciam maiúsculas de minúsculas.
    - O padrão é `groupPolicy: "allowlist"`; se sua allowlist de grupos estiver vazia, mensagens de grupo serão bloqueadas.
    - Segurança em tempo de execução: quando um bloco de provider está completamente ausente (`channels.<provider>` ausente), a política de grupo recai para um modo fail-closed (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.
  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação para mensagens em grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlists de grupo">
    Allowlists de grupo (`*.groups`, `*.groupAllowFrom`, allowlist específica do canal).
  </Step>
  <Step title="Controle por menções">
    Controle por menções (`requireMention`, `/activation`).
  </Step>
</Steps>

## Controle por menções (padrão)

Mensagens de grupo exigem uma menção, a menos que isso seja substituído por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita quando o canal oferece suporte a metadados de resposta. Citar uma mensagem do bot também pode contar como uma menção implícita em canais que expõem metadados de citação. Os casos integrados atuais incluem Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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

<AccordionGroup>
  <Accordion title="Observações sobre controle por menções">
    - `mentionPatterns` são padrões regex seguros com correspondência sem distinção entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
    - Superfícies que fornecem menções explícitas ainda passam; os padrões são um fallback.
    - Substituição por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
    - O controle por menções só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` configurados).
    - Grupos em que respostas silenciosas são permitidas tratam turnos do modelo vazios limpos ou apenas de raciocínio como silenciosos, equivalentes a `NO_REPLY`. Chats diretos ainda tratam respostas vazias como uma falha do turno do agente.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituíveis por guild/canal).
    - O contexto do histórico de grupo é encapsulado de forma uniforme entre canais e é **somente pendente** (mensagens ignoradas devido ao controle por menções); use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desativar.
  </Accordion>
</AccordionGroup>

## Restrições de ferramentas para grupo/canal (opcional)

Algumas configurações de canal oferecem suporte para restringir quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos explícitos de chave: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e curinga `"*"`. Chaves legadas sem prefixo ainda são aceitas e correspondem apenas a `id:`.

Ordem de resolução (a mais específica vence):

<Steps>
  <Step title="toolsBySender do grupo">
    Correspondência de `toolsBySender` do grupo/canal.
  </Step>
  <Step title="tools do grupo">
    `tools` do grupo/canal.
  </Step>
  <Step title="toolsBySender padrão">
    Correspondência de `toolsBySender` padrão (`"*"`).
  </Step>
  <Step title="tools padrão">
    `tools` padrão (`"*"`).
  </Step>
</Steps>

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

<Note>
Restrições de ferramentas de grupo/canal são aplicadas além da política global/de agente para ferramentas (deny ainda prevalece). Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlists de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves atuam como uma allowlist de grupo. Use `"*"` para permitir todos os grupos e ainda assim definir o comportamento padrão de menção.

<Warning>
Confusão comum: aprovação de pareamento de DM não é o mesmo que autorização de grupo. Para canais que oferecem suporte a pareamento de DM, o armazenamento de pareamento desbloqueia apenas DMs. Comandos de grupo ainda exigem autorização explícita do remetente do grupo a partir de allowlists de configuração, como `groupAllowFrom`, ou do fallback de configuração documentado para esse canal.
</Warning>

Intenções comuns (copiar/colar):

<Tabs>
  <Tab title="Desativar todas as respostas em grupo">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Permitir apenas grupos específicos (WhatsApp)">
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
  </Tab>
  <Tab title="Permitir todos os grupos, mas exigir menção">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Disparos apenas do proprietário (WhatsApp)">
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
  </Tab>
</Tabs>

## Activation (somente proprietário)

Proprietários de grupo podem alternar a ativação por grupo:

- `/activation mention`
- `/activation always`

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou pelo próprio E.164 do bot quando não definido). Envie o comando como uma mensagem independente. Outras superfícies atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do controle por menções)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Observações específicas por canal:

- O BlueBubbles pode opcionalmente enriquecer participantes sem nome de grupos do macOS a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso fica desativado por padrão e só é executado depois que o controle normal de grupo é aprovado.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ela lembra o modelo de responder como um humano, evitar tabelas Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`. Nomes de grupos e rótulos de participantes vindos do canal são renderizados como metadados não confiáveis em bloco cercado, não como instruções inline de sistema.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou usar allowlist.
- Listar chats: `imsg chats --limit 20`.
- Respostas em grupo sempre voltam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Veja [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompts de sistema do WhatsApp, incluindo resolução de prompts de grupo e diretos, comportamento de curinga e semântica de substituição por conta.

## Especificidades do WhatsApp

Veja [Mensagens em grupo](/pt-BR/channels/group-messages) para o comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menções).

## Relacionados

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Mensagens em grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
