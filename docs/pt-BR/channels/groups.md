---
read_when:
    - Alterando o comportamento do chat em grupo ou o controle por menção
sidebarTitle: Groups
summary: Comportamento de chat em grupo em todas as superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-05-02T05:41:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata chats em grupo de forma consistente entre superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário de bot separado no WhatsApp. Se **você** estiver em um grupo, o OpenClaw poderá ver esse grupo e responder nele.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente o bloqueio por menção.
- Respostas finais normais em grupos/canais são privadas por padrão. Saída visível na sala usa a ferramenta `message`.

Tradução: remetentes na lista de permissões podem acionar o OpenClaw mencionando-o.

<Note>
**TL;DR**

- **Acesso por DM** é controlado por `*.allowFrom`.
- **Acesso a grupos** é controlado por `*.groupPolicy` + listas de permissões (`*.groups`, `*.groupAllowFrom`).
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
Isso significa que o agente ainda processa a rodada e pode atualizar a memória/estado da sessão, mas sua resposta final normal não é publicada automaticamente de volta na sala. Para falar de forma visível, o agente usa `message(action=send)`.

Se a ferramenta de mensagens não estiver disponível sob a política de ferramentas ativa, o OpenClaw recorre a respostas visíveis automáticas em vez de suprimir silenciosamente a resposta.
`openclaw doctor` avisa sobre essa incompatibilidade.

Para chats diretos e qualquer outra rodada de origem, use `messages.visibleReplies: "message_tool"` para aplicar globalmente o mesmo comportamento de resposta visível somente por ferramenta. Arnês também podem escolher isso como padrão quando não definido; o arnês do Codex faz isso para chats diretos em modo Codex. `messages.groupChat.visibleReplies` continua sendo a substituição mais específica para salas de grupo/canal.

Isso substitui o padrão antigo de forçar o modelo a responder `NO_REPLY` para a maioria das rodadas em modo de escuta. No modo somente por ferramenta, não fazer nada visível simplesmente significa não chamar a ferramenta de mensagens.

Indicadores de digitação ainda são enviados enquanto o agente trabalha no modo somente por ferramenta. O modo padrão de digitação em grupo é elevado de "message" para "instant" nessas rodadas porque pode nunca haver texto normal de mensagem do assistente antes de o agente decidir se chamará a ferramenta de mensagens. A configuração explícita do modo de digitação ainda prevalece.

Para restaurar respostas finais automáticas legadas para salas de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

O Gateway recarrega automaticamente a configuração de `messages` depois que o arquivo é salvo. Reinicie somente quando a observação de arquivos ou o recarregamento de configuração estiver desativado na implantação.

Para exigir que a saída visível passe pela ferramenta de mensagens em todos os chats de origem:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Comandos slash nativos (Discord, Telegram e outras superfícies com suporte nativo a comandos) ignoram `visibleReplies: "message_tool"` e sempre respondem de forma visível para que a interface de comando nativa do canal receba a resposta esperada. Isso se aplica somente a rodadas de comando nativo validadas; comandos `/...` digitados como texto e rodadas comuns de chat ainda seguem o padrão de grupo configurado.

## Visibilidade de contexto e listas de permissões

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permissões específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados encaminhados).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto em grande parte como recebido. Isso significa que as listas de permissões decidem principalmente quem pode acionar ações, não um limite universal de redação para cada trecho citado ou histórico.

