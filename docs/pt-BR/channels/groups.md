---
read_when:
    - Alterar o comportamento de chats em grupo ou o controle por menções
sidebarTitle: Groups
summary: Comportamento de chats em grupo em diferentes superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-30T16:27:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata conversas em grupo de forma consistente entre as superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário de bot separado no WhatsApp. Se **você** está em um grupo, o OpenClaw consegue ver esse grupo e responder ali.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente o bloqueio por menção.
- Respostas finais normais em grupos/canais são privadas por padrão. A saída visível na sala usa a ferramenta `message`.

Tradução: remetentes na allowlist podem acionar o OpenClaw mencionando-o.

<Note>
**TL;DR**

- **Acesso por DM** é controlado por `*.allowFrom`.
- **Acesso a grupos** é controlado por `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Acionamento de resposta** é controlado pelo bloqueio por menção (`requireMention`, `/activation`).

</Note>

Fluxo rápido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Respostas visíveis

Para salas de grupo/canal, o OpenClaw usa por padrão `messages.groupChat.visibleReplies: "message_tool"`.
Isso significa que o agente ainda processa o turno e pode atualizar o estado de memória/sessão, mas sua resposta final normal não é publicada automaticamente de volta na sala. Para falar de forma visível, o agente usa `message(action=send)`.

Para chats diretos e qualquer outro turno de origem, use `messages.visibleReplies: "message_tool"` para aplicar globalmente o mesmo comportamento de resposta visível apenas por ferramenta. `messages.groupChat.visibleReplies` continua sendo a substituição mais específica para salas de grupo/canal.

Isso substitui o padrão antigo de forçar o modelo a responder `NO_REPLY` na maioria dos turnos em modo de observação. No modo apenas por ferramenta, não fazer nada visível simplesmente significa não chamar a ferramenta de mensagem.

Indicadores de digitação ainda são enviados enquanto o agente trabalha no modo apenas por ferramenta. O modo padrão de digitação em grupo é atualizado de "message" para "instant" nesses turnos, porque talvez nunca haja texto normal de mensagem do assistente antes de o agente decidir se deve chamar a ferramenta de mensagem. A configuração explícita do modo de digitação ainda prevalece.

Para restaurar as respostas finais automáticas legadas para salas de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

O gateway recarrega a configuração de `messages` automaticamente após o arquivo ser salvo. Reinicie apenas
quando o monitoramento de arquivos ou o recarregamento de configuração estiver desativado na implantação.

Para exigir que a saída visível passe pela ferramenta de mensagem em todos os chats de origem:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Comandos de barra nativos (Discord, Telegram e outras superfícies com suporte nativo a comandos) ignoram `visibleReplies: "message_tool"` e sempre respondem de forma visível para que a interface de comando nativa do canal receba a resposta esperada. Isso se aplica apenas a turnos de comando nativo validados; comandos `/...` digitados como texto e turnos comuns de chat ainda seguem o padrão de grupo configurado.

## Visibilidade de contexto e allowlists

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados encaminhados).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto quase como foi recebido. Isso significa que allowlists decidem principalmente quem pode acionar ações, não um limite universal de redação para cada trecho citado ou histórico.

<AccordionGroup>
  <Accordion title="O comportamento atual é específico por canal">
    - Alguns canais já aplicam filtragem baseada em remetente para contexto suplementar em caminhos específicos (por exemplo, semeadura de threads do Slack, buscas de resposta/thread do Matrix).
    - Outros canais ainda repassam contexto de citação/resposta/encaminhamento como recebido.

  </Accordion>
  <Accordion title="Direção de reforço (planejada)">
    - `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
    - `contextVisibility: "allowlist"` filtra contexto suplementar para remetentes na allowlist.
    - `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita de citação/resposta.

    Até que esse modelo de reforço seja implementado de forma consistente entre os canais, espere diferenças por superfície.

  </Accordion>
</AccordionGroup>

![Fluxo de mensagem de grupo](/images/groups-flow.svg)

Se você quer...

| Objetivo                                     | O que configurar                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos, mas responder apenas em @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem chave `"*"` )     |
| Apenas você pode acionar em grupos           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego "pessoal" são **DMs** e o seu tráfego "público" são **grupos**.

Por quê: no modo de agente único, DMs normalmente chegam à chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandboxing com `mode: "non-main"`, essas sessões de grupo rodam no backend de sandbox configurado enquanto sua sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher um.

Isso dá a você um "cérebro" de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas

<Note>
Se você precisa de workspaces/personas realmente separados ("pessoal" e "público" nunca devem se misturar), use um segundo agente + bindings. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs no host, grupos em sandbox">
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
  </Tab>
  <Tab title="Grupos veem apenas uma pasta na allowlist">
    Quer que "grupos só possam ver a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte apenas caminhos na allowlist dentro do sandbox:

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

Relacionado:

- Chaves de configuração e padrões: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- Depurar por que uma ferramenta está bloqueada: [Sandbox vs Política de ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de montagens bind: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Rótulos da UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
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

| Política     | Comportamento                                               |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupos ignoram allowlists; o bloqueio por menção ainda se aplica. |
| `"disabled"`  | Bloqueia totalmente todas as mensagens de grupo.             |
| `"allowlist"` | Permite apenas grupos/salas que correspondem à allowlist configurada. |

<AccordionGroup>
  <Accordion title="Observações por canal">
    - `groupPolicy` é separado do bloqueio por menção (que exige @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao id de grupo Signal de entrada ou ao telefone/UUID do remetente.
    - Aprovações de pareamento por DM (entradas de armazenamento `*-allowFrom`) aplicam-se apenas ao acesso por DM; a autorização de remetente em grupo permanece explícita para allowlists de grupo.
    - Discord: a allowlist usa `channels.discord.guilds.<id>.channels`.
    - Slack: a allowlist usa `channels.slack.channels`.
    - Matrix: a allowlist usa `channels.matrix.groups`. Prefira IDs de sala ou aliases; a busca de nome de salas ingressadas é de melhor esforço, e nomes não resolvidos são ignorados em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; allowlists `users` por sala também são compatíveis.
    - DMs de grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - A allowlist do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); prefixos não diferenciam maiúsculas de minúsculas.
    - O padrão é `groupPolicy: "allowlist"`; se a allowlist de grupo estiver vazia, mensagens de grupo serão bloqueadas.
    - Segurança em tempo de execução: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo recua para um modo fail-closed (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlists de grupo">
    Allowlists de grupo (`*.groups`, `*.groupAllowFrom`, allowlist específica do canal).
  </Step>
  <Step title="Bloqueio por menção">
    Bloqueio por menção (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bloqueio por menção (padrão)

Mensagens de grupo exigem uma menção, a menos que sejam substituídas por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

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
  <Accordion title="Notas sobre controle por menção">
    - `mentionPatterns` são padrões regex seguros e sem diferenciação entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
    - Superfícies que fornecem menções explícitas ainda passam; os padrões são um fallback.
    - Substituição por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
    - O controle por menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` estão configurados).
    - Colocar um grupo ou remetente na lista de permissões não desativa o controle por menção; defina `requireMention` desse grupo como `false` quando todas as mensagens devem acionar.
    - O contexto do prompt de chat em grupo carrega a instrução resolvida de resposta silenciosa a cada turno; arquivos do workspace não devem duplicar a mecânica de `NO_REPLY`.
    - Grupos em que respostas silenciosas são permitidas tratam turnos do modelo limpos, vazios ou apenas de raciocínio como silenciosos, equivalentes a `NO_REPLY`. Chats diretos fazem o mesmo somente quando respostas silenciosas diretas são explicitamente permitidas; caso contrário, respostas vazias continuam sendo turnos de agente com falha.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituíveis por servidor/canal).
    - O contexto de histórico de grupo é encapsulado uniformemente entre canais e é **somente pendente** (mensagens ignoradas devido ao controle por menção); use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desativar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal permitem restringir quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos de chave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e o curinga `"*"`. Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.

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
Restrições de ferramentas por grupo/canal são aplicadas além da política global/de ferramentas do agente (negação ainda vence). Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permissões de grupos

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves atuam como uma lista de permissões de grupos. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento padrão de menção.

