---
read_when:
    - Alterar o comportamento de conversas em grupo ou o controle por menções
sidebarTitle: Groups
summary: Comportamento de conversas em grupo em diferentes superfícies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-05-11T20:20:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata chats em grupo de forma consistente entre superfícies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introdução para iniciantes (2 minutos)

OpenClaw "vive" nas suas próprias contas de mensagens. Não há um usuário de bot separado no WhatsApp. Se **você** está em um grupo, o OpenClaw consegue ver esse grupo e responder ali.

Comportamento padrão:

- Grupos são restritos (`groupPolicy: "allowlist"`).
- Respostas exigem uma menção, a menos que você desative explicitamente a exigência de menção.
- Respostas finais normais em grupos/canais são privadas por padrão. A saída visível na sala usa a ferramenta `message`.

Tradução: remetentes em allowlist podem acionar o OpenClaw mencionando-o.

<Note>
**TL;DR**

- **Acesso por DM** é controlado por `*.allowFrom`.
- **Acesso a grupos** é controlado por `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- **Acionamento de resposta** é controlado pela exigência de menção (`requireMention`, `/activation`).

</Note>

Fluxo rápido (o que acontece com uma mensagem de grupo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Respostas visíveis

Para salas de grupo/canal, o padrão do OpenClaw é `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` grava esse padrão nas configurações de canais configurados que o omitem.
Isso significa que o agente ainda processa o turno e pode atualizar o estado de memória/sessão, mas sua resposta final normal não é postada automaticamente de volta na sala. Para falar de forma visível, o agente usa `message(action=send)`.

Esse padrão depende de um modelo/runtime que chame ferramentas de forma confiável. Se os logs mostrarem
texto do assistente, mas `didSendViaMessagingTool: false`, o modelo respondeu
em privado em vez de chamar a ferramenta de mensagem. Isso não é uma falha de envio do
Discord/Slack/Telegram. Use um modelo confiável em chamadas de ferramenta para
sessões de grupo/canal, ou defina
`messages.groupChat.visibleReplies: "automatic"` para restaurar as respostas finais
visíveis legadas.

Se a ferramenta de mensagem estiver indisponível sob a política de ferramentas ativa, o OpenClaw volta
para respostas visíveis automáticas em vez de suprimir a resposta silenciosamente.
`openclaw doctor` avisa sobre essa incompatibilidade.

Para chats diretos e qualquer outro turno de origem, use `messages.visibleReplies: "message_tool"` para aplicar globalmente o mesmo comportamento de resposta visível somente por ferramenta. Harnesses também podem escolher isso como seu padrão não definido; o harness Codex faz isso para chats diretos em modo Codex. `messages.groupChat.visibleReplies` continua sendo a substituição mais específica para salas de grupo/canal.

Isso substitui o antigo padrão de forçar o modelo a responder `NO_REPLY` para a maioria dos turnos em modo de observação. No modo somente por ferramenta, não fazer nada visível significa simplesmente não chamar a ferramenta de mensagem.

Indicadores de digitação ainda são enviados enquanto o agente trabalha em modo somente por ferramenta. O modo padrão de digitação em grupo é atualizado de "message" para "instant" nesses turnos porque pode nunca haver texto normal de mensagem do assistente antes de o agente decidir se deve chamar a ferramenta de mensagem. A configuração explícita de modo de digitação ainda prevalece.

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

O Gateway recarrega a configuração de `messages` a quente depois que o arquivo é salvo. Reinicie somente
quando o monitoramento de arquivos ou o recarregamento de configuração estiver desativado no deployment.

Para exigir que a saída visível passe pela ferramenta de mensagem em todo chat de origem:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Comandos slash nativos (Discord, Telegram e outras superfícies com suporte nativo a comandos) ignoram `visibleReplies: "message_tool"` e sempre respondem de forma visível para que a UI de comandos nativa do canal receba a resposta esperada. Isso se aplica apenas a turnos de comando nativo validados; comandos `/...` digitados como texto e turnos de chat comuns ainda seguem o padrão de grupo configurado.

## Visibilidade de contexto e allowlists

Dois controles diferentes estão envolvidos na segurança de grupos:

- **Autorização de acionamento**: quem pode acionar o agente (`groupPolicy`, `groups`, `groupAllowFrom`, allowlists específicas de canal).
- **Visibilidade de contexto**: qual contexto suplementar é injetado no modelo (texto de resposta, citações, histórico de thread, metadados encaminhados).

Por padrão, o OpenClaw prioriza o comportamento normal de chat e mantém o contexto majoritariamente como recebido. Isso significa que allowlists decidem principalmente quem pode acionar ações, não uma fronteira universal de redação para todo trecho citado ou histórico.

<AccordionGroup>
  <Accordion title="O comportamento atual é específico por canal">
    - Alguns canais já aplicam filtragem baseada em remetente para contexto suplementar em caminhos específicos (por exemplo, semeadura de threads no Slack, buscas de resposta/thread no Matrix).
    - Outros canais ainda passam contexto de citação/resposta/encaminhamento como recebido.

  </Accordion>
  <Accordion title="Direção de endurecimento (planejada)">
    - `contextVisibility: "all"` (padrão) mantém o comportamento atual como recebido.
    - `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes em allowlist.
    - `contextVisibility: "allowlist_quote"` é `allowlist` mais uma exceção explícita de citação/resposta.

    Até que esse modelo de endurecimento seja implementado de forma consistente entre canais, espere diferenças por superfície.

  </Accordion>
