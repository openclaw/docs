---
read_when:
    - Alteração do comportamento de chats em grupo ou do controle por menções
    - Limitando mentionPatterns a conversas em grupo específicas
sidebarTitle: Groups
summary: Comportamento de chats em grupo entre superfícies (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-06-27T17:10:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata chats em grupo de forma consistente entre superfícies: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Para salas sempre ativas que devem fornecer contexto discreto, a menos que o agente envie explicitamente uma mensagem visível, consulte [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events).

## Introdução para iniciantes (2 minutos)

OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário bot separado do WhatsApp. Se **você** está em um grupo, o OpenClaw pode ver esse grupo e responder nele.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente o controle por menção.
- Respostas visíveis em grupos/canais usam a ferramenta `message` por padrão.

Tradução: remetentes na lista de permissões podem acionar o OpenClaw mencionando-o.

<Note>
**TL;DR**

- **Acesso a DM** é controlado por `*.allowFrom`.
- **Acesso a grupos** é controlado por `*.groupPolicy` + listas de permissões (`*.groups`, `*.groupAllowFrom`).
- **Acionamento de resposta** é controlado pelo controle por menção (`requireMention`, `/activation`).

</Note>

Fluxo rápido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Respostas visíveis

Para solicitações normais de grupo/canal, o OpenClaw usa por padrão `messages.groupChat.visibleReplies: "automatic"`. O texto final do assistente é publicado pelo caminho legado de resposta visível, a menos que você configure a sala para saída somente pela ferramenta de mensagem.

Use `messages.groupChat.visibleReplies: "message_tool"` quando uma sala compartilhada deve permitir que o agente decida quando falar chamando `message(action=send)`. Isso funciona melhor para salas de grupo com modelos de geração mais recente e confiáveis no uso de ferramentas, como GPT 5.5. Se o modelo deixar de usar essa ferramenta e retornar texto final substancial, o OpenClaw mantém esse texto final privado em vez de publicá-lo na sala.

Use `"automatic"` para modelos ou runtimes mais fracos que não entendem de forma confiável a entrega somente por ferramenta. No modo automático, o texto final do assistente é o caminho de resposta visível de origem, então um modelo que não consegue chamar `message(action=send)` de forma consistente ainda pode responder normalmente.

No modo automático, respostas finais de texto normal são publicadas diretamente na sala. Se a resposta visível precisar de arquivos, imagens ou outros anexos, o agente ainda pode usar `message(action=send)` para esse anexo em vez de tentar forçá-lo pela resposta final de texto.

Se a ferramenta de mensagem estiver indisponível sob a política de ferramentas ativa, o OpenClaw retorna
para respostas visíveis automáticas em vez de suprimir silenciosamente a resposta.
`openclaw doctor` avisa sobre essa incompatibilidade.

Para chats diretos e qualquer outro evento de origem, use `messages.visibleReplies: "message_tool"` para aplicar globalmente o mesmo comportamento de resposta visível somente por ferramenta. Turnos diretos internos do WebChat usam por padrão a entrega automática de resposta final para que Pi e Codex recebam o mesmo contrato de resposta visível. Defina `messages.visibleReplies: "message_tool"` para exigir intencionalmente `message(action=send)` para saída visível. `messages.groupChat.visibleReplies` continua sendo a substituição mais específica para salas de grupo/canal.

Isso substitui o padrão antigo de forçar o modelo a responder `NO_REPLY` na maioria dos turnos em modo de observação. No modo somente por ferramenta, o prompt não define um contrato `NO_REPLY`. Não fazer nada visível significa simplesmente não chamar a ferramenta de mensagem.

Vínculos de conversa pertencentes a Plugin são a exceção. Depois que um Plugin vincula uma thread e reivindica o turno de entrada, a resposta retornada pelo Plugin é a resposta visível do vínculo; ela não precisa de `message(action=send)`. Essa resposta é saída de runtime do Plugin, não texto final privado do modelo.

Indicadores de digitação ainda são enviados para solicitações diretas em grupo. Eventos de sala ambiente sempre ativos, quando habilitados, permanecem estritos e silenciosos, a menos que o agente chame a ferramenta de mensagem.

Sessões suprimem resumos detalhados de ferramentas/progresso por padrão. Use `/verbose on`
para mostrar esses resumos na sessão atual durante a depuração, e
`/verbose off` para voltar ao comportamento somente com resposta final. O mesmo estado verboso
se aplica a chats diretos, grupos, canais e tópicos de fórum.

Para enviar conversas de grupo sempre ativas sem menção como contexto discreto de sala em vez de solicitações de usuário, use [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

O padrão é `unmentionedInbound: "user_request"`.

Mensagens mencionadas, comandos, solicitações de interrupção e DMs continuam sendo solicitações de usuário.

Para exigir que a saída visível passe pela ferramenta de mensagem em solicitações de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

O Gateway recarrega a configuração `messages` automaticamente após o arquivo ser salvo. Reinicie apenas
quando a observação de arquivos ou o recarregamento de configuração estiver desativado na implantação.

Para exigir que a saída visível passe pela ferramenta de mensagem em todos os chats de origem:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Comandos de barra nativos (Discord, Telegram e outras superfícies com suporte a comandos nativos) ignoram `visibleReplies: "message_tool"` e sempre respondem visivelmente para que a UI de comando nativa do canal receba a resposta esperada. Isso se aplica somente a turnos de comando nativo validados; comandos `/...` digitados como texto e turnos comuns de chat ainda seguem o padrão de grupo configurado.

## Visibilidade de contexto e listas de permissões

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permissões específicas do canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados encaminhados).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto principalmente como recebido. Isso significa que listas de permissões decidem principalmente quem pode acionar ações, não um limite universal de redação para cada trecho citado ou histórico.

<AccordionGroup>
  <Accordion title="O comportamento atual é específico do canal">
    - Alguns canais já aplicam filtragem baseada no remetente para contexto suplementar em caminhos específicos (por exemplo, semeadura de threads do Slack, consultas de respostas/threads do Matrix).
    - Outros canais ainda passam contexto de citação/resposta/encaminhamento como recebido.

  </Accordion>
  <Accordion title="Direção de endurecimento (planejada)">
    - `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
    - `contextVisibility: "allowlist"` filtra contexto suplementar para remetentes na lista de permissões.
    - `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita de citação/resposta.

    Até que esse modelo de endurecimento seja implementado de forma consistente entre canais, espere diferenças por superfície.

  </Accordion>
</AccordionGroup>

![Fluxo de mensagens de grupo](/images/groups-flow.svg)

Se você quer...

| Objetivo                                     | O que definir                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos os grupos, mas responder apenas a @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem chave `"*"` )     |
| Apenas você pode acionar em grupos           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar um conjunto confiável de remetentes entre canais | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas de permissões reutilizáveis de remetentes, consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se seu tráfego "pessoal" são **DMs** e seu tráfego "público" são **grupos**.

