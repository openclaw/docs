---
read_when:
    - Alteração do comportamento do chat em grupo ou da exigência de menção
    - Limitando mentionPatterns a conversas em grupo específicas
sidebarTitle: Groups
summary: Comportamento de chats em grupo entre diferentes plataformas (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-07-12T14:54:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

O OpenClaw aplica as mesmas regras de grupo em todos os canais compatíveis com grupos, incluindo Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp e Zalo.

Para salas sempre ativas que devem fornecer contexto silencioso, a menos que o agente envie explicitamente uma mensagem visível, consulte [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events).

## Introdução para iniciantes (2 minutos)

O OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário de bot separado no WhatsApp: se **você** estiver em um grupo, o OpenClaw poderá ver esse grupo e responder nele.

Comportamento padrão:

- Os grupos são restritos (`groupPolicy: "allowlist"`); os remetentes do grupo ficam bloqueados até serem adicionados à lista de permissões.
- As respostas exigem uma menção, a menos que você desative essa restrição para um grupo.
- O texto da resposta final é publicado automaticamente na sala (`visibleReplies: "automatic"`).

Em outras palavras: remetentes na lista de permissões podem acionar o OpenClaw mencionando-o.

<Note>
**Resumo**

- O **acesso a mensagens diretas** é controlado por `*.allowFrom`.
- O **acesso a grupos** é controlado por `*.groupPolicy` + listas de permissões (`*.groups`, `*.groupAllowFrom`).
- O **acionamento de respostas** é controlado pela exigência de menção (`requireMention`, `/activation`).

</Note>

Fluxo rápido (o que acontece com uma mensagem de grupo):

```text
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? não -> descartar
requireMention? sim -> houve menção? não -> armazenar apenas para contexto
menção/resposta/comando/DM -> solicitação do usuário
conversa de grupo sempre ativa -> solicitação do usuário ou evento de sala quando configurado
```

## Respostas visíveis

Para solicitações normais de grupos/canais, o padrão do OpenClaw é `messages.groupChat.visibleReplies: "automatic"`: o texto final do assistente é publicado na sala como resposta visível.

Use `messages.groupChat.visibleReplies: "message_tool"` quando uma sala compartilhada deve permitir que o agente decida quando falar chamando `message(action=send)`. Isso funciona melhor com modelos que usam ferramentas de modo confiável (por exemplo, GPT-5.6 Sol). Se o modelo não usar a ferramenta e retornar um texto final substancial, o OpenClaw mantém esse texto privado em vez de publicá-lo na sala.

Use `"automatic"` para modelos ou runtimes que não seguem de forma confiável a entrega exclusiva por ferramenta: textos finais normais são publicados diretamente na sala, e o agente ainda pode chamar `message(action=send)` para arquivos, imagens ou outros anexos que não possam acompanhar o texto final.

Se a ferramenta de mensagens estiver indisponível conforme a política de ferramentas ativa, o OpenClaw recorre a respostas visíveis automáticas em vez de suprimir silenciosamente a resposta. O `openclaw doctor` alerta sobre essa incompatibilidade.

Para conversas diretas e qualquer outro evento de origem, `messages.visibleReplies: "message_tool"` aplica globalmente o mesmo comportamento exclusivo por ferramenta; `messages.groupChat.visibleReplies` continua sendo a substituição mais específica para salas de grupos/canais. Os turnos diretos do WebChat interno usam por padrão a entrega automática da resposta final, para que Pi e Codex recebam o mesmo contrato de resposta visível.

O modo exclusivo por ferramenta substitui o padrão antigo de forçar o modelo a responder `NO_REPLY` na maioria dos turnos em modo de observação. No modo exclusivo por ferramenta, o prompt não define um contrato `NO_REPLY`; não fazer nada visível significa simplesmente não chamar a ferramenta de mensagens.

Os vínculos de conversa pertencentes a plugins são a exceção. Depois que um plugin vincula uma thread e assume o turno de entrada, a resposta retornada pelo plugin é a resposta visível do vínculo; ela não precisa de `message(action=send)`. Essa resposta é uma saída do runtime do plugin, não um texto final privado do modelo.

Os indicadores de digitação ainda são enviados para solicitações diretas de grupo. Quando habilitados, os eventos ambiente de salas sempre ativas permanecem estritos e silenciosos, a menos que o agente chame a ferramenta de mensagens.

Por padrão, as sessões suprimem resumos detalhados de ferramentas/progresso. Use `/verbose on` (ou `/verbose full`) para exibi-los na sessão atual durante a depuração e `/verbose off` para retornar ao comportamento que mostra apenas a resposta final. O estado detalhado é específico de cada sessão e funciona da mesma maneira em conversas diretas, grupos, canais e tópicos de fórum.

Para enviar conversas não mencionadas de grupos sempre ativos como contexto silencioso da sala, em vez de solicitações do usuário, use [Eventos de sala ambiente](/pt-BR/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

O padrão é `unmentionedInbound: "user_request"`. Mensagens com menções, comandos, solicitações de cancelamento e DMs continuam sendo solicitações do usuário.

Para exigir que a saída visível passe pela ferramenta de mensagens em solicitações de grupos/canais:

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

O Gateway aplica as alterações na configuração `messages` sem reinicialização depois que o arquivo é salvo. Reinicie somente quando o recarregamento da configuração estiver desabilitado (`gateway.reload.mode: "off"`).

Os turnos de comando ignoram `visibleReplies: "message_tool"` e sempre respondem de forma visível: tanto os comandos de barra nativos (Discord, Telegram e outras interfaces compatíveis com comandos nativos) quanto os comandos de texto `/...` autorizados publicam sua resposta na conversa de origem. Turnos de texto `/...` não autorizados em grupos permanecem exclusivos da ferramenta de mensagens; turnos de conversa comuns seguem o padrão configurado.

## Visibilidade do contexto e listas de permissões

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permissões específicas do canal).
- **Visibilidade do contexto**: qual contexto complementar é inserido no modelo (texto de resposta/citação, histórico da thread, metadados encaminhados).

Por padrão, o OpenClaw mantém o contexto conforme recebido: as listas de permissões determinam quem pode acionar ações, não quais trechos citados ou históricos o modelo vê. Para também filtrar o contexto complementar, defina `contextVisibility`:

| Modo                | Comportamento                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `"all"` (padrão)    | Mantém o contexto complementar conforme recebido.                                                 |
| `"allowlist"`       | Insere apenas contexto de histórico/thread/citação/encaminhamento de remetentes na lista de permissões. |
| `"allowlist_quote"` | Igual a `allowlist`, mas também mantém a mensagem explicitamente citada/respondida de qualquer remetente. |

Defina-o por canal (`channels.<channel>.contextVisibility`), por conta (`channels.<channel>.accounts.<accountId>.contextVisibility`) ou globalmente (`channels.defaults.contextVisibility`). Os canais que obtêm contexto complementar (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) aplicam a política ao criar o contexto de entrada; combinações de políticas desconhecidas falham de modo seguro e omitem o contexto.

![Fluxo de mensagens de grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                                    | O que definir                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| Permitir todos os grupos, mas responder apenas a @menções   | `groups: { "*": { requireMention: true } }`                 |
| Desabilitar todas as respostas em grupos                    | `groupPolicy: "disabled"`                                   |
| Permitir apenas grupos específicos                          | `groups: { "<group-id>": { ... } }` (sem a chave `"*"`)     |
| Permitir que apenas você acione o agente em grupos          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |
| Reutilizar um conjunto de remetentes confiáveis entre canais | `groupAllowFrom: ["accessGroup:operators"]`                 |

Para listas de permissões de remetentes reutilizáveis, consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Chaves de sessão

- As sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Os tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao ID do grupo, para que cada tópico tenha sua própria sessão.
- As conversas diretas usam a sessão principal (ou sessões por remetente, se `session.dmScope` estiver configurado).
- Heartbeats são executados na sessão de heartbeat configurada (padrão: a sessão principal do agente); as sessões de grupo não executam seus próprios heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (um único agente)

Sim — isso funciona bem se o seu tráfego "pessoal" estiver em **DMs** e o tráfego "público" estiver em **grupos**.

Motivo: no modo de agente único, as DMs normalmente chegam à chave de sessão **principal** (`agent:main:main`), enquanto os grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você habilitar o sandboxing com `mode: "non-main"`, essas sessões de grupo serão executadas no backend de sandbox configurado, enquanto sua sessão principal de DM permanecerá no host. Docker é o backend padrão se você não escolher um.

Isso oferece um único "cérebro" de agente (workspace + memória compartilhados), mas duas posturas de execução:

- **DMs**: todas as ferramentas (host)
- **Grupos**: sandbox + ferramentas restritas

<Note>
Se você precisar de workspaces/personas realmente separados ("pessoal" e "público" nunca podem se misturar), use um segundo agente + vínculos. Consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs no host, grupos em sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // grupos/canais não são principais -> executados em sandbox
            scope: "session", // isolamento mais forte (um contêiner por grupo/canal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Se allow não estiver vazio, todo o restante será bloqueado (deny ainda prevalece).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Grupos veem apenas uma pasta na lista de permissões">
    Quer que "os grupos vejam apenas a pasta X" em vez de "nenhum acesso ao host"? Mantenha `workspaceAccess: "none"` e monte no sandbox apenas os caminhos na lista de permissões:

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
                // caminhoNoHost:caminhoNoContêiner:modo
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

- Chaves e padrões de configuração: [Configuração do Gateway](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- Depuração do motivo pelo qual uma ferramenta está bloqueada: [Sandbox vs. política de ferramentas vs. modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de montagens vinculadas: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Os rótulos da interface usam `displayName` quando disponível, formatado como `<channel>:<token>`.
- `#room` é reservado para salas/canais; conversas em grupo usam `g-<slug>` (minúsculas, espaços -> `-`, preservando `#@+._-`). IDs opacos muito longos são encurtados para um token estável, em vez de expor IDs completos de rotas na interface.

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
      groupAllowFrom: ["123456789"], // ID numérico de usuário do Telegram (a configuração resolve @username)
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

| Política      | Comportamento                                                        |
| ------------- | --------------------------------------------------------------------- |
| `"open"`      | Os grupos ignoram as listas de permissões; a exigência de menção ainda se aplica. |
| `"disabled"`  | Bloqueia completamente todas as mensagens de grupo.                   |
| `"allowlist"` | Permite apenas grupos/salas que correspondam à lista de permissões configurada. |

<AccordionGroup>
  <Accordion title="Observações por canal">
    - `groupPolicy` é separado da exigência de menção (que requer @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao ID do grupo do Signal recebido ou ao telefone/UUID do remetente.
    - As aprovações de pareamento de MD (entradas no armazenamento `*-allowFrom`) aplicam-se apenas ao acesso por MD; a autorização do remetente em grupos permanece explícita nas listas de permissões de grupo.
    - Discord: a lista de permissões usa `channels.discord.guilds.<id>.channels`.
    - Slack: a lista de permissões usa `channels.slack.channels`.
    - Matrix: a lista de permissões usa `channels.matrix.groups`. Use IDs de sala (`!room:server`) ou aliases (`#alias:server`); chaves com nomes de sala correspondem apenas com `channels.matrix.dangerouslyAllowNameMatching: true`, e entradas não resolvidas são ignoradas em tempo de execução. Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissões `users` por sala também são compatíveis.
    - As MDs em grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: as listas de permissões de remetentes aceitam apenas IDs numéricos de usuário (`"123456789"`; os prefixos `telegram:`/`tg:` são removidos sem diferenciar maiúsculas de minúsculas). Entradas `@username` não correspondem em tempo de execução e registram um aviso; a configuração resolve `@username` para IDs. IDs de chat negativos pertencem a `channels.telegram.groups`, não às listas de permissões de remetentes.
    - O padrão é `groupPolicy: "allowlist"`; se sua lista de permissões de grupo estiver vazia, as mensagens de grupo serão bloqueadas.
    - Segurança em tempo de execução: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo adota de forma segura `allowlist`, em vez de herdar `channels.defaults.groupPolicy`, e o Gateway registra a alternativa uma vez por conta.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação das mensagens de grupo):

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

Mensagens de grupo exigem uma menção, salvo quando substituído por grupo. Os padrões ficam em cada subsistema, em `*.groups."*"`.

Responder a uma mensagem do bot conta como uma menção implícita quando o canal disponibiliza metadados de resposta; citar uma mensagem do bot também pode contar em canais que disponibilizam metadados de citação. Casos integrados atuais: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp e Zalo pessoal.

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

Os `mentionPatterns` configurados são gatilhos alternativos de expressão regular. Use-os quando a plataforma não disponibilizar uma menção nativa ao bot ou quando texto simples, como `openclaw:`, deva contar como uma menção. As menções nativas da plataforma são separadas: quando Discord, Slack, Telegram, Matrix ou outro canal consegue comprovar que a mensagem mencionou explicitamente o bot, essa menção nativa ainda aciona o agente mesmo onde os padrões de expressão regular configurados são negados.

Por padrão, os padrões de menção configurados se aplicam em todos os lugares onde o canal fornece informações do provedor e da conversa à detecção de menções. Para impedir que padrões amplos despertem o agente em todos os grupos, defina o escopo deles por canal com `channels.<channel>.mentionPatterns`.

Use `mode: "deny"` quando os padrões de menção por expressão regular devam ficar desativados por padrão em um canal e, depois, habilite salas específicas com `allowIn`:

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

Use o padrão `mode: "allow"` (ou omita `mode`) quando os padrões de menção por expressão regular devam ser aplicados amplamente e, depois, desative-os em salas ruidosas com `denyIn`:

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

| Campo           | Efeito                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Os padrões de menção por expressão regular ficam habilitados, salvo quando o ID da conversa está em `denyIn`. Esse é o padrão.            |
| `mode: "deny"`  | Os padrões de menção por expressão regular ficam desabilitados, salvo quando o ID da conversa está em `allowIn`.                          |
| `allowIn`       | IDs de conversa em que os padrões de menção por expressão regular ficam habilitados no modo de negação.                                  |
| `denyIn`        | IDs de conversa em que os padrões de menção por expressão regular ficam desabilitados. `denyIn` prevalece sobre `allowIn` se ambos incluírem o mesmo ID. |

Política de expressão regular com escopo compatível atualmente:

| Canal    | IDs usados em `allowIn` / `denyIn`                                     |
| -------- | ---------------------------------------------------------------------- |
| Discord  | IDs de canal do Discord.                                               |
| Matrix   | IDs de sala do Matrix.                                                 |
| Slack    | IDs de canal do Slack.                                                 |
| Telegram | IDs de chat de grupo ou `chatId:topic:threadId` para tópicos de fórum. |
| WhatsApp | IDs de conversa do WhatsApp, como `123@g.us`.                          |

Configurações de canal no nível da conta podem definir a mesma política em `channels.<channel>.accounts.<accountId>.mentionPatterns` quando esse canal aceita várias contas. A política da conta prevalece sobre a política do canal no nível superior para essa conta.

<AccordionGroup>
  <Accordion title="Observações sobre a exigência de menção">
    - `mentionPatterns` são padrões seguros de expressão regular que não diferenciam maiúsculas de minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados (com um aviso).
    - Precedência dos padrões: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo) substitui `messages.groupChat.mentionPatterns`; quando nenhum dos dois é definido, os padrões são derivados do nome/emoji da identidade do agente.
    - A exigência de menção só é aplicada quando a detecção de menções é possível (menções nativas ou `mentionPatterns` configurados).
    - Permitir um grupo ou remetente pela lista de permissões não desativa a exigência de menção; defina `requireMention` desse grupo como `false` quando todas as mensagens devam acionar o agente.
    - O contexto automático do prompt de chat em grupo inclui a instrução resolvida de resposta silenciosa em cada interação; os arquivos do espaço de trabalho não devem duplicar os mecanismos de `NO_REPLY`.
    - Grupos nos quais respostas silenciosas automáticas são permitidas tratam interações do modelo completamente vazias ou somente com raciocínio como silenciosas, equivalentes a `NO_REPLY`. Chats diretos nunca recebem orientação de `NO_REPLY`, e respostas de grupo feitas somente pela ferramenta de mensagens permanecem silenciosas ao não chamar `message(action=send)`.
    - Conversas ambientes de grupo sempre ativas usam a semântica de solicitação do usuário por padrão. Defina `messages.groupChat.unmentionedInbound: "room_event"` para enviá-las como contexto silencioso. Consulte [Eventos ambientes de sala](/pt-BR/channels/ambient-room-events) para ver exemplos de configuração.
    - Eventos de sala não são armazenados como solicitações falsas do usuário, e o texto privado do assistente proveniente de eventos de sala sem ferramenta de mensagens não é reproduzido como histórico do chat.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituíveis por servidor/canal).
    - O contexto do histórico de grupos é encapsulado uniformemente entre os canais. Grupos com exigência de menção mantêm mensagens pendentes ignoradas; grupos sempre ativos também podem reter mensagens recentes da sala já processadas quando o canal oferece essa compatibilidade. Use `messages.groupChat.historyLimit` como padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desabilitar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas por grupo/canal (opcional)

Algumas configurações de canal permitem restringir quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para todo o grupo (`allow`, `alsoAllow`, `deny`; a negação prevalece).
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos de chave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e o curinga `"*"`. Os IDs de canal usam IDs canônicos de canal do OpenClaw; aliases como `teams` são normalizados para `msteams`. Chaves legadas sem prefixo ainda são aceitas, correspondem apenas como `id:` e registram um aviso de descontinuação.

Ordem de resolução (o mais específico prevalece):

<Steps>
  <Step title="toolsBySender do grupo">
    Correspondência de `toolsBySender` do grupo/canal.
  </Step>
  <Step title="Ferramentas do grupo">
    `tools` do grupo/canal.
  </Step>
  <Step title="toolsBySender padrão">
    Correspondência de `toolsBySender` padrão (`"*"`).
  </Step>
  <Step title="Ferramentas padrão">
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
As restrições de ferramentas por grupo/canal são aplicadas além da política global/de ferramentas do agente (a negação ainda prevalece). Alguns canais usam aninhamentos diferentes para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permissões de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves funcionam como uma lista de permissões de grupo. Use `"*"` para permitir todos os grupos e ainda definir o comportamento padrão de menção.

<Warning>
Confusão comum: a aprovação de pareamento por MD não é o mesmo que autorização de grupo. Nos canais compatíveis com pareamento por MD, o armazenamento de pareamentos desbloqueia apenas as MDs. Os comandos de grupo ainda exigem autorização explícita do remetente do grupo por meio de listas de permissões da configuração, como `groupAllowFrom`, ou do fallback de configuração documentado para esse canal.
</Warning>

Intenções comuns (copie e cole):

<Tabs>
  <Tab title="Desativar todas as respostas em grupos">
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

`/activation` é um comando central restrito ao proprietário e se aplica apenas a conversas em grupo. Proprietário significa que o remetente corresponde a `allowFrom` / `commands.ownerAllowFrom` do canal (quando nenhuma lista de permissões está configurada, o próprio id da conta conta como proprietário). O modo armazenado substitui o `requireMention` desse grupo nos canais que o consultam (Google Chat, QQBot, Telegram, WhatsApp), e a introdução do prompt de sistema do grupo reflete o modo ativo em todos os canais.

## Campos de contexto

As cargas de entrada de grupos definem:

- `ChatType=group`
- `GroupSubject` (se conhecido)
- `GroupMembers` (se conhecidos)
- `WasMentioned` (resultado da verificação de menção)
- Os tópicos de fórum do Telegram também incluem `MessageThreadId` e `IsForum`.

O prompt de sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo (e após alterações em `/activation`). Ela orienta o modelo a responder como uma pessoa, minimizar linhas vazias, seguir o espaçamento normal de conversas e evitar digitar sequências literais `\n`. Grupos que não são do Telegram também desencorajam tabelas Markdown; as orientações de rich text do Telegram vêm do prompt do canal Telegram. Nomes de grupos e rótulos de participantes provenientes do canal são renderizados como metadados não confiáveis em blocos cercados, não como instruções de sistema em linha.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou adicionar a uma lista de permissões.
- Liste as conversas: `imsg chats --limit 20`.
- As respostas de grupo sempre retornam ao mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para ver as regras canônicas de prompts de sistema do WhatsApp, incluindo a resolução de prompts de grupo e diretos, o comportamento de curingas e a semântica de substituição por conta.

## Especificidades do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para ver o comportamento exclusivo do WhatsApp (injeção de histórico e detalhes do tratamento de menções).

## Relacionados

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