</AccordionGroup>

![Fluxo de mensagem de grupo](/images/groups-flow.svg)

Se você quiser...

| Objetivo                                     | O que definir                                             |
| -------------------------------------------- | --------------------------------------------------------- |
| Permitir todos os grupos, mas responder apenas a @menções | `groups: { "*": { requireMention: true } }`                |
| Desativar todas as respostas em grupo        | `groupPolicy: "disabled"`                                  |
| Apenas grupos específicos                    | `groups: { "<group-id>": { ... } }` (sem chave `"*"` )     |
| Só você pode acionar em grupos               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar um conjunto de remetentes confiáveis entre canais | `groupAllowFrom: ["accessGroup:operators"]`                |

Para allowlists reutilizáveis de remetentes, consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Chaves de sessão

- Sessões de grupo usam chaves de sessão `agent:<agentId>:<channel>:group:<id>` (salas/canais usam `agent:<agentId>:<channel>:channel:<id>`).
- Tópicos de fórum do Telegram adicionam `:topic:<threadId>` ao id do grupo para que cada tópico tenha sua própria sessão.
- Chats diretos usam a sessão principal (ou por remetente, se configurado).
- Heartbeats são ignorados para sessões de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Padrão: DMs pessoais + grupos públicos (agente único)

Sim — isso funciona bem se o seu tráfego "pessoal" são **DMs** e o seu tráfego "público" são **grupos**.

