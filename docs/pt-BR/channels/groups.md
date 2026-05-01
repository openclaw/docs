---
read_when:
    - Alterando o comportamento de chats em grupo ou o controle por menções
sidebarTitle: Groups
summary: Comportamento de chats em grupo em diferentes superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-05-01T05:55:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata chats em grupo de forma consistente entre as superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário de bot separado no WhatsApp. Se **você** está em um grupo, o OpenClaw pode ver esse grupo e responder nele.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente o controle por menção.
- Respostas finais normais em grupos/canais são privadas por padrão. A saída visível na sala usa a ferramenta `message`.

Tradução: remetentes na lista de permissões podem acionar o OpenClaw mencionando-o.

<Note>
**TL;DR**

- **Acesso a DMs** é controlado por `*.allowFrom`.
- **Acesso a grupos** é controlado por `*.groupPolicy` + listas de permissões (`*.groups`, `*.groupAllowFrom`).
- **Acionamento de respostas** é controlado pelo controle por menção (`requireMention`, `/activation`).

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
Isso significa que o agente ainda processa a rodada e pode atualizar o estado de memória/sessão, mas sua resposta final normal não é publicada automaticamente de volta na sala. Para falar visivelmente, o agente usa `message(action=send)`.

Se a ferramenta de mensagem estiver indisponível sob a política de ferramentas ativa, o OpenClaw recorre a respostas visíveis automáticas em vez de suprimir silenciosamente a resposta.
`openclaw doctor` avisa sobre essa incompatibilidade.

Para chats diretos e qualquer outra rodada de origem, use `messages.visibleReplies: "message_tool"` para aplicar globalmente o mesmo comportamento de resposta visível somente por ferramenta. `messages.groupChat.visibleReplies` permanece como a substituição mais específica para salas de grupo/canal.

Isso substitui o padrão antigo de forçar o modelo a responder `NO_REPLY` para a maioria das rodadas em modo de observação. No modo somente por ferramenta, não fazer nada visível simplesmente significa não chamar a ferramenta de mensagem.

Indicadores de digitação ainda são enviados enquanto o agente trabalha no modo somente por ferramenta. O modo padrão de digitação em grupo é atualizado de "message" para "instant" para essas rodadas porque pode nunca haver texto normal de mensagem do assistente antes que o agente decida se deve chamar a ferramenta de mensagem. A configuração explícita de modo de digitação ainda prevalece.

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

O gateway recarrega a configuração `messages` automaticamente depois que o arquivo é salvo. Reinicie somente quando a observação de arquivos ou a recarga de configuração estiver desativada na implantação.

Para exigir que a saída visível passe pela ferramenta de mensagem para todo chat de origem:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Comandos de barra nativos (Discord, Telegram e outras superfícies com suporte nativo a comandos) ignoram `visibleReplies: "message_tool"` e sempre respondem visivelmente para que a interface de comando nativa do canal receba a resposta esperada. Isso se aplica somente a rodadas validadas de comando nativo; comandos `/...` digitados como texto e rodadas comuns de chat ainda seguem o padrão de grupo configurado.