<AccordionGroup>
  <Accordion title="O comportamento atual é específico por canal">
    - Alguns canais já aplicam filtragem baseada em remetente para contexto suplementar em caminhos específicos (por exemplo, semeadura de threads do Slack, buscas de resposta/thread do Matrix).
    - Outros canais ainda passam contexto de citação/resposta/encaminhamento como recebido.

  </Accordion>
  <Accordion title="Direção de reforço (planejada)">
    - `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
    - `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes na lista de permissões.
    - `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita de citação/resposta.

    Até que esse modelo de reforço seja implementado de forma consistente entre canais, espere diferenças por superfície.

  </Accordion>
</AccordionGroup>

![Fluxo de mensagens de grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                     | O que configurar                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos, mas responder apenas a @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem chave `"*"` )     |
| Apenas você pode acionar em grupos           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar um conjunto de remetentes confiáveis entre canais | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas reutilizáveis de remetentes permitidos, consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao ID do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: mensagens diretas pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego "pessoal" são **mensagens diretas** e o seu tráfego "público" são **grupos**.

Por quê: no modo de agente único, mensagens diretas normalmente chegam à chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandboxing com `mode: "non-main"`, essas sessões de grupo serão executadas no backend de sandbox configurado, enquanto sua sessão principal de mensagens diretas permanece no host. Docker é o backend padrão se você não escolher um.

Isso dá a você um "cérebro" de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **Mensagens diretas**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas

<Note>
Se você precisar de workspaces/personas realmente separados ("pessoal" e "público" nunca devem se misturar), use um segundo agente + vinculações. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Mensagens diretas no host, grupos em sandbox">
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
  <Tab title="Grupos veem apenas uma pasta na lista de permissões">
    Quer que "grupos só possam ver a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte somente caminhos permitidos no sandbox:

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
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs política de ferramentas vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de montagens bind: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Rótulos da UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
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
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupos ignoram listas de permissões; o bloqueio por menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens de grupo.          |
| `"allowlist"` | Permite somente grupos/salas que correspondem à lista de permissões configurada. |

<AccordionGroup>
  <Accordion title="Observações por canal">
    - `groupPolicy` é separado do bloqueio por menção (que exige @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao ID de grupo Signal de entrada ou ao telefone/UUID do remetente.
    - Aprovações de pareamento por mensagem direta (entradas de armazenamento `*-allowFrom`) se aplicam somente ao acesso por mensagem direta; a autorização de remetente de grupo permanece explícita para listas de permissões de grupo.
    - Discord: a lista de permissões usa `channels.discord.guilds.<id>.channels`.
    - Slack: a lista de permissões usa `channels.slack.channels`.
    - Matrix: a lista de permissões usa `channels.matrix.groups`. Prefira IDs ou aliases de sala; a busca por nome de sala ingressada é de melhor esforço, e nomes não resolvidos são ignorados em runtime. Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissões `users` por sala também são compatíveis.
    - DMs de grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - A lista de permissões do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); prefixos não diferenciam maiúsculas de minúsculas.
    - O padrão é `groupPolicy: "allowlist"`; se a sua lista de permissões de grupo estiver vazia, mensagens de grupo serão bloqueadas.
    - Segurança em runtime: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo recorre a um modo fechado por falha (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de permissões de grupos">
    Listas de permissões de grupos (`*.groups`, `*.groupAllowFrom`, lista de permissões específica do canal).
  </Step>
  <Step title="Controle de menções">
    Controle de menções (`requireMention`, `/activation`).
  </Step>
</Steps>

## Controle de menções (padrão)

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
  <Accordion title="Observações sobre controle de menções">
    - `mentionPatterns` são padrões regex seguros sem diferenciação entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
    - Superfícies que fornecem menções explícitas ainda passam; os padrões são um fallback.
    - Substituição por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
    - O controle de menções só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` estão configurados).
    - Colocar um grupo ou remetente na lista de permissões não desativa o controle de menções; defina `requireMention` desse grupo como `false` quando todas as mensagens devem acionar.
    - O contexto de prompt de chat em grupo carrega a instrução de resposta silenciosa resolvida a cada turno; arquivos do workspace não devem duplicar a mecânica de `NO_REPLY`.
    - Grupos em que respostas silenciosas são permitidas tratam turnos limpos vazios ou apenas de raciocínio do modelo como silenciosos, equivalente a `NO_REPLY`. Chats diretos fazem o mesmo somente quando respostas silenciosas diretas são explicitamente permitidas; caso contrário, respostas vazias continuam sendo turnos de agente com falha.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituíveis por guilda/canal).
    - O contexto do histórico de grupos é encapsulado de forma uniforme entre canais e é **somente pendente** (mensagens ignoradas devido ao controle de menções); use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desativar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal oferecem suporte à restrição de quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos de chave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e o curinga `"*"`. Chaves legadas sem prefixo ainda são aceitas e correspondidas somente como `id:`.

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

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves atuam como uma lista de permissões de grupos. Use `"*"` para permitir todos os grupos e ainda definir o comportamento padrão de menção.

<Warning>
Confusão comum: aprovação de pareamento por DM não é o mesmo que autorização de grupo. Para canais que oferecem suporte a pareamento por DM, o armazenamento de pareamento desbloqueia apenas DMs. Comandos de grupo ainda exigem autorização explícita de remetente de grupo pelas listas de permissões de configuração, como `groupAllowFrom`, ou pelo fallback de configuração documentado para esse canal.
</Warning>

Intenções comuns (copiar/colar):

<Tabs>
  <Tab title="Desativar todas as respostas de grupo">
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
- `WasMentioned` (resultado do controle de menções)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Observações específicas por canal:

- BlueBubbles pode enriquecer opcionalmente participantes de grupos macOS sem nome a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso fica desativado por padrão e só é executado depois que o controle normal de grupo passa.

O prompt do sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo de responder como uma pessoa, evitar tabelas Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`. Nomes de grupos e rótulos de participantes originados do canal são renderizados como metadados não confiáveis em blocos cercados, não como instruções de sistema inline.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou colocar em lista de permissões.
- Listar chats: `imsg chats --limit 20`.
- Respostas de grupo sempre voltam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Veja [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompt de sistema do WhatsApp, incluindo resolução de prompts de grupo e diretos, comportamento de curinga e semântica de substituição por conta.

## Especificidades do WhatsApp

Veja [Mensagens de grupo](/pt-BR/channels/group-messages) para comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menções).

## Relacionados

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