Motivo: no modo de agente único, DMs normalmente chegam na chave de sessão **principal** (`agent:main:main`), enquanto grupos sempre usam chaves de sessão **não principais** (`agent:main:<channel>:group:<id>`). Se você ativar sandboxing com `mode: "non-main"`, essas sessões de grupo rodam no backend de sandbox configurado, enquanto sua sessão principal de DM permanece no host. Docker é o backend padrão se você não escolher um.

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
  <Tab title="Grupos veem apenas uma pasta em allowlist">
    Quer "grupos podem ver apenas a pasta X" em vez de "sem acesso ao host"? Mantenha `workspaceAccess: "none"` e monte apenas caminhos em allowlist no sandbox:

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
- Depuração de por que uma ferramenta está bloqueada: [Sandbox vs política de ferramentas vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalhes de montagens bind: [Sandboxing](/pt-BR/gateway/sandboxing#custom-bind-mounts)

## Rótulos de exibição

- Rótulos de UI usam `displayName` quando disponível, formatado como `<channel>:<token>`.
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

| Política      | Comportamento                                                |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grupos ignoram allowlists; a exigência de menção ainda se aplica. |
| `"disabled"`  | Bloqueia totalmente todas as mensagens de grupo.             |
| `"allowlist"` | Permite apenas grupos/salas que correspondem à allowlist configurada. |

<AccordionGroup>
  <Accordion title="Observações por canal">
    - `groupPolicy` é separado do controle por menção (que exige @menções).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: use `groupAllowFrom` (fallback: `allowFrom` explícito).
    - Signal: `groupAllowFrom` pode corresponder ao id do grupo Signal de entrada ou ao telefone/UUID do remetente.
    - Aprovações de pareamento de DM (entradas de armazenamento `*-allowFrom`) se aplicam apenas ao acesso por DM; a autorização de remetente em grupo permanece explícita nas listas de permissão de grupo.
    - Discord: a lista de permissão usa `channels.discord.guilds.<id>.channels`.
    - Slack: a lista de permissão usa `channels.slack.channels`.
    - Matrix: a lista de permissão usa `channels.matrix.groups`. Prefira IDs ou aliases de sala; a busca por nome de sala ingressada é de melhor esforço, e nomes não resolvidos são ignorados em runtime. Use `channels.matrix.groupAllowFrom` para restringir remetentes; listas de permissão `users` por sala também são suportadas.
    - DMs de grupo são controladas separadamente (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - A lista de permissão do Telegram pode corresponder a IDs de usuário (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) ou nomes de usuário (`"@alice"` ou `"alice"`); prefixos não diferenciam maiúsculas de minúsculas.
    - O padrão é `groupPolicy: "allowlist"`; se sua lista de permissão de grupo estiver vazia, mensagens de grupo serão bloqueadas.
    - Segurança em runtime: quando um bloco de provedor está completamente ausente (`channels.<provider>` ausente), a política de grupo volta para um modo fechado por falha (normalmente `allowlist`) em vez de herdar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (ordem de avaliação para mensagens de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de permissão de grupo">
    Listas de permissão de grupo (`*.groups`, `*.groupAllowFrom`, lista de permissão específica do canal).
  </Step>
  <Step title="Controle por menção">
    Controle por menção (`requireMention`, `/activation`).
  </Step>
</Steps>

## Controle por menção (padrão)

Mensagens de grupo exigem uma menção, a menos que sejam substituídas por grupo. Os padrões ficam por subsistema em `*.groups."*"`.

Responder a uma mensagem de bot conta como uma menção implícita quando o canal oferece suporte a metadados de resposta. Citar uma mensagem de bot também pode contar como uma menção implícita em canais que expõem metadados de citação. Os casos integrados atuais incluem Telegram, WhatsApp, Slack, Discord, Microsoft Teams e ZaloUser.

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
    - `mentionPatterns` são padrões regex seguros e sem diferenciação de maiúsculas e minúsculas; padrões inválidos e formas inseguras de repetição aninhada são ignorados.
    - Superfícies que fornecem menções explícitas ainda passam; padrões são um fallback.
    - Substituição por agente: `agents.list[].groupChat.mentionPatterns` (útil quando vários agentes compartilham um grupo).
    - O controle por menção só é aplicado quando a detecção de menção é possível (menções nativas ou `mentionPatterns` estão configurados).
    - Colocar um grupo ou remetente em lista de permissão não desativa o controle por menção; defina `requireMention` desse grupo como `false` quando todas as mensagens devem acionar.
    - O contexto de prompt de chat em grupo carrega a instrução resolvida de resposta silenciosa a cada turno; arquivos do workspace não devem duplicar mecânicas de `NO_REPLY`.
    - Grupos em que respostas silenciosas são permitidas tratam turnos de modelo limpos, vazios ou apenas de raciocínio como silenciosos, equivalentes a `NO_REPLY`. Chats diretos fazem o mesmo apenas quando respostas silenciosas diretas são explicitamente permitidas; caso contrário, respostas vazias continuam sendo turnos de agente com falha.
    - Os padrões do Discord ficam em `channels.discord.guilds."*"` (substituível por guilda/canal).
    - O contexto de histórico de grupo é encapsulado de forma uniforme entre canais. Grupos controlados por menção mantêm mensagens pendentes ignoradas; grupos sempre ativos também podem reter mensagens recentes processadas da sala quando o canal oferece suporte. Use `messages.groupChat.historyLimit` para o padrão global e `channels.<channel>.historyLimit` (ou `channels.<channel>.accounts.*.historyLimit`) para substituições. Defina `0` para desativar.

  </Accordion>
</AccordionGroup>

## Restrições de ferramentas de grupo/canal (opcional)

Algumas configurações de canal oferecem suporte a restringir quais ferramentas estão disponíveis **dentro de um grupo/sala/canal específico**.

- `tools`: permite/nega ferramentas para o grupo inteiro.
- `toolsBySender`: substituições por remetente dentro do grupo. Use prefixos de chave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` e curinga `"*"`. IDs de canal usam IDs canônicos de canal do OpenClaw; aliases como `teams` são normalizados para `msteams`. Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.

Ordem de resolução (o mais específico vence):

<Steps>
  <Step title="toolsBySender de grupo">
    Correspondência de `toolsBySender` de grupo/canal.
  </Step>
  <Step title="tools de grupo">
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
Restrições de ferramentas de grupo/canal são aplicadas além da política global/de agente de ferramentas (negação ainda vence). Alguns canais usam aninhamento diferente para salas/canais (por exemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permissão de grupo

Quando `channels.whatsapp.groups`, `channels.telegram.groups` ou `channels.imessage.groups` está configurado, as chaves funcionam como uma lista de permissão de grupo. Use `"*"` para permitir todos os grupos enquanto ainda define o comportamento padrão de menção.

<Warning>
Confusão comum: aprovação de pareamento de DM não é o mesmo que autorização de grupo. Para canais que oferecem suporte a pareamento de DM, o armazenamento de pareamento desbloqueia apenas DMs. Comandos de grupo ainda exigem autorização explícita de remetente de grupo por listas de permissão de configuração como `groupAllowFrom` ou o fallback de configuração documentado para esse canal.
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
  <Tab title="Acionamentos apenas do proprietário (WhatsApp)">
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

## Ativação (apenas proprietário)

Proprietários de grupos podem alternar a ativação por grupo:

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

O prompt do sistema do agente inclui uma introdução de grupo no primeiro turno de uma nova sessão de grupo. Ele lembra o modelo de responder como um humano, evitar tabelas Markdown, minimizar linhas vazias e seguir o espaçamento normal de chat, além de evitar digitar sequências literais `\n`. Nomes de grupos e rótulos de participantes originados do canal são renderizados como metadados não confiáveis cercados por fences, não como instruções de sistema inline.

## Especificidades do iMessage

- Prefira `chat_id:<id>` ao rotear ou colocar em lista de permissão.
- Listar chats: `imsg chats --limit 20`.
- Respostas de grupo sempre retornam para o mesmo `chat_id`.

## Prompts de sistema do WhatsApp

Consulte [WhatsApp](/pt-BR/channels/whatsapp#system-prompts) para as regras canônicas de prompt de sistema do WhatsApp, incluindo resolução de prompt de grupo e direto, comportamento de curinga e semântica de substituição por conta.

## Especificidades do WhatsApp

Consulte [Mensagens de grupo](/pt-BR/channels/group-messages) para comportamento exclusivo do WhatsApp (injeção de histórico, detalhes de tratamento de menção).

## Relacionado

- [Grupos de transmissão](/pt-BR/channels/broadcast-groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Mensagens de grupo](/pt-BR/channels/group-messages)
- [Pareamento](/pt-BR/channels/pairing)
