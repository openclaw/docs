---
read_when:
    - Alterar o roteamento de canais ou o comportamento da caixa de entrada
summary: Regras de roteamento por canal (WhatsApp, Telegram, Discord, Slack) e contexto compartilhado
title: Roteamento de canais
x-i18n:
    generated_at: "2026-05-02T05:41:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Canais e roteamento

O OpenClaw roteia respostas **de volta para o canal de onde uma mensagem veio**. O
modelo não escolhe um canal; o roteamento é determinístico e controlado pela
configuração do host.

## Termos-chave

- **Canal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, além de canais de Plugin. `webchat` é o canal interno da interface WebChat e não é um canal de saída configurável.
- **AccountId**: instância de conta por canal (quando compatível).
- Conta padrão opcional do canal: `channels.<channel>.defaultAccount` escolhe
  qual conta é usada quando um caminho de saída não especifica `accountId`.
  - Em configurações com várias contas, defina um padrão explícito (`defaultAccount` ou `accounts.default`) quando duas ou mais contas estiverem configuradas. Sem isso, o roteamento de fallback pode escolher o primeiro ID de conta normalizado.
- **AgentId**: um workspace isolado + armazenamento de sessão (“cérebro”).
- **SessionKey**: a chave de bucket usada para armazenar contexto e controlar concorrência.

## Prefixos de destino de saída

Destinos de saída explícitos podem incluir um prefixo de provedor, como `telegram:123` ou `tg:123`. O core trata esse prefixo como uma dica de seleção de canal somente quando o canal selecionado é `last` ou ainda não foi resolvido, e somente quando o Plugin carregado anuncia esse prefixo. Se o chamador já selecionou um canal explícito, o prefixo do provedor deve corresponder a esse canal; combinações entre canais, como entrega do WhatsApp para `telegram:123`, falham antes da normalização de destino específica do Plugin.

Prefixos de tipo de destino e serviço, como `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>` e `sms:<number>`, permanecem dentro da gramática do canal selecionado. Eles não selecionam o provedor por conta própria.

## Formatos de chave de sessão (exemplos)

Mensagens diretas são colapsadas para a sessão **principal** do agente por padrão:

- `agent:<agentId>:<mainKey>` (padrão: `agent:main:main`)

Mesmo quando o histórico de conversas por mensagem direta é compartilhado com a sessão principal, a política de sandbox e
ferramentas usa uma chave de runtime de chat direto derivada por conta para DMs externas,
para que mensagens originadas de canal não sejam tratadas como execuções locais da sessão principal.

Grupos e canais permanecem isolados por canal:

- Grupos: `agent:<agentId>:<channel>:group:<id>`
- Canais/salas: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Threads do Slack/Discord acrescentam `:thread:<threadId>` à chave base.
- Tópicos de fórum do Telegram incorporam `:topic:<topicId>` na chave do grupo.

Exemplos:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Fixação da rota principal de DM

Quando `session.dmScope` é `main`, mensagens diretas podem compartilhar uma única sessão principal.
Para impedir que o `lastRoute` da sessão seja sobrescrito por DMs que não sejam do proprietário,
o OpenClaw infere um proprietário fixado a partir de `allowFrom` quando todas estas condições são verdadeiras:

- `allowFrom` tem exatamente uma entrada que não é curinga.
- A entrada pode ser normalizada para um ID de remetente concreto desse canal.
- O remetente da DM de entrada não corresponde a esse proprietário fixado.

Nesse caso de incompatibilidade, o OpenClaw ainda registra metadados da sessão de entrada, mas
ignora a atualização do `lastRoute` da sessão principal.

## Registro de entrada protegido

Plugins de canal podem marcar um registro de sessão de entrada como `createIfMissing: false`
quando um caminho protegido não deve criar uma nova sessão do OpenClaw. Nesse modo,
o OpenClaw pode atualizar metadados e `lastRoute` para uma sessão existente, mas
não cria uma entrada de sessão apenas de rota só porque uma mensagem foi observada.

## Regras de roteamento (como um agente é escolhido)

O roteamento escolhe **um agente** para cada mensagem de entrada:

1. **Correspondência exata de par** (`bindings` com `peer.kind` + `peer.id`).
2. **Correspondência de par pai** (herança de thread).
3. **Correspondência de guild + funções** (Discord) via `guildId` + `roles`.
4. **Correspondência de guild** (Discord) via `guildId`.
5. **Correspondência de equipe** (Slack) via `teamId`.
6. **Correspondência de conta** (`accountId` no canal).
7. **Correspondência de canal** (qualquer conta nesse canal, `accountId: "*"`).
8. **Agente padrão** (`agents.list[].default`, senão a primeira entrada da lista, fallback para `main`).

Quando um binding inclui vários campos de correspondência (`peer`, `guildId`, `teamId`, `roles`), **todos os campos fornecidos devem corresponder** para que esse binding seja aplicado.

O agente correspondente determina qual workspace e armazenamento de sessão são usados.

## Grupos de broadcast (executar vários agentes)

Grupos de broadcast permitem executar **vários agentes** para o mesmo par **quando o OpenClaw normalmente responderia** (por exemplo: em grupos do WhatsApp, após gating por menção/ativação).

Configuração:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Veja: [Grupos de broadcast](/pt-BR/channels/broadcast-groups).

## Visão geral da configuração

- `agents.list`: definições de agentes nomeados (workspace, modelo etc.).
- `bindings`: mapeia canais/contas/pares de entrada para agentes.

Exemplo:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Armazenamento de sessão

Armazenamentos de sessão ficam no diretório de estado (padrão `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcrições JSONL ficam ao lado do armazenamento

Você pode substituir o caminho do armazenamento via `session.store` e templates com `{agentId}`.

A descoberta de sessões do Gateway e do ACP também verifica armazenamentos de agentes baseados em disco sob a
raiz padrão `agents/` e sob raízes de `session.store` com templates. Armazenamentos descobertos
devem permanecer dentro dessa raiz de agente resolvida e usar um arquivo regular
`sessions.json`. Symlinks e caminhos fora da raiz são ignorados.

## Comportamento do WebChat

O WebChat se conecta ao **agente selecionado** e usa por padrão a sessão principal
do agente. Por isso, o WebChat permite ver o contexto entre canais desse
agente em um só lugar.

## Contexto de resposta

Respostas de entrada incluem:

- `ReplyToId`, `ReplyToBody` e `ReplyToSender` quando disponíveis.
- O contexto citado é acrescentado a `Body` como um bloco `[Replying to ...]`.

Isso é consistente entre canais.

## Relacionados

- [Grupos](/pt-BR/channels/groups)
- [Grupos de broadcast](/pt-BR/channels/broadcast-groups)
- [Pareamento](/pt-BR/channels/pairing)
