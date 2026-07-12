---
read_when:
    - Alteração do comportamento do chat em grupo ou da exigência de menções
    - Limitar mentionPatterns a conversas em grupo específicas
sidebarTitle: Groups
summary: Comportamento de chats em grupo em diferentes plataformas (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-07-11T23:43:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

O OpenClaw aplica as mesmas regras de grupo em todos os canais compatíveis com grupos, incluindo Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp e Zalo.

Para salas sempre ativas que devem fornecer contexto silencioso, a menos que o agente envie explicitamente uma mensagem visível, consulte [Eventos de sala em segundo plano](/pt-BR/channels/ambient-room-events).

## Introdução para iniciantes (2 minutos)

O OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário de bot separado no WhatsApp: se **você** estiver em um grupo, o OpenClaw poderá ver esse grupo e responder nele.

Comportamento padrão:

- Os grupos são restritos (`groupPolicy: "allowlist"`); os remetentes dos grupos são bloqueados até serem incluídos na lista de permissões.
- As respostas exigem uma menção, a menos que você desative essa restrição para um grupo.
- O texto da resposta final é publicado automaticamente na sala (`visibleReplies: "automatic"`).

Em outras palavras: remetentes incluídos na lista de permissões podem acionar o OpenClaw mencionando-o.

<Note>
**Resumo**

- O **acesso a mensagens diretas** é controlado por `*.allowFrom`.
- O **acesso a grupos** é controlado por `*.groupPolicy` + listas de permissões (`*.groups`, `*.groupAllowFrom`).
- O **acionamento de respostas** é controlado pela exigência de menção (`requireMention`, `/activation`).

</Note>

Fluxo rápido (o que acontece com uma mensagem de grupo):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Respostas visíveis

Para solicitações normais de grupo/canal, o padrão do OpenClaw é `messages.groupChat.visibleReplies: "automatic"`: o texto final do assistente é publicado na sala como resposta visível.

Use `messages.groupChat.visibleReplies: "message_tool"` quando uma sala compartilhada deve permitir que o agente decida quando falar chamando `message(action=send)`. Isso funciona melhor com modelos que usam ferramentas de forma confiável (por exemplo, GPT-5.6 Sol). Se o modelo não usar a ferramenta e retornar um texto final relevante, o OpenClaw manterá esse texto privado em vez de publicá-lo na sala.

Use `"automatic"` para modelos ou ambientes de execução que não seguem de maneira confiável a entrega exclusiva por ferramenta: os textos finais normais são publicados diretamente na sala, e o agente ainda pode chamar `message(action=send)` para arquivos, imagens ou outros anexos que não possam acompanhar o texto final.

Se a ferramenta de mensagens não estiver disponível segundo a política de ferramentas ativa, o OpenClaw usará respostas visíveis automáticas como alternativa, em vez de suprimir silenciosamente a resposta. O `openclaw doctor` alerta sobre essa incompatibilidade.

Para conversas diretas e qualquer outro evento de origem, `messages.visibleReplies: "message_tool"` aplica globalmente o mesmo comportamento exclusivo por ferramenta; `messages.groupChat.visibleReplies` continua sendo a substituição mais específica para salas de grupo/canal. As interações diretas internas do WebChat usam por padrão a entrega automática da resposta final, para que Pi e Codex recebam o mesmo contrato de resposta visível.

O modo exclusivo por ferramenta substitui o padrão antigo de forçar o modelo a responder `NO_REPLY` na maioria das interações no modo de observação. No modo exclusivo por ferramenta, o prompt não define um contrato `NO_REPLY`; não tornar nada visível significa simplesmente não chamar a ferramenta de mensagens.

Os vínculos de conversa pertencentes a Plugins são a exceção. Depois que um Plugin vincula uma thread e assume a interação recebida, a resposta retornada pelo Plugin é a resposta visível do vínculo; ela não precisa de `message(action=send)`. Essa resposta é uma saída do ambiente de execução do Plugin, não o texto final privado do modelo.

Os indicadores de digitação ainda são enviados para solicitações diretas de grupo. Quando ativados, os eventos de salas sempre ativas em segundo plano permanecem estritos e silenciosos, a menos que o agente chame a ferramenta de mensagens.

Por padrão, as sessões suprimem resumos detalhados de ferramentas/progresso. Use `/verbose on` (ou `/verbose full`) para exibi-los na sessão atual durante a depuração e `/verbose off` para retornar ao comportamento que mostra somente a resposta final. O estado detalhado é específico de cada sessão e funciona da mesma forma em conversas diretas, grupos, canais e tópicos de fóruns.

Para enviar conversas não mencionadas de grupos sempre ativos como contexto silencioso da sala, em vez de solicitações do usuário, use [Eventos de sala em segundo plano](/pt-BR/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

O padrão é `unmentionedInbound: "user_request"`. Mensagens com menção, comandos, solicitações de cancelamento e mensagens diretas continuam sendo solicitações do usuário.

Para exigir que a saída visível de solicitações de grupo/canal passe pela ferramenta de mensagens:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Para exigir isso em todas as conversas de origem:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

O Gateway aplica as alterações da configuração `messages` sem reinicialização depois que o arquivo é salvo. Reinicie somente quando o recarregamento da configuração estiver desativado (`gateway.reload.mode: "off"`).

As interações de comando ignoram `visibleReplies: "message_tool"` e sempre respondem de forma visível: tanto os comandos de barra nativos (Discord, Telegram e outras superfícies compatíveis com comandos nativos) quanto os comandos de texto `/...` autorizados publicam suas respostas na conversa de origem. Interações de texto `/...` não autorizadas em grupos continuam sendo exclusivas da ferramenta de mensagens; interações comuns de conversa seguem o padrão configurado.

## Visibilidade do contexto e listas de permissões

Dois controles diferentes estão envolvidos na segurança dos grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permissões específicas do canal).
- **Visibilidade do contexto**: qual contexto complementar é inserido no modelo (texto de resposta/citação, histórico da thread, metadados encaminhados).

Por padrão, o OpenClaw mantém o contexto como foi recebido: as listas de permissões determinam quem pode acionar ações, não quais trechos citados ou históricos o modelo pode ver. Para também filtrar o contexto complementar, defina `contextVisibility`:

| Modo                | Comportamento                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `"all"` (padrão)    | Mantém o contexto complementar como foi recebido.                                                       |
| `"allowlist"`       | Insere somente contexto de histórico/thread/citação/encaminhamento proveniente de remetentes permitidos. |
| `"allowlist_quote"` | Igual a `allowlist`, mas também mantém a mensagem explicitamente citada/respondida de qualquer remetente. |

Defina essa opção por canal (`channels.<channel>.contextVisibility`), por conta (`channels.<channel>.accounts.<accountId>.contextVisibility`) ou globalmente (`channels.defaults.contextVisibility`). Os canais que obtêm contexto complementar (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) aplicam a política ao criar o contexto de entrada; combinações de políticas desconhecidas falham de modo seguro e omitem o contexto.

![Fluxo de mensagens de grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                                       | O que definir                                                |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| Permitir todos os grupos, mas responder somente a @menções     | `groups: { "*": { requireMention: true } }`                  |
| Desativar todas as respostas em grupos                         | `groupPolicy: "disabled"`                                    |
| Permitir somente grupos específicos                            | `groups: { "<group-id>": { ... } }` (sem a chave `"*"`)      |
| Permitir que somente você acione o agente nos grupos           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`   |
| Reutilizar um conjunto de remetentes confiáveis entre canais   | `groupAllowFrom: ["accessGroup:operators"]`                  |

Para listas reutilizáveis de remetentes permitidos, consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Chaves de sessão

- As sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Os tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao ID do grupo, para que cada tópico tenha sua própria sessão.
- As conversas diretas usam a sessão principal (ou sessões por remetente, se `session.dmScope` estiver configurado).
- Heartbeats são executados na sessão de heartbeat configurada (padrão: a sessão principal do agente); as sessões de grupo não executam seus próprios heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: mensagens diretas pessoais + grupos públicos (um único agente)

Sim — isso funciona bem se o seu tráfego "pessoal" for composto por **mensagens diretas** e o tráfego "público" por **grupos**.

Motivo: no modo de agente único, as mensagens diretas normalmente chegam à chave de sessão **principal** (`agent:main:main`), enquanto os grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar o isolamento com `mode: "non-main"`, essas sessões de grupo serão executadas no backend de isolamento configurado, enquanto sua sessão principal de mensagens diretas permanecerá no host. Docker é o backend padrão caso você não escolha outro.

Isso oferece um único "cérebro" de agente (espaço de trabalho + memória compartilhados), mas duas posturas de execução:

- **Mensagens diretas**: ferramentas completas (host)
- **Grupos**: ambiente isolado + ferramentas restritas

<Note>
Se você precisar de espaços de trabalho/personas realmente separados ("pessoal" e "público" nunca podem se misturar), use um segundo agente + vínculos. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Mensagens diretas no host, grupos isolados">
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
  <Tab title="Grupos veem somente uma pasta permitida">
    Quer que "os grupos só possam ver a pasta X" em vez de "nenhum acesso ao host"? Mantenha `workspaceAccess: "none"` e monte no ambiente isolado somente os caminhos permitidos:

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

Conteúdo relacionado:

- Chaves de configuração e padrões: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- Como depurar por que uma ferramenta foi bloqueada: [Ambiente isolado vs. política de ferramentas vs. acesso elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes das montagens vinculadas: [Isolamento](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Os rótulos da interface usam `displayName` quando disponível, formatado como `<channel>:<token>`.
- `#room` é reservado para salas/canais; conversas em grupo usam `g-<slug>` (minúsculas, espaços -> `-`, preserva `#@+._-`). IDs opacos muito longos são abreviados para um token estável, em vez de expor IDs completos de rota na interface.

## Política de grupos

Controle como as mensagens de grupos/salas são tratadas por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| Política      | Comportamento                                                           |
| ------------- | ----------------------------------------------------------------------- |
| `"open"`      | Os grupos ignoram as listas de permissões; a exigência de menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens de grupo.                     |
| `"allowlist"` | Permite somente grupos/salas que correspondam à lista de permissões configurada. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` é separado da exigência de menção (que requer @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao ID do grupo do Signal recebido ou ao telefone/UUID do remetente.
    - As aprovações de pareamento de MD (entradas do armazenamento `*-allowFrom`) aplicam-se somente ao acesso por MD; a autorização de remetentes em grupos permanece explícita nas listas de permissões de grupos.
    - Discord: a lista de permissões usa `channels.discord.guilds.<id>.channels`.
    - Slack: a lista de permissões usa `channels.slack.channels`.
    - Matrix: a lista de permissões usa `channels.matrix.groups`. Use IDs de sala (`!room:server`) ou aliases (`#alias:server`); chaves de nome de sala só correspondem com `channels.matrix.dangerouslyAllowNameMatching: true`, e entradas não resolvidas são ignoradas durante a execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissões `users` por sala também são compatíveis.
    - MDs em grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: as listas de permissões de remetentes aceitam somente IDs numéricos de usuários (`"123456789"`; os prefixos `telegram:`/`tg:` são removidos sem diferenciar maiúsculas de minúsculas). Entradas `@username` não correspondem durante a execução e registram um aviso; a configuração resolve `@username` para IDs. IDs negativos de chats pertencem a `channels.telegram.groups`, não às listas de permissões de remetentes.
    - O padrão é `groupPolicy: "allowlist"`; se sua lista de permissões de grupos estiver vazia, as mensagens de grupo serão bloqueadas.
    - Segurança durante a execução: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupos falha de forma segura usando `allowlist`, em vez de herdar `channels.defaults.groupPolicy`, e o Gateway registra essa alternativa uma vez por conta.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação das mensagens de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (aberto/desativado/lista de permissões).
  </Step>
  <Step title="Group allowlists">
    Listas de permissões de grupos (`*.groups`, `*.groupAllowFrom`, lista de permissões específica do canal).
  </Step>
  <Step title="Mention gating">
    Exigência de menção (`requireMention`, `/activation`).
  </Step>
</Steps>

## Exigência de menção (padrão)

Mensagens de grupo exigem uma menção, a menos que isso seja substituído para cada grupo. Os padrões ficam em cada subsistema, em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita quando o canal fornece metadados de resposta; citar uma mensagem do bot também pode contar em canais que fornecem metadados de citação. Casos integrados atualmente: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp e Zalo pessoal.

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

## Definir o escopo dos padrões de menção configurados

Os `mentionPatterns` configurados são gatilhos alternativos de expressões regulares. Use-os quando a plataforma não fornecer uma menção nativa ao bot ou quando texto simples, como `openclaw:`, deva contar como menção. As menções nativas da plataforma são separadas: quando Discord, Slack, Telegram, Matrix ou outro canal puder comprovar que a mensagem mencionou explicitamente o bot, essa menção nativa ainda acionará o agente mesmo onde os padrões de expressões regulares configurados forem negados.

Por padrão, os padrões de menção configurados se aplicam em todos os locais nos quais o canal fornece informações do provedor e da conversa à detecção de menções. Para impedir que padrões abrangentes despertem o agente em todos os grupos, defina o escopo deles por canal com `channels.<channel>.mentionPatterns`.

Use `mode: "deny"` quando os padrões de menção por expressão regular devam ficar desativados por padrão em um canal e, em seguida, habilite salas específicas com `allowIn`:

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

Use o padrão `mode: "allow"` (ou omita `mode`) quando os padrões de menção por expressão regular devam se aplicar de forma ampla e, em seguida, desative-os em salas com muito ruído usando `denyIn`:

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
| `mode: "allow"` | Os padrões de menção por expressão regular ficam habilitados, a menos que o ID da conversa esteja em `denyIn`. Este é o padrão. |
| `mode: "deny"`  | Os padrões de menção por expressão regular ficam desabilitados, a menos que o ID da conversa esteja em `allowIn`.     |
| `allowIn`       | IDs de conversas nos quais os padrões de menção por expressão regular ficam habilitados no modo de negação.           |
| `denyIn`        | IDs de conversas nos quais os padrões de menção por expressão regular ficam desabilitados. `denyIn` prevalece sobre `allowIn` se ambos incluírem o mesmo ID. |

Política de expressões regulares com escopo compatível atualmente:

| Canal     | IDs usados em `allowIn` / `denyIn`                               |
| --------- | ---------------------------------------------------------------- |
| Discord   | IDs de canais do Discord.                                        |
| Matrix    | IDs de salas do Matrix.                                          |
| Slack     | IDs de canais do Slack.                                          |
| Telegram  | IDs de chats em grupo ou `chatId:topic:threadId` para tópicos de fórum. |
| WhatsApp  | IDs de conversas do WhatsApp, como `123@g.us`.                    |

Configurações de canal no nível da conta podem definir a mesma política em `channels.<channel>.accounts.<accountId>.mentionPatterns` quando o canal aceita várias contas. A política da conta prevalece sobre a política do canal no nível superior para essa conta.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` são padrões seguros de expressões regulares que não diferenciam maiúsculas de minúsculas; padrões inválidos e formas inseguras com repetição aninhada são ignorados (com um aviso).
    - Precedência dos padrões: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo) substitui `messages.groupChat.mentionPatterns`; quando nenhum deles está definido, os padrões são derivados do nome/emoji da identidade do agente.
    - A exigência de menção só é aplicada quando a detecção de menções é possível (há menções nativas ou `mentionPatterns` configurados).
    - Incluir um grupo ou remetente na lista de permissões não desativa a exigência de menção; defina `requireMention` desse grupo como `false` quando todas as mensagens devam acionar o agente.
    - O contexto automático do prompt de chat em grupo inclui a instrução resolvida de resposta silenciosa a cada turno; os arquivos do espaço de trabalho não devem duplicar os mecanismos de `NO_REPLY`.
    - Grupos nos quais respostas silenciosas automáticas são permitidas tratam turnos do modelo completamente vazios ou contendo somente raciocínio como silenciosos, equivalentes a `NO_REPLY`. Chats diretos nunca recebem instruções de `NO_REPLY`, e respostas de grupo que usam somente a ferramenta de mensagens permanecem silenciosas ao não chamar `message(action=send)`.
    - Conversas ambientes e contínuas em grupos usam a semântica de solicitação do usuário por padrão. Defina `messages.groupChat.unmentionedInbound: "room_event"` para enviá-las como contexto silencioso. Consulte [Eventos ambientes de sala](/pt-BR/channels/ambient-room-events) para ver exemplos de configuração.
    - Eventos de sala não são armazenados como solicitações falsas de usuários, e texto privado do assistente proveniente de eventos de sala sem uso da ferramenta de mensagens não é reproduzido como histórico do chat.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituíveis por servidor/canal).
    - O contexto do histórico de grupos é encapsulado uniformemente entre os canais. Grupos com exigência de menção mantêm mensagens pendentes ignoradas; grupos sempre ativos também podem manter mensagens recentes já processadas da sala quando o canal oferece suporte. Use `messages.groupChat.historyLimit` como padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desabilitar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canais permitem restringir quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para todo o grupo (`allow`, `alsoAllow`, `deny`; a negação prevalece).
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos explícitos nas chaves: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e o caractere curinga `"*"`. IDs de canais usam IDs de canais canônicos do OpenClaw; aliases como `teams` são normalizados para `msteams`. Chaves legadas sem prefixo ainda são aceitas, correspondem somente como `id:` e registram um aviso de descontinuação.

Ordem de resolução (o mais específico prevalece):

<Steps>
  <Step title="Group toolsBySender">
    Correspondência de `toolsBySender` do grupo/canal.
  </Step>
  <Step title="Group tools">
    `tools` do grupo/canal.
  </Step>
  <Step title="Default toolsBySender">
    Correspondência de `toolsBySender` padrão (`"*"`).
  </Step>
  <Step title="Default tools">
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
As restrições de ferramentas por grupo/canal são aplicadas além da política global/de ferramentas do agente (a negação ainda prevalece). Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permissões de grupos

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves funcionam como uma lista de permissões de grupos. Use `"*"` para permitir todos os grupos e ainda definir o comportamento padrão de menções.

<Warning>
Confusão comum: a aprovação do pareamento de mensagens diretas não é o mesmo que a autorização de grupos. Nos canais que oferecem pareamento de mensagens diretas, o armazenamento de pareamentos desbloqueia somente as mensagens diretas. Os comandos de grupo ainda exigem autorização explícita do remetente no grupo por meio de listas de permissões da configuração, como `groupAllowFrom`, ou do fallback de configuração documentado para esse canal.
</Warning>

Intenções comuns (copiar/colar):

<Tabs>
  <Tab title="Desativar todas as respostas em grupos">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Permitir somente grupos específicos (WhatsApp)">
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
  <Tab title="Acionamentos exclusivos do proprietário (WhatsApp)">
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

Os proprietários de grupos podem alternar a ativação de cada grupo com uma mensagem independente:

- `/activation mention`
- `/activation always`

`/activation` é um comando central restrito ao proprietário e se aplica somente a conversas em grupo. Proprietário significa que o remetente corresponde a `allowFrom` / `commands.ownerAllowFrom` do canal (quando nenhuma lista de permissões está configurada, o próprio identificador da conta conta como proprietário). O modo armazenado substitui o `requireMention` desse grupo nos canais que o consultam (Google Chat, QQBot, Telegram, WhatsApp), e a introdução do prompt de sistema do grupo reflete o modo ativo em todos os canais.

## Campos de contexto

As cargas úteis recebidas de grupos definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecidos)
- `WasMentioned` (resultado do controle por menção)
- Os tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo (e após alterações feitas com `/activation`). Ela orienta o modelo a responder como uma pessoa, minimizar linhas vazias, seguir o espaçamento normal de conversas e evitar digitar sequências literais `\n`. Grupos que não são do Telegram também desencorajam tabelas Markdown; as orientações de texto enriquecido do Telegram vêm do prompt do canal Telegram. Os nomes de grupos e rótulos de participantes provenientes do canal são renderizados como metadados não confiáveis delimitados por cercas, e não como instruções de sistema embutidas.

## Detalhes específicos do iMessage

- Prefira `chat_id:<id>` ao rotear ou adicionar à lista de permissões.
- Liste as conversas: `imsg chats --limit 20`.
- As respostas em grupo sempre retornam ao mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para ver as regras canônicas de prompts de sistema do WhatsApp, incluindo a resolução de prompts de grupo e diretos, o comportamento de curingas e a semântica de substituição por conta.

## Detalhes específicos do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para ver o comportamento exclusivo do WhatsApp (injeção de histórico e detalhes do tratamento de menções).

## Relacionados

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