## Visibilidade de contexto e listas de permissões

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permissões específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados encaminhados).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto principalmente como recebido. Isso significa que listas de permissões decidem principalmente quem pode acionar ações, não uma fronteira universal de redação para cada trecho citado ou histórico.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Alguns canais já aplicam filtragem baseada no remetente para contexto suplementar em caminhos específicos (por exemplo, semeadura de threads do Slack, buscas de respostas/threads no Matrix).
    - Outros canais ainda passam contexto de citação/resposta/encaminhamento como recebido.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
    - `contextVisibility: "allowlist"` filtra contexto suplementar para remetentes na lista de permissões.
    - `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita de citação/resposta.

    Até que esse modelo de fortalecimento seja implementado de forma consistente entre canais, espere diferenças por superfície.

  </Accordion>
</AccordionGroup>

![Fluxo de mensagem em grupo](/images/groups-flow.svg)

Se você quer...

| Objetivo                                     | O que configurar                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos, mas responder só em @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Somente grupos específicos                   | `groups: { "<group-id>": { ... } }` (sem chave `"*"` )     |
| Somente você pode acionar em grupos          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se seu tráfego "pessoal" são **DMs** e seu tráfego "público" são **grupos**.

Motivo: no modo de agente único, DMs geralmente caem na chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você habilitar sandboxing com `mode: "non-main"`, essas sessões de grupo rodam no backend de sandbox configurado enquanto sua sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher um.

Isso dá a você um único "cérebro" de agente (espaço de trabalho + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas

<Note>
Se você precisa de espaços de trabalho/personas realmente separados ("pessoal" e "público" nunca devem se misturar), use um segundo agente + vinculações. Veja [Roteamento Multiagente](/pt-BR/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    Quer "grupos só podem ver a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte somente caminhos na lista de permissões no sandbox:

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
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs Política de Ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de montagens vinculadas: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

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

| Política     | Comportamento                                              |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupos ignoram listas de permissões; o controle por menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens de grupo.         |
| `"allowlist"` | Permite somente grupos/salas que correspondem à lista de permissões configurada. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` é separado do controle por menção (que exige @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao id do grupo Signal de entrada ou ao telefone/UUID do remetente.
    - Aprovações de pareamento de DM (entradas de armazenamento `*-allowFrom`) se aplicam somente ao acesso a DMs; autorização de remetente de grupo permanece explícita nas listas de permissões de grupo.
    - Discord: a lista de permissões usa `channels.discord.guilds.<id>.channels`.
    - Slack: a lista de permissões usa `channels.slack.channels`.
    - Matrix: a lista de permissões usa `channels.matrix.groups`. Prefira IDs ou aliases de sala; a busca por nome de sala ingressada é de melhor esforço, e nomes não resolvidos são ignorados em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissões `users` por sala também são suportadas.
    - DMs de grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - A lista de permissões do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); prefixos não diferenciam maiúsculas de minúsculas.
    - O padrão é `groupPolicy: "allowlist"`; se sua lista de permissões de grupo estiver vazia, mensagens de grupo serão bloqueadas.
    - Segurança em tempo de execução: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo recorre a um modo de falha fechada (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de permissão de grupos">
    Listas de permissão de grupos (`*.groups`, `*.groupAllowFrom`, lista de permissão específica do canal).
  </Step>
  <Step title="Controle por menção">
    Controle por menção (`requireMention`, `/activation`).
  </Step>
</Steps>

## Controle por menção (padrão)

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
  <Accordion title="Observações sobre controle por menção">
    - `mentionPatterns` são padrões regex seguros e sem diferenciação entre maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
    - Superfícies que fornecem menções explícitas ainda passam; padrões são uma alternativa.
    - Substituição por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
    - O controle por menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` estão configurados).
    - Colocar um grupo ou remetente na lista de permissão não desativa o controle por menção; defina `requireMention` desse grupo como `false` quando todas as mensagens devem acionar.
    - O contexto de prompt de chat em grupo carrega a instrução de resposta silenciosa resolvida a cada turno; arquivos do workspace não devem duplicar a mecânica de `NO_REPLY`.
    - Grupos onde respostas silenciosas são permitidas tratam turnos de modelo limpos, vazios ou apenas com raciocínio como silenciosos, equivalentes a `NO_REPLY`. Chats diretos fazem o mesmo apenas quando respostas silenciosas diretas são explicitamente permitidas; caso contrário, respostas vazias continuam sendo turnos de agente com falha.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituíveis por guild/canal).
    - O contexto do histórico de grupo é encapsulado uniformemente entre canais e é **somente pendente** (mensagens ignoradas devido ao controle por menção); use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desativar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas de grupo/canal (opcional)

Algumas configurações de canal permitem restringir quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos de chave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e curinga `"*"`. Chaves legadas sem prefixo ainda são aceitas e correspondidas apenas como `id:`.

Ordem de resolução (o mais específico vence):

<Steps>
  <Step title="toolsBySender do grupo">
    Correspondência de `toolsBySender` de grupo/canal.
  </Step>
  <Step title="tools do grupo">
    `tools` de grupo/canal.
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
Restrições de ferramentas de grupo/canal são aplicadas além da política global/de agente de ferramentas (a negação ainda prevalece). Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permissão de grupos

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves atuam como uma lista de permissão de grupos. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento padrão de menção.

<Warning>
Confusão comum: aprovação de pareamento por DM não é o mesmo que autorização de grupo. Para canais que oferecem suporte a pareamento por DM, o armazenamento de pareamento desbloqueia apenas DMs. Comandos de grupo ainda exigem autorização explícita de remetente de grupo por listas de permissão de configuração, como `groupAllowFrom`, ou pela alternativa de configuração documentada para esse canal.
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

Proprietários de grupo podem alternar a ativação por grupo:

- `/activation mention`
- `/activation always`

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou pelo E.164 do próprio bot quando não definido). Envie o comando como uma mensagem independente. Outras superfícies atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecidos)
- `WasMentioned` (resultado do controle por menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

Observações específicas do canal:

- BlueBubbles pode, opcionalmente, enriquecer participantes sem nome de grupos do macOS a partir do banco de dados local de Contatos antes de preencher `GroupMembers`. Isso fica desativado por padrão e só é executado depois que o controle normal de grupo passa.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo de responder como uma pessoa, evitar tabelas Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`. Nomes de grupos e rótulos de participantes provenientes do canal são renderizados como metadados não confiáveis cercados por fences, não como instruções de sistema inline.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou colocar na lista de permissão.
- Listar chats: `imsg chats --limit 20`.
- Respostas de grupo sempre voltam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompt de sistema do WhatsApp, incluindo resolução de prompts de grupo e diretos, comportamento de curinga e semântica de substituição de conta.

## Especificidades do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menção).

## Relacionado

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