<Warning>
Confusão comum: a aprovação de pareamento por DM não é o mesmo que autorização de grupo. Para canais que oferecem suporte a pareamento por DM, o armazenamento de pareamento desbloqueia apenas DMs. Comandos de grupo ainda exigem autorização explícita do remetente do grupo por listas de permissões de configuração, como `groupAllowFrom`, ou pelo fallback de configuração documentado para esse canal.
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
  <Tab title="Acionamentos somente pelo proprietário (WhatsApp)">
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

## Ativação (somente proprietário)

Proprietários de grupos podem alternar a ativação por grupo:

- `/activation mention`
- `/activation always`

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou pelo E.164 próprio do bot quando não definido). Envie o comando como uma mensagem independente. Outras superfícies atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do controle por menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Notas específicas por canal:

- O BlueBubbles pode opcionalmente enriquecer participantes de grupos macOS sem nome a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso fica desativado por padrão e só é executado depois que o controle normal de grupo passa.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo de responder como uma pessoa, evitar tabelas em Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`. Nomes de grupos e rótulos de participantes provenientes do canal são renderizados como metadados não confiáveis em bloco de código, não como instruções de sistema inline.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou colocar na lista de permissões.
- Listar chats: `imsg chats --limit 20`.
- Respostas em grupo sempre voltam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompt de sistema do WhatsApp, incluindo resolução de prompts de grupo e diretos, comportamento de curinga e semântica de substituição de conta.

## Especificidades do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menções).

## Relacionados

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