Por quê: no modo de agente único, DMs normalmente chegam na chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você habilitar o sandboxing com `mode: "non-main"`, essas sessões de grupo são executadas no backend de sandbox configurado, enquanto sua sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher um.

Isso dá a você um "cérebro" de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: ferramentas completas (host)
- **Grupos**: sandbox + ferramentas restritas

<Note>
Se você precisa de workspaces/personas realmente separados ("pessoal" e "público" nunca devem se misturar), use um segundo agente + vínculos. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).
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
  <Tab title="Grupos veem apenas uma pasta na lista de permissões">
    Quer "grupos só podem ver a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte apenas caminhos na lista de permissões no sandbox:

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
- Depurar por que uma ferramenta está bloqueada: [Sandbox vs política de ferramentas vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
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
| `"open"`      | Grupos ignoram listas de permissões; a exigência de menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens de grupo.          |
| `"allowlist"` | Permite apenas grupos/salas que correspondem à lista de permissões configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` é separado da exigência de menção (que exige @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao id do grupo Signal de entrada ou ao telefone/UUID do remetente.
    - Aprovações de pareamento de MD (entradas de armazenamento `*-allowFrom`) se aplicam apenas ao acesso por MD; a autorização do remetente em grupo permanece explícita para listas de permissões de grupo.
    - Discord: a lista de permissões usa `channels.discord.guilds.<id>.channels`.
    - Slack: a lista de permissões usa `channels.slack.channels`.
    - Matrix: a lista de permissões usa `channels.matrix.groups`. Prefira IDs ou aliases de sala; a busca por nome de sala ingressada é por melhor esforço, e nomes não resolvidos são ignorados em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissões `users` por sala também são compatíveis.
    - MDs em grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - A lista de permissões do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); prefixos não diferenciam maiúsculas de minúsculas.
    - O padrão é `groupPolicy: "allowlist"`; se a lista de permissões de grupo estiver vazia, mensagens de grupo serão bloqueadas.
    - Segurança em tempo de execução: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo recua para um modo fechado por segurança (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de permissões de grupo">
    Listas de permissões de grupo (`*.groups`, `*.groupAllowFrom`, lista de permissões específica do canal).
  </Step>
  <Step title="Exigência de menção">
    Exigência de menção (`requireMention`, `/activation`).
  </Step>
</Steps>

## Exigência de menção (padrão)

Mensagens de grupo exigem uma menção, a menos que isso seja sobrescrito por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem do bot conta como menção implícita quando o canal oferece suporte a metadados de resposta. Citar uma mensagem do bot também pode contar como menção implícita em canais que expõem metadados de citação. Os casos integrados atuais incluem Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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

## Definir escopo de padrões de menção configurados

`mentionPatterns` configurados são acionadores regex de fallback. Use-os quando a
plataforma não expuser uma menção nativa ao bot, ou quando você quiser que texto
simples como `openclaw:` conte como menção. Menções nativas da plataforma são
separadas: quando Discord, Slack, Telegram, Matrix ou outro canal consegue provar
que a mensagem mencionou explicitamente o bot, essa menção nativa ainda aciona
mesmo que padrões regex configurados sejam negados.

Por padrão, padrões de menção configurados se aplicam em todos os lugares em que
esse canal passa fatos de provedor e conversa para a detecção de menção. Para
impedir que padrões amplos despertem o agente em todos os grupos, defina seu
escopo por canal com `channels.<channel>.mentionPatterns`.

Use `mode: "deny"` quando padrões regex de menção devem ficar desativados por
padrão para um canal, depois habilite salas específicas com `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Use o `mode: "allow"` padrão (ou omita `mode`) quando padrões regex de menção
devem se aplicar amplamente, depois desative-os em salas ruidosas com `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Resolução da política:

| Campo           | Efeito                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Padrões regex de menção são habilitados, a menos que o ID da conversa esteja em `denyIn`. Este é o padrão.            |
| `mode: "deny"`  | Padrões regex de menção são desabilitados, a menos que o ID da conversa esteja em `allowIn`.                          |
| `allowIn`       | IDs de conversa em que padrões regex de menção são habilitados no modo de negação.                                    |
| `denyIn`        | IDs de conversa em que padrões regex de menção são desabilitados. `denyIn` prevalece sobre `allowIn` se ambos incluírem o mesmo ID. |

Política regex com escopo compatível hoje:

| Canal    | IDs usados em `allowIn` / `denyIn`                         |
| -------- | ------------------------------------------------------------ |
| Discord  | IDs de canal do Discord.                                    |
| Matrix   | IDs de sala do Matrix.                                      |
| Slack    | IDs de canal do Slack.                                      |
| Telegram | IDs de chat de grupo, ou `chatId:topic:threadId` para tópicos de fórum. |
| WhatsApp | IDs de conversa do WhatsApp, como `123@g.us`.               |

Configurações de canal no nível da conta podem definir a mesma política em
`channels.<channel>.accounts.<accountId>.mentionPatterns` quando esse canal
oferece suporte a várias contas. A política da conta tem precedência sobre a
política de canal de nível superior para essa conta.

<AccordionGroup>
  <Accordion title="Notas sobre exigência de menção">
    - `mentionPatterns` são padrões regex seguros sem diferenciação de maiúsculas/minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
    - Superfícies que fornecem menções explícitas ainda passam; padrões regex configurados são um fallback.
    - `channels.<channel>.mentionPatterns.mode: "deny"` desabilita padrões de menção configurados por padrão para esse canal; habilite conversas selecionadas novamente com `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` desabilita padrões de menção configurados para IDs de conversa específicos, enquanto @menções nativas da plataforma ainda passam.
    - Sobrescrita por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
    - A exigência de menção só é aplicada quando a detecção de menção é possível (menções nativas ou `mentionPatterns` estão configurados).
    - Colocar um grupo ou remetente na lista de permissões não desabilita a exigência de menção; defina `requireMention` desse grupo como `false` quando todas as mensagens devem acionar.
    - O contexto automático de prompt de chat em grupo carrega a instrução resolvida de resposta silenciosa em todos os turnos; arquivos do workspace não devem duplicar a mecânica de `NO_REPLY`.
    - Grupos em que respostas silenciosas automáticas são permitidas tratam turnos de modelo limpos vazios ou apenas com raciocínio como silenciosos, equivalentes a `NO_REPLY`. Chats diretos nunca recebem orientação de `NO_REPLY`, e respostas de grupo apenas com ferramenta de mensagem permanecem silenciosas ao não chamar `message(action=send)`.
    - Conversas de grupo ambientes sempre ativas usam semântica de solicitação do usuário por padrão. Defina `messages.groupChat.unmentionedInbound: "room_event"` para enviá-las como contexto silencioso em vez disso. Consulte [Eventos ambientes de sala](/pt-BR/channels/ambient-room-events) para exemplos de configuração.
    - Eventos de sala não são armazenados como solicitações falsas de usuário, e texto privado do assistente vindo de eventos de sala sem ferramenta de mensagem não é reproduzido como histórico de chat.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (sobrescrevíveis por guild/canal).
    - O contexto de histórico de grupo é encapsulado uniformemente entre canais. Grupos com exigência de menção mantêm mensagens ignoradas pendentes; grupos sempre ativos também podem reter mensagens recentes processadas da sala quando o canal oferece suporte a isso. Use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para sobrescritas. Defina `0` para desabilitar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal oferecem suporte a restringir quais ferramentas ficam disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: sobrescritas por remetente dentro do grupo. Use prefixos de chave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e curinga `"*"`. IDs de canal usam IDs de canal canônicos do OpenClaw; aliases como `teams` são normalizados para `msteams`. Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.

Ordem de resolução (o mais específico vence):

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
Restrições de ferramentas por grupo/canal são aplicadas além da política global/de agente de ferramentas (negação ainda vence). Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permissões de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` é configurado, as chaves atuam como uma lista de permissões de grupo. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento padrão de menção.

<Warning>
Confusão comum: a aprovação de pareamento por DM não é o mesmo que autorização de grupo. Para canais que oferecem suporte a pareamento por DM, o armazenamento de pareamento desbloqueia apenas DMs. Comandos de grupo ainda exigem autorização explícita do remetente do grupo por allowlists de configuração, como `groupAllowFrom`, ou pelo fallback de configuração documentado para esse canal.
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
  <Tab title="Acionadores somente do proprietário (WhatsApp)">
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

O proprietário é determinado por `channels.whatsapp.allowFrom` (ou pelo E.164 próprio do bot quando não definido). Envie o comando como uma mensagem independente. Outras superfícies atualmente ignoram `/activation`.

## Campos de contexto

Payloads de entrada de grupo definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecido)
- `WasMentioned` (resultado do controle por menção)
- Tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo de responder como um humano, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`. Grupos que não são do Telegram também desencorajam tabelas Markdown; a orientação de rich text do Telegram vem do prompt do canal Telegram. Nomes de grupo e rótulos de participantes originados do canal são renderizados como metadados não confiáveis em bloco delimitado, não como instruções de sistema inline.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou adicionar à allowlist.
- Listar chats: `imsg chats --limit 20`.
- Respostas de grupo sempre voltam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompt de sistema do WhatsApp, incluindo resolução de prompts de grupo e diretos, comportamento de wildcard e semântica de substituição por conta.

## Especificidades do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para o comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menções).

## Relacionado

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
